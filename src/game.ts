import { clamp } from './lib/math';
import levels from './levels.png';

const canvas = document.createElement('canvas') as HTMLCanvasElement;
canvas.width = 640;
canvas.height = 360;

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

(document.querySelector('#container') as Element).appendChild(canvas);

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

type Rectangle = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

// https://developer.mozilla.org/kab/docs/Games/Techniques/2D_collision_detection
// Axis-Aligned Bounding Box - no rotation
const intersects = (rect1: Rectangle, rect2: Rectangle) =>
  rect1.left < rect2.right &&
  rect1.right > rect2.left &&
  rect1.top < rect2.bottom &&
  rect1.bottom > rect2.top;

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

const mouse = {
  x: 0,
};

const ball = {
  state: States.Ball.OnPaddle,
  x: 0,
  y: 0,
  width: 12,
  height: 12,
  vx: 100,
  vy: -180,
  maxVelocityY: 400,
  launchVelocityX: 100,
  launchVelocityY: 180,
  paddleBounceSpeedX: 250,
  collidedWithPaddleOnX: false,
  last: {
    x: 0,
    y: 0,
  },
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
  reset() {
    this.state = States.Ball.OnPaddle;
    this.vx = this.launchVelocityX;
    this.vy = this.launchVelocityY;
  },
};

const paddle = {
  x: canvas.width / 2 - 104 / 2,
  y: canvas.height - 32,
  width: 104,
  height: 16,
  get centerX() {
    return this.x + this.width / 2;
  },
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
};

let dt = 0;
let last = performance.now();

