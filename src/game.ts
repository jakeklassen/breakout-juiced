import { World } from '@jakeklassen/ecs';
import { BallTag } from './components/BallTag';
import { BoxCollider2d } from './components/BoxCollider2d';
import { Color } from './components/Color';
import { Rectangle } from './components/Rectangle';
import { Transform } from './components/Transform';
import { Velocity2d } from './components/Velocity2d';
import levels from './levels.png';
import { Vector2d } from './lib/Vector2d';
import { MovementSystem } from './systems/MovementSystem';
import { RenderingSystem } from './systems/RenderingSystem';
import { WorldCollisionSystem } from './systems/WorldCollisionSystem';
import { PaddleMovementSystem } from './systems/PaddleMovementSystem';
import { PaddleTag } from './components/PaddleTag';
import { clamp } from './lib/math';

const canvas = document.createElement('canvas') as HTMLCanvasElement;
canvas.width = 640;
canvas.height = 360;
const mouse = {
  x: 0,
};

const config = {
  paddle: {
    width: 104,
    height: 16
  }
};

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

(document.querySelector('#container') as Element).appendChild(canvas);

const mouseMove = (e: MouseEvent) => {
  mouse.x += e.movementX;
  mouse.x = clamp(mouse.x, 0, canvas.width - config.paddle.width);
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

const world = new World();
const ball = world.createEntity();
const paddle = world.createEntity();

world.addEntityComponent(ball, new BallTag());
world.addEntityComponent(ball, new Transform(Vector2d.zero()));
world.addEntityComponent(ball, new BoxCollider2d(0, 0, 12, 12));
world.addEntityComponent(ball, new Rectangle(12, 12));
world.addEntityComponent(ball, new Color('white'));
world.addEntityComponent(ball, new Velocity2d(300, 180));

world.addEntityComponent(
  paddle,
  new Transform(new Vector2d(canvas.width / 2 - 104 / 2, canvas.height - 32)),
);
world.addEntityComponent(paddle, new Rectangle(config.paddle.width, config.paddle.height));
world.addEntityComponent(paddle, new Color('white'));
world.addEntityComponent(paddle, new PaddleTag());

world.addSystem(new MovementSystem());
world.addSystem(
  new WorldCollisionSystem(new Rectangle(canvas.width, canvas.height)),
);
world.addSystem(new PaddleMovementSystem(mouse));
world.addSystem(new RenderingSystem(canvas, mouse));

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

const loadImage = (path: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = err => reject(err);

    image.src = path;
  });

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

let dt = 0;
let last = performance.now();

function frame(hrt: DOMHighResTimeStamp) {
  dt = (hrt - last) / 1000;

  world.updateSystems(dt);

  last = hrt;

  requestAnimationFrame(frame);
}

loadImage(levels)
  .then(async image => {
    game.levelManager = createLevelManager({
      image,
      levelWidth: LEVEL_WIDTH_UNITS,
      levelHeight: LEVEL_HEIGHT_UNITS,
      brickWidth: BRICK_WIDTH_PX,
      brickHeight: BRICK_HEIGHT_PX,
      brickXOffset: BRICK_PADDING_SIDE_PX,
      brickYOffset: BRICK_PADDING_TOP_PX,
    });

    game.reset();

    requestAnimationFrame(frame);
  })
  .catch(error => {
    console.error(error);
    alert('Error loading image - check console');
  });
