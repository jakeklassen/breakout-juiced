import { System, World } from '@jakeklassen/ecs';
import { Game } from '../game.config';

export class ScoreRenderingSystem extends System {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    private readonly game: Game,
    private readonly canvas: HTMLCanvasElement,
  ) {
    super();
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  }

  update(world: World, dt: number): void {
    this.ctx.font = '16px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText(`Score: ${this.game.score}`, 16, 18);
  }
}
