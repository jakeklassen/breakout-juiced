import { World } from '@jakeklassen/ecs';
import { BallTag } from '../components/BallTag';
import { BoxCollider2d } from '../components/BoxCollider2d';
import { Rectangle } from '../components/Rectangle';
import { Transform } from '../components/Transform';
import { Velocity2d } from '../components/Velocity2d';

export class WorldCollisionSystem {
  constructor(private readonly viewport: Rectangle) {}

  public update(world: World, dt: number) {
    for (const [entity, components] of world.view(
      BallTag,
      BoxCollider2d,
      Transform,
      Velocity2d,
    )) {
      const collider = components.get(BoxCollider2d) as BoxCollider2d;
      const transform = components.get(Transform) as Transform;
      const velocity = components.get(Velocity2d) as Velocity2d;

      if (collider.right > this.viewport.width) {
        transform.position.x = this.viewport.width - collider.width;
        collider.x = transform.position.x;
        velocity.flipX();
      } else if (collider.x < 0) {
        transform.position.x = 0;
        collider.x = transform.position.x;
        velocity.flipX();
      }

      if (collider.bottom > this.viewport.height) {
        transform.position.y = this.viewport.height - collider.height;
        collider.y = transform.position.y;
        velocity.flipY();
      } else if (collider.top < 0) {
        transform.position.y = 0;
        collider.y = transform.position.y;
        velocity.flipY();
      }
    }
  }
}
