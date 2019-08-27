import { System, World } from '@jakeklassen/ecs';
import SAT from 'sat';
import { BoxCollider2d } from '../components/BoxCollider2d';
import { BallTag } from '../components/BallTag';
import { BrickTag } from '../components/BrickTag';
import { intersects } from '../lib/aabb';
import { Velocity2d } from '../components/Velocity2d';
import { Transform } from '../components/Transform';
import { Vector2d } from '../lib/Vector2d';

const boxCollider2dToSATBox = (collider: BoxCollider2d) =>
  new SAT.Box(
    new SAT.Vector(collider.x, collider.y),
    collider.width,
    collider.height,
  );
export class BallBrickCollisionSystem extends System {
  update(world: World, dt: number): void {
    const ball = world.findEntity(BallTag)!;
    const ballComponents = world.getEntityComponents(ball)!;
    const ballTransform = ballComponents.get<Transform>(Transform)!;
    const ballCollider = ballComponents.get<BoxCollider2d>(BoxCollider2d)!;
    const ballVelocity = ballComponents.get<Velocity2d>(Velocity2d)!;

    // Query the world for bricks
    const bricks = world.view(BrickTag);

    const collisions: BoxCollider2d[] = [];

    for (const [brick, components] of bricks) {
      const brickCollider = components.get<BoxCollider2d>(BoxCollider2d)!;

      // Store all collisions. We will want to find the closest collider
      // to solve for.
      if (intersects(ballCollider, brickCollider)) {
        collisions.push(brickCollider);
      }
    }

    if (collisions.length === 0) {
      return;
    }

    // Find the closest collider to the ball collider based on the
    // center of the colliders.
    const closestCollider = collisions.reduce((closest, collider) => {
      if (
        Vector2d.distanceBetween(ballCollider.center, collider.center) <
        Vector2d.distanceBetween(ballCollider.center, closest.center)
      ) {
        closest = collider;
      }

      return closest;
    }, collisions[0]);

    const response = new SAT.Response();
    const ballBox = boxCollider2dToSATBox(ballCollider);
    const brickBox = boxCollider2dToSATBox(closestCollider);

    // Use SAT to get the overlap vector.
    SAT.testPolygonPolygon(ballBox.toPolygon(), brickBox.toPolygon(), response);

    // Subtract the overlap vector from our transform/collider
    ballTransform.position.y = ballCollider.y =
      ballCollider.y - response.overlapV.y;
    ballTransform.position.x = ballCollider.x =
      ballCollider.x - response.overlapV.x;

    // `overlapN` is a normalized vector (0 - 1). Just flip velocity based
    // on direction.
    if (Math.abs(response.overlapN.y) !== 0) {
      ballVelocity.flipY();
    }

    if (Math.abs(response.overlapN.x) !== 0) {
      ballVelocity.flipX();
    }
  }
}
