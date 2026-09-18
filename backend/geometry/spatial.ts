import type { Vector2D, BoundingBox } from '../../src/types.js';

/**
 * Normalized 2D Euclidean Distance:
 * distance(A, B) = sqrt((Ax - Bx)^2 + (Ay - By)^2)
 */
export function calculateDistance(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Intersection over Union (IoU) of two normalized bounding boxes
 */
export function calculateIoU(boxA: BoundingBox, boxB: BoundingBox): number {
  const xA = Math.max(boxA.x, boxB.x);
  const yA = Math.max(boxA.y, boxB.y);
  const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const interArea = interWidth * interHeight;

  const areaA = boxA.width * boxA.height;
  const areaB = boxB.width * boxB.height;
  const unionArea = areaA + areaB - interArea;

  if (unionArea <= 0) return 0;
  return interArea / unionArea;
}

/**
 * Check if inner box center is horizontally and vertically inside outer box
 */
export function isContained(inner: BoundingBox, outer: BoundingBox): boolean {
  const centerX = inner.x + inner.width / 2;
  const centerY = inner.y + inner.height / 2;

  return (
    centerX >= outer.x - 0.05 &&
    centerX <= outer.x + outer.width + 0.05 &&
    centerY >= outer.y - 0.05 &&
    centerY <= outer.y + outer.height + 0.05
  );
}

/**
 * Determine primary directional relation (left_of, right_of, above, below)
 */
export function getDirectionalRelation(
  source: Vector2D,
  target: Vector2D
): 'left_of' | 'right_of' | 'above' | 'below' {
  const dx = source.x - target.x;
  const dy = source.y - target.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'left_of' : 'right_of';
  } else {
    return dy < 0 ? 'above' : 'below';
  }
}
