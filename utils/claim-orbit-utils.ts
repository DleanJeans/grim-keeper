// Gap between a claim token and the token's inner edge, and between two claim tokens.
const EDGE_GAP = 1;
const TOKEN_GAP = 1;
// Claim tokens start at this fraction of the player token and shrink until they all fit.
const CLAIM_TOKEN_RATIO = 0.2;
const MAX_CLAIM_TOKEN_SIZE = 20;
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
 * Places `count` small claim tokens inside a player token of `tokenSize`: along the inner edge,
 * starting at the bottom and going clockwise round the token, skipping the band of
 * `textHalfHeight` above and below the center where the name sits and any `obstacles`. Tokens
 * shrink until they all fit; claims that still don't fit are left out.
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
  let best: ClaimOrbitLayout = { positions: [], size: startSize };
  if (count <= 0) {
    return best;
  }
  for (let size = startSize; size >= MIN_CLAIM_TOKEN_SIZE; size -= 1) {
    const positions = placeAroundEdge(
      size,
      count,
      tokenSize,
      borderWidth,
      textHalfHeight,
      obstacles,
    );
    if (positions.length > best.positions.length) {
      best = { positions, size };
    }
    if (positions.length === count) {
      break;
    }
  }
  return best;
}

function placeAroundEdge(
  size: number,
  count: number,
  tokenSize: number,
  borderWidth: number,
  textHalfHeight: number,
  obstacles: ClaimOrbitObstacle[],
) {
  const orbitRadius = tokenSize / 2 - borderWidth - EDGE_GAP - size / 2;
  const positions: { x: number; y: number }[] = [];
  if (orbitRadius <= 0) {
    return positions;
  }
  // One degree at a time from the bottom (90°, y grows down), clockwise on screen.
  for (let step = 0; step < 360 && positions.length < count; step += 1) {
    const angle = (90 + step) * DEGREES_TO_RADIANS;
    const x = orbitRadius * Math.cos(angle);
    const y = orbitRadius * Math.sin(angle);
    if (Math.abs(y) - size / 2 < textHalfHeight) {
      continue;
    }
    const covers = (other: ClaimOrbitObstacle) =>
      Math.hypot(other.x - x, other.y - y) < other.radius + size / 2;
    if (obstacles.some(covers)) {
      continue;
    }
    if (positions.some((other) => covers({ ...other, radius: size / 2 + TOKEN_GAP }))) {
      continue;
    }
    positions.push({ x, y });
  }
  return positions;
}
