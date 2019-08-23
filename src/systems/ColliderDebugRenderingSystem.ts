import { System, World } from '@jakeklassen/ecs';
import { Color } from '../components/Color';
import { Rectangle } from '../components/Rectangle';
import { Transform } from '../components/Transform';
import { BoxCollider2d } from '../components/BoxCollider2d';

export class ColliderDebugRenderingSystem extends System {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();

    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  }

  public update(world: World, dt: number) {
    for (const [entity, components] of world.view(BoxCollider2d)) {
      const collider = components.get<BoxCollider2d>(BoxCollider2d)!;

      this.ctx.strokeStyle = 'limegreen';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(
        collider.x,
        collider.y,
        collider.width,
        collider.height,
      );
    }
  }
}
