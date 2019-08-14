import { System, World } from '@jakeklassen/ecs';
import { Transform } from '../components/Transform';
import { Velocity2d } from '../components/Velocity2d';
import { BoxCollider2d } from '../components/BoxCollider2d';
import { BallTag } from '../components/BallTag';

export class MovementSystem extends System {
  public update(world: World, dt: number) {
    const ball = world.findEntity(BallTag)!;
    const ballComponents = world.getEntityComponents(ball)!;

    const transform = ballComponents.get<Transform>(Transform)!;
    const velocity = ballComponents.get<Velocity2d>(Velocity2d)!;
    const collider = ballComponents.get<BoxCollider2d>(BoxCollider2d);

    transform.position.x += velocity.x * dt;
    transform.position.y += velocity.y * dt;

    if (collider != null) {
      collider.x = transform.position.x;
      collider.y = transform.position.y;
    }
  }
}
