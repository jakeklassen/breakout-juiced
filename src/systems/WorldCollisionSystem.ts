import { World } from '@jakeklassen/ecs';
import { BallTag } from '../components/BallTag';
import { BoxCollider2d } from '../components/BoxCollider2d';
import { Rectangle } from '../components/Rectangle';
import { Transform } from '../components/Transform';
import { Velocity2d } from '../components/Velocity2d';

export class WorldCollisionSystem {
  constructor(private readonly viewport: Rectangle) {}

  public update(world: World, dt: number) {
    const ball = world.findEntity(BallTag)!;

    const components = world.getEntityComponents(ball)!;

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
      // Reset ball
      transform.position.y = 0;
      transform.position.x = this.viewport.width / 2 - collider.width / 2;
      collider.y = transform.position.y;
      collider.x = transform.position.x;
    } else if (collider.top < 0) {
      transform.position.y = 0;
      collider.y = transform.position.y;
      velocity.flipY();
    }
  }
}
