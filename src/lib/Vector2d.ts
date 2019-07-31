export class Vector2d {
  public static zero() {
    return new Vector2d(0, 0);
  }

  public x = 0;
  public y = 0;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}
