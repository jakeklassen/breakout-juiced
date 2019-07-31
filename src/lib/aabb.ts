import { BoxCollider2d } from '../components/BoxCollider2d';

// https://developer.mozilla.org/kab/docs/Games/Techniques/2D_collision_detection
// Axis-Aligned Bounding Box - no rotation
export const intersects = (box1: BoxCollider2d, box2: BoxCollider2d) =>
  box1.left < box2.right &&
  box1.right > box2.left &&
  box1.top < box2.bottom &&
  box1.bottom > box2.top;