function frame(hrt: DOMHighResTimeStamp) {
  dt = (hrt - last) / 1000;

  // Center paddle horizontall on mouse
  paddle.x = mouse.x - paddle.width / 2;

  // Clamp to screen
  paddle.x = clamp(paddle.x, 0, canvas.width - paddle.width);

  ball.last.x = ball.x;
  ball.last.y = ball.y;

  // Reset every frame
  ball.collidedWithPaddleOnX = false;

  if (ball.state === States.Ball.OnPaddle) {
    ball.x = paddle.centerX - ball.width / 2;
    ball.y = paddle.top - ball.height;
  }

  if (ball.state === States.Ball.Free) {
    ball.x += ball.vx * dt;
  }

  if (intersects(ball, paddle)) {
    ball.collidedWithPaddleOnX = true;

    const closestSide =
      Math.abs(paddle.right - ball.x) < Math.abs(paddle.left - ball.right)
        ? 'right'
        : 'left';

    if (ball.vx > 0) {
      if (closestSide === 'right') {
        ball.x = paddle.right;
      } else {
        ball.x = paddle.left - ball.width;
        ball.vx = -ball.vx;
      }
    } else if (ball.vx < 0) {
      if (closestSide === 'left') {
        ball.x = paddle.left - ball.width;
      } else {
        ball.x = paddle.right;
        ball.vx = -ball.vx;
      }
    }
  }

  for (const brick of game.levelManager.currentLevelBricks) {
    if (brick.visible === false) continue;

    if (intersects(ball, brick)) {
      game.score += BRICK_SCORE;

      ball.vx = -ball.vx;
      brick.visible = false;

      if (ball.x > ball.last.x) {
        ball.x = brick.x - ball.width;
      } else if (ball.x < ball.last.x) {
        ball.x = brick.right;
      }
    }
  }

  if (ball.state === States.Ball.Free) {
    ball.y += ball.vy * dt;
  }

  if (!ball.collidedWithPaddleOnX && intersects(ball, paddle)) {
    ball.y = paddle.top - ball.height;
    ball.vy = -ball.vy;

    const half = paddle.width / 2;
    // How far from the center of the paddle is the ball?
    // The further from the center, the steeper the bounce.
    const difference = paddle.centerX - ball.x - ball.width / 2;
    // At this point difference is between 0..half, but we need this
    // as a percentage from 0..1.
    const factor = Math.abs(difference) / half;
    // We'll flip the sign of difference and multiply by our target
    // bounce velocity and factor. This gives us "control" of the ball.
    ball.vx = Math.sign(-difference) * ball.paddleBounceSpeedX * factor;
  }

  for (const brick of game.levelManager.currentLevelBricks) {
    if (brick.visible === false) continue;

    if (intersects(ball, brick)) {
      game.score += BRICK_SCORE;

      ball.vy += Math.sign(ball.vy) * BRICK_COLLISION_Y_SPEED_BOOST_PX;
      ball.vy =
        clamp(Math.abs(ball.vy), Math.abs(ball.vy), ball.maxVelocityY) *
        Math.sign(ball.vy);

      ball.vy = -ball.vy;
      brick.visible = false;

      if (ball.y > ball.last.y) {
        ball.y = brick.y - ball.height;
      } else if (ball.y < ball.last.y) {
        ball.y = brick.bottom;
      }
    }
  }

  if (ball.right > canvas.width) {
    ball.x = canvas.width - ball.width;
    ball.vx = -ball.vx;
  } else if (ball.x < 0) {
    ball.x = 0;
    ball.vx = -ball.vx;
  }

  if (ball.bottom > canvas.height) {
    ball.reset();
    ball.y = canvas.height - ball.height;
    ball.vy = -ball.vy;

    game.playerLives--;
    if (game.playerLives <= 0) {
      game.state = States.Game.GameOver;
    }
  } else if (ball.y < TITLE_BAR_HEIGHT) {
    ball.y = TITLE_BAR_HEIGHT;
    ball.vy = -ball.vy;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw title bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(0, 0, canvas.width, TITLE_BAR_HEIGHT);

  ctx.fillStyle = 'white';
  ctx.font = '16px serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Level: ${game.levelManager.currentLevelNumber}`,
    canvas.width / 2,
    18,
  );
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${game.score}`, 16, 18);
  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${game.playerLives}`, canvas.width - 16, 18);

  if (game.state === States.Game.Playing) {
    // Draw entities
    ctx.fillStyle = 'white';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillRect(ball.x, ball.y, ball.width, ball.height);

    for (const brick of game.levelManager.currentLevelBricks) {
      if (brick.visible === false) continue;

      ctx.fillStyle = brick.rgba;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    }
  } else if (game.state === States.Game.GameOver) {
    ctx.textAlign = 'center';

    ctx.fillText(
      'Game Over... Click to Restart',
      canvas.width / 2,
      canvas.height / 2,
    );
  } else if (game.state === States.Game.GameWon) {
    ctx.textAlign = 'center';

    ['You Won!', `Your Score Was ${game.score}`, 'Click to Restart'].forEach(
      (line, idx) => {
        ctx.fillText(line, canvas.width / 2, canvas.height / 2 + idx * 18);
      },
    );
  }

  last = hrt;

  if (game.levelManager.isCurrentLevelWon) {
    if (game.levelManager.hasNextLevel) {
      game.levelManager.gotoNextLevel();
      ball.reset();
    } else {
      game.state = States.Game.GameWon;
    }
  }

  requestAnimationFrame(frame);
}

function mouseMoveHandler(e: MouseEvent) {
  const relativeX = e.clientX - canvas.offsetLeft;

  if (relativeX > 0 && relativeX < canvas.width) {
    mouse.x = relativeX;
  }
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

    canvas.addEventListener('mousemove', mouseMoveHandler, false);
    canvas.addEventListener(
      'click',
      () => {
        if ([States.Game.GameOver].includes(game.state)) {
          ball.state = States.Ball.OnPaddle;
          game.reset();
        } else if (ball.state === States.Ball.OnPaddle) {
          ball.state = States.Ball.Free;
        }
      },
      false,
    );

    requestAnimationFrame(frame);
  })
  .catch(error => {
    console.error(error);
    alert('Error loading image - check console');
  });
