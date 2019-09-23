import { Entity, System, World } from '@jakeklassen/ecs';
import { Game } from '../game.config';
import { BallTag } from '../components/BallTag';
import { BrickTag } from '../components/BrickTag';

export class ScoreSystem extends System {
  constructor(readonly world: World, readonly game: Game) {
    super();

    game.events.on(
      'collision',
      ({ entityA, entityB }: { entityA: Entity; entityB: Entity }) => {
        const entityAComponents = world.getEntityComponents(entityA)!;
        const entityBComponents = world.getEntityComponents(entityB)!;

        if (entityAComponents.has(BallTag)) {
          if (entityBComponents.has(BrickTag)) {
            game.score += 1;
          }
        } else if (entityBComponents.has(BallTag)) {
          if (entityAComponents.has(BrickTag)) {
            game.score += 1;
          }
        }
      },
    );
  }

  update(world: World, dt: number): void {}
}
