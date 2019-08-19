import { Component } from '@jakeklassen/ecs';

export class BoxCollider2d extends Component {
  constructor(
    public x: number,
    public y: number,
    public readonly width: number,
    public readonly height: number,
  ) {
    super();
  }

  get left() {
    return this.x;
  }

  get right() {
    return this.x + this.width;
  }

  get top() {
    return this.y;
  }

  get bottom() {
    return this.y + this.height;
  }

  get centerX() {
    return this.x + this.width / 2;
  }
}
