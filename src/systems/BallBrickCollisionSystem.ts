import { System, World } from '@jakeklassen/ecs';
import SAT from 'sat';
import { BoxCollider2d } from '../components/BoxCollider2d';
import { BallTag } from '../components/BallTag';
import { BrickTag } from '../components/BrickTag';
import { intersects } from '../lib/aabb';
import { Velocity2d } from '../components/Velocity2d';
import { Transform } from '../components/Transform';
import { clamp } from '../lib/math';
import { Vector2d } from '../lib/Vector2d';

const boxCollider2dToSATBox = (collider: BoxCollider2d) =>
  new SAT.Box(
    new SAT.Vector(collider.x, collider.y),
    collider.width,
    collider.height,
  );

const vec2Distance = (v1: Vector2d, v2: Vector2d) =>
  Math.abs(Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2));

export class BallBrickCollisionSystem extends System {
  update(world: World, dt: number): void {
    const ball = world.findEntity(BallTag)!;
    const ballComponents = world.getEntityComponents(ball)!;
    const ballTransform = ballComponents.get<Transform>(Transform)!;
    const ballCollider = ballComponents.get<BoxCollider2d>(BoxCollider2d)!;
    const ballVelocity = ballComponents.get<Velocity2d>(Velocity2d)!;

    const ballBox = boxCollider2dToSATBox(ballCollider);

    // Query the world for bricks
    const bricks = world.view(BrickTag);

    const collisions: [SAT.Response, BoxCollider2d][] = [];

    for (const [brick, components] of bricks) {
      const brickCollider = components.get<BoxCollider2d>(BoxCollider2d)!;

      const brickBox = boxCollider2dToSATBox(brickCollider);
      const response = new SAT.Response();
      const collided = SAT.testPolygonPolygon(
        ballBox.toPolygon(),
        brickBox.toPolygon(),
        response,
      );

      if (collided) {
        collisions.push([response, brickCollider]);
      }
    }

    if (collisions.length === 0) {
      return;
    }

    const closestCollision = collisions.reduce((closest, collision) => {
      if (collision[0].overlap < closest[0].overlap) {
        closest = collision;
      }

      return closest;
    }, collisions[0]);

    const [response, brickCollider] = closestCollision;

    if (Math.abs(response.overlapN.y) !== 0) {
      // if (ballVelocity.y > 0) {
      //   ballTransform.position.y = ballCollider.y =
      //     brickCollider.top - ballCollider.height;
      // } else if (ballVelocity.y < 0) {
      //   ballTransform.position.y = ballCollider.y = brickCollider.bottom;
      // }

      ballTransform.position.y = ballCollider.y =
        ballCollider.y - response.overlapV.y;

      ballVelocity.flipY();
    } else if (Math.abs(response.overlapN.x) !== 0) {
      // if (ballVelocity.x > 0) {
      //   ballTransform.position.x = ballCollider.x =
      //     brickCollider.left - ballCollider.width;
      // } else if (ballVelocity.x < 0) {
      //   ballTransform.position.x = ballCollider.x = brickCollider.right;
      // }

      ballTransform.position.x = ballCollider.x =
        ballCollider.x - response.overlapV.x;

      ballVelocity.flipX();
    }
  }
}
