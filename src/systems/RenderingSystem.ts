import { System, World } from '@jakeklassen/ecs';
import { Color } from '../components/Color';
import { Rectangle } from '../components/Rectangle';
import { Transform } from '../components/Transform';

export class RenderingSystem extends System {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly mouse: { x: number },
  ) {
    super();

    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  }

  public update(world: World, dt: number) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const [entity, components] of world.view(
      Transform,
      Rectangle,
      Color,
    )) {
      const color = components.get(Color) as Color;
      const rectangle = components.get(Rectangle) as Rectangle;
      const { position } = components.get(Transform) as Transform;

      this.ctx.fillStyle = color.color;
      this.ctx.fillRect(
        position.x,
        position.y,
        rectangle.width,
        rectangle.height,
      );
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(this.mouse.x.toString(), 50, 50);
    }
  }
}
