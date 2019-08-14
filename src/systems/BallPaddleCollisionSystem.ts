import { System, World } from '@jakeklassen/ecs';
import { Transform } from '../components/Transform';
import { Velocity2d } from '../components/Velocity2d';
import { PaddleTag } from '../components/PaddleTag';
import { BallTag } from '../components/BallTag';
import { BoxCollider2d } from '../components/BoxCollider2d';

export class BallPaddleCollisionSystem extends System {
  update(world: World, dt: number): void {
    // Find the paddle
    const paddle = world.findEntity(PaddleTag)!;
    const paddleComponents = world.getEntityComponents(paddle)!;
    const paddleTransform = paddleComponents.get<Transform>(Transform)!;
    const paddleCollider = paddleComponents.get<BoxCollider2d>(BoxCollider2d)!;

    // Find the ball
    const ball = world.findEntity(BallTag)!;
    const ballComponents = world.getEntityComponents(ball)!;
    const ballTransform = ballComponents.get<Transform>(Transform)!;
    const ballVelocity = ballComponents.get<Velocity2d>(Velocity2d)!;
    const ballCollider = ballComponents.get<BoxCollider2d>(BoxCollider2d)!;

    // TODO: Maybe throw an error here if we don't find our components

    // Detect whether the ball is currently colliding with the paddle
    if (ballCollider.bottom >= paddleCollider.top) {
      ballTransform.position.y =
        paddleTransform.position.y - ballCollider.height;
      ballVelocity.flipY();
    }
  }
}
