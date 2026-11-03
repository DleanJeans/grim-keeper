// Gap between a claim token and the token's inner edge, and between two claim tokens.
const EDGE_GAP = 1;
const TOKEN_GAP = 1;
// Claim tokens start at this fraction of the player token and shrink until they all fit.
const CLAIM_TOKEN_RATIO = 0.36;
const MAX_CLAIM_TOKEN_SIZE = 36;
// Shrink tokens down to this fraction of their full size to keep every claim at the bottom.
const MIN_BOTTOM_ONLY_RATIO = 0.6;
const BOTTOM_DEGREES = 90;
const TOP_DEGREES = 270;
// Degrees a group slides to get past an obstacle such as the dead vote badge, nearest first.
const GROUP_SHIFTS = Array.from({ length: 61 }, (_, step) =>
  step % 2 === 1 ? Math.ceil(step / 2) : -Math.ceil(step / 2),
);
const MIN_CLAIM_TOKEN_SIZE = 8;
const DEGREES_TO_RADIANS = Math.PI / 180;

/** A circle inside the player token that claim tokens must not cover, centered on the token. */
export type ClaimOrbitObstacle = { radius: number; x: number; y: number };

export type ClaimOrbitLayout = {
  /** Centers relative to the player token's center (y grows down), in claim order. */
  positions: { x: number; y: number }[];
  size: number;
};

/**
 * Places `count` small claim tokens inside a player token of `tokenSize`, along the inner edge in
 * a group centered on the bottom, first claim on the left. They keep out of the band of
 * `textHalfHeight` above and below the center where the name sits, and off any `obstacles`.
 * Tokens shrink, down to MIN_BOTTOM_ONLY_RATIO of their full size, to keep every claim at the
 * bottom; past that, the rest go in a group centered on the top. Claims that still don't fit at
 * the smallest size are left out.
 */
export function getClaimOrbitLayout({
  borderWidth,
  count,
  obstacles = [],
  textHalfHeight,
  tokenSize,
}: {
  borderWidth: number;
  count: number;
  obstacles?: ClaimOrbitObstacle[];
  textHalfHeight: number;
  tokenSize: number;
}): ClaimOrbitLayout {
  const startSize = Math.max(
    MIN_CLAIM_TOKEN_SIZE,
    Math.min(MAX_CLAIM_TOKEN_SIZE, tokenSize * CLAIM_TOKEN_RATIO),
  );
  if (count <= 0) {
    return { positions: [], size: startSize };
  }
  const sizes: number[] = [];
  for (let size = startSize; size >= MIN_CLAIM_TOKEN_SIZE; size -= 1) {
    sizes.push(size);
  }
  const place = (size: number, centerDegrees: number, groupCount: number) =>
    placeGroup(size, centerDegrees, groupCount, tokenSize, borderWidth, textHalfHeight, obstacles);
  const bottomOnlyFloor = startSize * MIN_BOTTOM_ONLY_RATIO;
  for (const size of sizes) {
    if (size < bottomOnlyFloor) break;
    const bottom = place(size, BOTTOM_DEGREES, count);
    if (bottom) return { positions: bottom, size };
  }
  let best: ClaimOrbitLayout = { positions: [], size: startSize };
  for (const size of sizes) {
    for (let bottomCount = count; bottomCount >= 1; bottomCount -= 1) {
      const bottom = place(size, BOTTOM_DEGREES, bottomCount);
      if (!bottom) continue;
      const topCount = count - bottomCount;
      const top = topCount > 0 ? place(size, TOP_DEGREES, topCount) : [];
      const positions = [...bottom, ...(top ?? [])];
      if (top && positions.length === count) {
        return { positions, size };
      }
      if (positions.length > best.positions.length) {
        best = { positions, size };
      }
      break;
    }
  }
  return best;
}

/**
 * Centers of `groupCount` tokens side by side along the edge, centered on `centerDegrees` (90 is
 * the bottom, y grows down) and listed left to right, or null when they don't all fit. The group
 * slides a little either way to get past an obstacle.
 */
function placeGroup(
  size: number,
  centerDegrees: number,
  groupCount: number,
  tokenSize: number,
  borderWidth: number,
  textHalfHeight: number,
  obstacles: ClaimOrbitObstacle[],
) {
  const orbitRadius = tokenSize / 2 - borderWidth - EDGE_GAP - size / 2;
  const chord = (size + TOKEN_GAP) / 2 / orbitRadius;
  if (orbitRadius <= 0 || chord >= 1) {
    return null;
  }
  const stepDegrees = (2 * Math.asin(chord)) / DEGREES_TO_RADIANS;
  // Left to right is decreasing angle at the bottom and increasing angle at the top.
  const direction = Math.sin(centerDegrees * DEGREES_TO_RADIANS) > 0 ? -1 : 1;
  for (const shift of GROUP_SHIFTS) {
    const positions: { x: number; y: number }[] = [];
    for (let index = 0; index < groupCount; index += 1) {
      const angle =
        (centerDegrees + shift + direction * (index - (groupCount - 1) / 2) * stepDegrees) *
        DEGREES_TO_RADIANS;
      const x = orbitRadius * Math.cos(angle);
      const y = orbitRadius * Math.sin(angle);
      const clearsText = Math.abs(y) - size / 2 >= textHalfHeight;
      const clearsObstacles = obstacles.every(
        (other) => Math.hypot(other.x - x, other.y - y) >= other.radius + size / 2,
      );
      if (!clearsText || !clearsObstacles) break;
      positions.push({ x, y });
    }
    if (positions.length === groupCount) {
      return positions;
    }
  }
  return null;
}
