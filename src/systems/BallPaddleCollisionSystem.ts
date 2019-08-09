import { System, World } from '@jakeklassen/ecs';
import { Transform } from '../components/Transform';
import { Velocity2d } from '../components/Velocity2d';
import { PaddleTag } from '../components/PaddleTag';
import { BallTag } from '../components/BallTag';
import { BoxCollider2d } from '../components/BoxCollider2d';

export class BallPaddleCollisionSystem extends System {
    update(world: World, dt: number): void {
        let paddleTransform: Transform;
        let ballTransform: Transform;
        let paddleCollider: BoxCollider2d;
        let ballCollider: BoxCollider2d;
        let ballVelocity: Velocity2d;

        // Find the paddle
        for (const [entity, components] of world.view(Transform, PaddleTag)) {
            paddleTransform = components.get<Transform>(Transform)!;
            paddleCollider = components.get<BoxCollider2d>(BoxCollider2d)!;
        }

        // Find the ball
        for (const [entity, components] of world.view(Transform, Velocity2d, BallTag)) {
            ballTransform = components.get<Transform>(Transform)!;
            ballVelocity = components.get<Velocity2d>(Velocity2d)!;
            ballCollider = components.get<BoxCollider2d>(BoxCollider2d)!;
        }

        // TODO: Maybe throw an error here if we don't find our components

        // Detect whether the ball is currently colliding with the paddle
        if (ballCollider!.bottom >= paddleCollider!.top) {
            ballTransform!.position.y = paddleTransform!.position.y - ballCollider!.height;
            ballVelocity!.flipY();
        }
    }
}