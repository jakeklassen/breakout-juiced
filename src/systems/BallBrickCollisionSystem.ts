import { System, World } from '@jakeklassen/ecs';
import { BoxCollider2d } from '../components/BoxCollider2d';
import { BallTag } from '../components/BallTag';
import { BrickTag } from '../components/BrickTag';
import { intersects } from '../lib/aabb';
import { Velocity2d } from '../components/Velocity2d';
import { Transform } from '../components/Transform';

export class BallBrickCollisionSystem extends System {
  update(world: World, dt: number): void {
    const ball = world.findEntity(BallTag)!;
    const ballComponents = world.getEntityComponents(ball)!;
    const ballTransform = ballComponents.get<Transform>(Transform)!;
    const ballCollider = ballComponents.get<BoxCollider2d>(BoxCollider2d)!;
    const ballVelocity = ballComponents.get<Velocity2d>(Velocity2d)!;

    // Query the world for bricks
    const bricks = world.view(BrickTag);

    // Solve for Y
    for (const [brick, components] of bricks) {
      const brickCollider = components.get<BoxCollider2d>(BoxCollider2d)!;

      const tempBallRect = new BoxCollider2d(
        0,
        ballCollider.y,
        ballCollider.width,
        ballCollider.height,
      );
      const tempBrickRect = new BoxCollider2d(
        0,
        brickCollider.y,
        brickCollider.width,
        brickCollider.height,
      );

      if (intersects(tempBallRect, tempBrickRect)) {
        // Snap to bottom of collider
        if (ballVelocity.y < 0) {
          ballCollider.y = ballTransform.position.y = brickCollider.bottom;
        } else if (ballVelocity.y > 0) {
          ballCollider.y = ballTransform.position.y =
            brickCollider.top - brickCollider.height;
        }
        ballVelocity.flipY();
        return;
      }
    }

    // Solve for X
    for (const [brick, components] of bricks) {
      const brickCollider = components.get<BoxCollider2d>(BoxCollider2d)!;
      if (
        intersects(ballCollider, brickCollider) &&
        (ballCollider.left > brickCollider.left ||
          ballCollider.right < brickCollider.right)
      ) {
        console.log('wtf');
        ballVelocity.flipX();
        return;
      }
    }
  }
}
