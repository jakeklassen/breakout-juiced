import { System, World } from '@jakeklassen/ecs';
import { Transform } from '../components/Transform';
import { Velocity2d } from '../components/Velocity2d';
import { BoxCollider2d } from '../components/BoxCollider2d';

export class MovementSystem extends System {
  public update(world: World, dt: number) {
    for (const [entity, components] of world.view(Transform, Velocity2d)) {
      const transform = components.get<Transform>(Transform)!;
      const velocity = components.get<Velocity2d>(Velocity2d)!;
      const collider = components.get<BoxCollider2d>(BoxCollider2d);

      transform.position.x += velocity.x * dt;
      transform.position.y += velocity.y * dt;

      if (collider != null) {
        collider.x = transform.position.x;
        collider.y = transform.position.y;
      }
    }
  }
}
