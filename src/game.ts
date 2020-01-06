import { World } from '@jakeklassen/ecs';
import { BallTag } from './components/BallTag';
import { BoxCollider2d } from './components/BoxCollider2d';
import { BrickTag } from './components/BrickTag';
import { Color } from './components/Color';
import { PaddleTag } from './components/PaddleTag';
import { Rectangle } from './components/Rectangle';
import { Transform } from './components/Transform';
import { Velocity2d } from './components/Velocity2d';
import {
  ballConfig,
  brickConfig,
  game,
  levelConfig,
  paddleConfig,
  uiConfig,
} from './game.config';
import levels from './juiced.png';
import { loadImage } from './lib/assets';
import { clamp } from './lib/math';
import { Vector2d } from './lib/Vector2d';
import { PaddleMovementSystem } from './systems/PaddleMovementSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { RenderingSystem } from './systems/RenderingSystem';
import { ScoreRenderingSystem } from './systems/ScoreRenderingSystem';

const canvas = document.createElement('canvas') as HTMLCanvasElement;
canvas.width = 360;
canvas.height = 640;
const mouse = {
  x: 0,
};

(document.querySelector('#container') as Element).appendChild(canvas);

const mouseMove = (e: MouseEvent) => {
  mouse.x += e.movementX;
  mouse.x = clamp(mouse.x, 0, canvas.width - paddleConfig.width);
};

document.addEventListener(
  'pointerlockchange',
  () => {
    if (document.pointerLockElement === canvas) {
      canvas.addEventListener('mousemove', mouseMove, false);
    } else {
      canvas.removeEventListener('mousemove', mouseMove, false);
    }
  },
  false,
);

canvas.addEventListener(
  'click',
  () => {
    canvas.requestPointerLock();
  },
  false,
);

// Game kickoff point
loadImage(levels)
  .then(async image => {
    let dt = 0;
    let last = performance.now();

    function frame(hrt: DOMHighResTimeStamp) {
      dt = (hrt - last) / 1000;

      world.updateSystems(dt);

      last = hrt;

      requestAnimationFrame(frame);
    }

    const world = new World();
    const ball = world.createEntity();
    const paddle = world.createEntity();

    world.addEntityComponents(
      ball,
      new BallTag(),
      new Transform(new Vector2d(canvas.width / 2, canvas.height / 2)),
      new BoxCollider2d(0, 0, 12, 12),
      new Rectangle(12, 12),
      new Color('white'),
      new Velocity2d(ballConfig.minXVelocity, ballConfig.minYVelocity),
    );

    world.addEntityComponents(
      paddle,
      new Transform(
        new Vector2d(
          canvas.width / 2 - paddleConfig.width / 2,
          canvas.height - paddleConfig.worldYOffset,
        ),
      ),
      new Rectangle(paddleConfig.width, paddleConfig.height),
      new Color('white'),
      new PaddleTag(),
      new BoxCollider2d(
        0,
        canvas.height - paddleConfig.worldYOffset,
        paddleConfig.width,
        paddleConfig.height,
      ),
    );

    // Temporary canvas to render level on and read pixel data from
    const level = 1;
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = image.width;
    tmpCanvas.height = image.height;
    const ctx = tmpCanvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(
      image,
      0,
      (level - 1) * levelConfig.height,
      levelConfig.width,
      levelConfig.height,
      0,
      0,
      levelConfig.width,
      levelConfig.height,
    );

    // Generate entities/components for bricks
    for (let row = 0; row < levelConfig.height; ++row) {
      for (let col = 0; col < levelConfig.width; ++col) {
        const pixel = ctx.getImageData(col, row, 1, 1);
        const data = pixel.data;
        const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] /
          255})`;

        // Transparent pixel, no brick.
        // NOTE: Alpha is expressed in the range of 0 - 1, so we normalize the value
        // by dividing by 255.
        if (data[3] / 255 === 0) {
          continue;
        }

        const brick = world.createEntity();
        world.addEntityComponents(
          brick,
          new BrickTag(),
          new Color(rgba),
          new Transform(
            new Vector2d(
              col * brickConfig.width,
              row * brickConfig.height + uiConfig.yOffset,
            ),
          ),
          new BoxCollider2d(
            col * brickConfig.width,
            row * brickConfig.height + uiConfig.yOffset,
            brickConfig.width,
            brickConfig.height,
          ),
          new Rectangle(brickConfig.width, brickConfig.height),
        );
      }
    }

    world.addSystem(new PaddleMovementSystem(mouse));
    world.addSystem(
      new CollisionSystem(
        new Rectangle(canvas.width, canvas.height),
        ballConfig,
        game,
      ),
    );
    world.addSystem(new RenderingSystem(canvas));
    //world.addSystem(new ColliderDebugRenderingSystem(canvas));
    world.addSystem(new ScoreRenderingSystem(game, canvas));

    requestAnimationFrame(frame);
  })
  .catch(error => {
    console.error(error);
    alert('Error loading image - check console');
  });
