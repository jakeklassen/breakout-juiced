import { System, World } from '@jakeklassen/ecs';
import { BallTag } from '../components/BallTag';
import { BoxCollider2d } from '../components/BoxCollider2d';
import { BrickTag } from '../components/BrickTag';
import { PaddleTag } from '../components/PaddleTag';
import { Rectangle } from '../components/Rectangle';
import { Transform } from '../components/Transform';
import { Velocity2d } from '../components/Velocity2d';
import { BallConfig, Game } from '../game.config';
import { intersects } from '../lib/aabb';

export class CollisionSystem extends System {
  constructor(
    private readonly viewport: Rectangle,
    private readonly ballConfig: BallConfig,
    private readonly game: Game,
  ) {
    super();
  }

  update(world: World, dt: number): void {
    const ball = world.findEntity(BallTag)!;
    const ballComponents = world.getEntityComponents(ball)!;
    const ballTransform = ballComponents.get<Transform>(Transform)!;
    const ballVelocity = ballComponents.get<Velocity2d>(Velocity2d)!;
    const ballCollider = ballComponents.get<BoxCollider2d>(BoxCollider2d)!;

    const paddle = world.findEntity(PaddleTag)!;
    const paddleComponents = world.getEntityComponents(paddle)!;
    const paddleCollider = paddleComponents.get<BoxCollider2d>(BoxCollider2d)!;

    // Step and solve collisions in X
    ballTransform.position.x += ballVelocity.x * dt;
    ballCollider.x = ballTransform.position.x;

    let collidedWithPaddleOnX = false;

    if (intersects(ballCollider, paddleCollider)) {
      collidedWithPaddleOnX = true;

      const closestSide =
        Math.abs(paddleCollider.right - ballTransform.position.x) <
        Math.abs(paddleCollider.left - ballCollider.right)
          ? 'right'
          : 'left';

      if (ballVelocity.x > 0) {
        if (closestSide === 'right') {
          ballTransform.position.x = ballCollider.x = paddleCollider.right;
        } else {
          ballTransform.position.x = ballCollider.x =
            paddleCollider.left - ballCollider.width;
          ballVelocity.flipX();
        }
      } else if (ballVelocity.x < 0) {
        if (closestSide === 'left') {
          ballTransform.position.x = ballCollider.x =
            paddleCollider.left - ballCollider.width;
        } else {
          ballTransform.position.x = ballCollider.x = paddleCollider.right;
          ballVelocity.flipX();
        }
      }
    }

    for (const [brick, brickComponents] of world.view(BrickTag)) {
      const brickCollider = brickComponents.get<BoxCollider2d>(BoxCollider2d)!;

      if (intersects(ballCollider, brickCollider)) {
        world.deleteEntity(brick);
        this.game.score += 1;

        if (ballVelocity.x > 0) {
          ballTransform.position.x = ballCollider.x =
            brickCollider.left - ballCollider.width;
        } else if (ballVelocity.x < 0) {
          ballTransform.position.x = ballCollider.x = brickCollider.right;
        }

        ballVelocity.flipX();
      }
    }

    // Step and solve collisions in Y
    ballTransform.position.y += ballVelocity.y * dt;
    ballCollider.y = ballTransform.position.y;

    if (!collidedWithPaddleOnX && intersects(ballCollider, paddleCollider)) {
      ballTransform.position.y = ballCollider.y =
        paddleCollider.top - ballCollider.height;
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

    for (const [brick, brickComponents] of world.view(BrickTag)) {
      const brickCollider = brickComponents.get<BoxCollider2d>(BoxCollider2d)!;

      if (intersects(ballCollider, brickCollider)) {
        world.deleteEntity(brick);
        this.game.score += 1;

        if (ballVelocity.y > 0) {
          ballTransform.position.y = ballCollider.y =
            brickCollider.top - ballCollider.height;
        } else if (ballVelocity.y < 0) {
          ballTransform.position.y = ballCollider.y = brickCollider.bottom;
        }

        ballVelocity.flipY();
      }
    }

    // World bounds check: ball vs viewport
    if (ballCollider.right > this.viewport.width) {
      ballTransform.position.x = this.viewport.width - ballCollider.width;
      ballCollider.x = ballTransform.position.x;
      ballVelocity.flipX();
    } else if (ballCollider.x < 0) {
      ballTransform.position.x = 0;
      ballCollider.x = ballTransform.position.x;
      ballVelocity.flipX();
    }

    if (ballCollider.bottom > this.viewport.height) {
      // Reset ball
      ballTransform.position.y = 0;
      ballTransform.position.x =
        this.viewport.width / 2 - ballCollider.width / 2;
      ballCollider.y = ballTransform.position.y;
      ballCollider.x = ballTransform.position.x;
    } else if (ballCollider.top < 0) {
      ballTransform.position.y = 0;
      ballCollider.y = ballTransform.position.y;
      ballVelocity.flipY();
    }
  }
}
