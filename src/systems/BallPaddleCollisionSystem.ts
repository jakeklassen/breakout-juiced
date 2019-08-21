import { System, World } from '@jakeklassen/ecs';
import { Transform } from '../components/Transform';
import { Velocity2d } from '../components/Velocity2d';
import { PaddleTag } from '../components/PaddleTag';
import { BallTag } from '../components/BallTag';
import { BoxCollider2d } from '../components/BoxCollider2d';
import { intersects } from '../lib/aabb';
import { clamp } from '../lib/math';
import { BallConfig } from '../game.config';

export class BallPaddleCollisionSystem extends System {
  constructor(private readonly ballConfig: BallConfig) {
    super();
  }

  update(world: World, dt: number): void {
    // Find the paddle
    const paddle = world.findEntity(PaddleTag)!;
    const paddleComponents = world.getEntityComponents(paddle)!;
    const paddleCollider = paddleComponents.get<BoxCollider2d>(BoxCollider2d)!;

    // Find the ball
    const ball = world.findEntity(BallTag)!;
    const ballComponents = world.getEntityComponents(ball)!;
    const ballTransform = ballComponents.get<Transform>(Transform)!;
    const ballVelocity = ballComponents.get<Velocity2d>(Velocity2d)!;
    const ballCollider = ballComponents.get<BoxCollider2d>(BoxCollider2d)!;

    // Solve for ball-paddle collision
    // The rule for paddle collision is as long as the ball top is above the paddle top
    // during collision, we always invert velocity in Y. Otherwise pass through and die.
    if (
      intersects(ballCollider, paddleCollider) &&
      ballCollider.top < paddleCollider.top
    ) {
      ballTransform.position.y = paddleCollider.top - ballCollider.height;
      ballCollider.y = ballTransform.position.y;
      ballVelocity.y = clamp(
        ballVelocity.y + this.ballConfig.paddleBounceSpeedYIncrement,
        this.ballConfig.minYVelocity,
        this.ballConfig.maxYVelocity,
      );
      ballVelocity.flipY();

      const half = paddleCollider.width / 2;
      // How far from the center of the paddle is the ball?
      // The further from the center, the steeper the bounce.
      const difference =
        paddleCollider.centerX -
        ballTransform.position.x -
        ballCollider.width / 2;
      // At this point difference is between 0..half, but we need this
      // as a percentage from 0..1.
      const factor = Math.abs(difference) / half;
      // We'll flip the sign of difference and multiply by our target
      // bounce velocity and factor. This gives us "control" of the ball.
      ballVelocity.x =
        Math.sign(-difference) * this.ballConfig.paddleBounceSpeedX * factor;
    }
  }
}
