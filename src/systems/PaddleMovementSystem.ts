import { System, World } from '@jakeklassen/ecs';
import { PaddleTag } from '../components/PaddleTag';
import { Transform } from '../components/Transform';
import { BoxCollider2d } from '../components/BoxCollider2d';

export class PaddleMovementSystem extends System {
  constructor(private readonly mouse: { x: number }) {
    super();
  }

  update(world: World, dt: number): void {
    const paddle = world.findEntity(PaddleTag)!;
    const paddleComponents = world.getEntityComponents(paddle)!;

    // update position based on mouse
    const transform = paddleComponents.get<Transform>(Transform)!;
    const collider = paddleComponents.get<BoxCollider2d>(BoxCollider2d)!;
    collider.x = transform.position.x = this.mouse.x;
  }
}
