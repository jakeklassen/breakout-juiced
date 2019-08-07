import { Vector2d } from '../lib/Vector2d';
import { Component } from '@jakeklassen/ecs';

export class Transform extends Component {
  public position = Vector2d.zero();

  constructor(position: Vector2d = Vector2d.zero()) {
    super();
    this.position = position;
  }
}
