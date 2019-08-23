import { World } from '@jakeklassen/ecs';
import { BallTag } from './components/BallTag';
import { BoxCollider2d } from './components/BoxCollider2d';
import { Color } from './components/Color';
import { PaddleTag } from './components/PaddleTag';
import { Rectangle } from './components/Rectangle';
import { Transform } from './components/Transform';
import { Velocity2d } from './components/Velocity2d';
import {
  ballConfig,
  brickConfig,
  levelConfig,
  paddleConfig,
} from './game.config';
import levels from './juiced.png';
import { loadImage } from './lib/assets';
import { clamp } from './lib/math';
import { Vector2d } from './lib/Vector2d';
import { BallPaddleCollisionSystem } from './systems/BallPaddleCollisionSystem';
import { ColliderDebugRenderingSystem } from './systems/ColliderDebugRenderingSystem';
import { MovementSystem } from './systems/MovementSystem';
import { PaddleMovementSystem } from './systems/PaddleMovementSystem';
import { RenderingSystem } from './systems/RenderingSystem';
import { WorldCollisionSystem } from './systems/WorldCollisionSystem';
import { BallBrickCollisionSystem } from './systems/BallBrickCollisionSystem';
import { BrickTag } from './components/BrickTag';

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

const BRICK_COLLISION_Y_SPEED_BOOST_PX = 25;
const BRICK_SCORE = 10;
const BRICK_WIDTH_PX = 32;
const BRICK_HEIGHT_PX = 16;
const BRICK_PADDING_TOP_PX = 48;
const BRICK_PADDING_SIDE_PX = 24;
const LEVEL_WIDTH_UNITS = 18;
const LEVEL_HEIGHT_UNITS = 9;
const TITLE_BAR_HEIGHT = 24;
const PLAYER_STARTING_LIVES = 3;

type GenerateBrickInput = {
  image: HTMLImageElement;
  num: number;
  levelWidth: number;
  levelHeight: number;
  brickWidth: number;
  brickHeight: number;
  brickXOffset: number;
  brickYOffset: number;
};

type Brick = {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  rgba: string;
  visible: boolean;
};

const generateBricks = ({
  image,
  num,
  levelWidth,
  levelHeight,
  brickWidth,
  brickHeight,
  brickXOffset,
  brickYOffset,
}: GenerateBrickInput) => {
  // Temporary canvas to render level on and read pixel data from
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.drawImage(
    image,
    0,
    (num - 1) * LEVEL_HEIGHT_UNITS,
    levelWidth,
    levelHeight,
    0,
    0,
    levelWidth,
    levelHeight,
  );

  const bricks: Brick[] = [];

  for (let row = 0; row < levelHeight; ++row) {
    for (let col = 0; col < levelWidth; ++col) {
      const pixel = ctx.getImageData(col, row, 1, 1);
      const data = pixel.data;
      const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;

      // Transparent pixel, no brick.
      // NOTE: Alpha is expressed in the range of 0 - 1, so we normalize the value
      // by dividing by 255.
      if (data[3] / 255 === 0) continue;

      bricks.push({
        x: col + brickXOffset + col * brickWidth,
        y: row + brickYOffset + row * brickHeight,
        width: brickWidth,
        height: brickHeight,
        get left() {
          return this.x;
        },
        get right() {
          return this.x + this.width;
        },
        get top() {
          return this.y;
        },
        get bottom() {
          return this.y + this.height;
        },
        rgba,
        visible: true,
      });
    }
  }

  return bricks;
};

type CreateLevelManagerInput = {
  image: HTMLImageElement;
  levelWidth: number;
  levelHeight: number;
  brickWidth: number;
  brickHeight: number;
  brickXOffset: number;
  brickYOffset: number;
};

type LevelManager = {
  currentLevelNumber: number;
  currentLevelBricks: Brick[];
  isCurrentLevelWon: boolean;
  hasNextLevel: boolean;
  onLastLevel: boolean;
  changeLevel: (num: number) => void;
  gotoNextLevel: () => void;
};

const createLevelManager = ({
  image,
  levelWidth,
  levelHeight,
  brickWidth,
  brickHeight,
  brickXOffset,
  brickYOffset,
}: CreateLevelManagerInput) => {
  const numberOfLevels = image.height / levelHeight;
  let bricks: Brick[] = [];
  let currentLevel = 0;

  return {
    get currentLevelNumber() {
      return currentLevel;
    },
    get currentLevelBricks() {
      return bricks;
    },
    get isCurrentLevelWon() {
      return bricks.every(brick => brick.visible === false);
    },
    get hasNextLevel() {
      return currentLevel < numberOfLevels;
    },
    get onLastLevel() {
      return currentLevel === numberOfLevels;
    },
    changeLevel(num: number) {
      bricks = generateBricks({
        image,
        num,
        levelWidth,
        levelHeight,
        brickWidth,
        brickHeight,
        brickXOffset,
        brickYOffset,
      });

      currentLevel = num;
    },
    gotoNextLevel() {
      this.changeLevel(currentLevel + 1);
    },
  };
};

const States = {
  Ball: {
    Free: 'free',
    OnPaddle: 'on paddle',
  },
  Game: {
    Playing: 'playing',
    GameOver: 'game over',
    GameWon: 'game won',
  },
};

const game = {
  state: States.Game.Playing,
  playerLives: PLAYER_STARTING_LIVES,
  score: 0,
  levelManager: {} as LevelManager,
  reset() {
    if (this.levelManager == null) {
      throw new Error('Game level manager is not initialized');
    }

    this.state = States.Game.Playing;
    this.score = 0;
    this.playerLives = PLAYER_STARTING_LIVES;
    this.levelManager.changeLevel(1);
  },
};

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
      (level - 1) * LEVEL_HEIGHT_UNITS,
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
            new Vector2d(col * brickConfig.width, row * brickConfig.height),
          ),
          new BoxCollider2d(
            col * brickConfig.width,
            row * brickConfig.height,
            brickConfig.width,
            brickConfig.height,
          ),
          new Rectangle(brickConfig.width, brickConfig.height),
        );
      }
    }

    world.addSystem(new MovementSystem());
    world.addSystem(
      new WorldCollisionSystem(new Rectangle(canvas.width, canvas.height)),
    );
    world.addSystem(new PaddleMovementSystem(mouse));
    world.addSystem(new BallPaddleCollisionSystem(ballConfig));
    world.addSystem(new BallBrickCollisionSystem());
    world.addSystem(new RenderingSystem(canvas));
    world.addSystem(new ColliderDebugRenderingSystem(canvas));

    requestAnimationFrame(frame);
  })
  .catch(error => {
    console.error(error);
    alert('Error loading image - check console');
  });
