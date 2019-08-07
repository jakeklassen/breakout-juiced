import { System, World } from '@jakeklassen/ecs';
import { PaddleTag } from '../components/PaddleTag';
import { Transform } from '../components/Transform';

export class PaddleMovementSystem extends System {
  constructor(private readonly mouse: { x: number }) {
    super();
  }

  update(world: World, dt: number): void {
    for (const [entity, components] of world.view(Transform, PaddleTag)) {
      const transform = components.get<Transform>(Transform)!;
      transform.position.x = this.mouse.x;
    }
  }
}
