export type PaddleConfig = {
  width: number;
  height: number;
  worldYOffset: number;
};

export const paddleConfig: PaddleConfig = {
  width: 104,
  height: 16,
  worldYOffset: 32,
};

export type UIConfig = {
  yOffset: number;
};

export const uiConfig: UIConfig = {
  yOffset: 16,
};

export type BallConfig = {
  paddleBounceSpeedX: number;
  paddleBounceSpeedYIncrement: number;
  minXVelocity: number;
  maxXVelocity: number;
  minYVelocity: number;
  maxYVelocity: number;
};

export const ballConfig: BallConfig = {
  paddleBounceSpeedX: 400,
  paddleBounceSpeedYIncrement: 25,
  minXVelocity: 300,
  maxXVelocity: 800,
  minYVelocity: 180,
  maxYVelocity: 800,
};

export type LevelConfig = {
  width: number;
  height: number;
};

export const levelConfig = {
  width: 9,
  height: 9,
};

export type BrickConfig = {
  width: number;
  height: number;
};

export const brickConfig: BrickConfig = {
  width: 40,
  height: 16,
};

export type Game = {
  score: number;
  lives: number;
  level: number;
};

export const game: Game = {
  score: 0,
  lives: 3,
  level: 2,
};
