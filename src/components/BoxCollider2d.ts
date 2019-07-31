export class BoxCollider2d {
  constructor(
    public x: number,
    public y: number,
    public readonly width: number,
    public readonly height: number,
  ) {}

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
}
