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
