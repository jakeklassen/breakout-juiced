export class Vector2d {
  public static zero() {
    return new Vector2d(0, 0);
  }

  public static distanceBetween(v1: Vector2d, v2: Vector2d) {
    return Math.abs(Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2));
  }

  public x = 0;
  public y = 0;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}
