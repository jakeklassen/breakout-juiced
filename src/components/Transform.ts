import { Vector2d } from '../lib/Vector2d';

export class Transform {
  public position = Vector2d.zero();

  constructor(position: Vector2d = Vector2d.zero()) {
    this.position = position;
  }
}
