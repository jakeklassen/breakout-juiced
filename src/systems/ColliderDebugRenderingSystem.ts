import { System, World } from '@jakeklassen/ecs';
import { Observable } from 'rxjs';
import { BoxCollider2d } from '../components/BoxCollider2d';

export class ColliderDebugRenderingSystem extends System {
  private readonly ctx: CanvasRenderingContext2D;
  private enabled = false;

  constructor(canvas: HTMLCanvasElement, toggle: Observable<KeyboardEvent>) {
    super();

    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    toggle.subscribe(() => (this.enabled = !this.enabled));
  }

  public update(world: World, dt: number) {
    if (this.enabled === false) {
      return;
    }

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
