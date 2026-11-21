import type { PlayerPosition } from '@/types/game';

type Circle = { size: number; x: number; y: number };

const TOKEN_GAP = 2;
// Angles tried, in turn, when the spot straight toward the center is taken.
const NUDGE_STEPS = [0, 1, -1, 2, -2, 3, -3];
const NUDGE_ANGLE = Math.PI / 8;

/**
 * Where the small "drunk as" token sits, as an offset from its player's token center: on the
 * line toward the map center, just past the token edge, nudged sideways while it would touch
 * another token.
 */
export function getDrunkTokenOffset({
  center,
  others,
  position,
  size,
  tokenSize,
}: {
  center: PlayerPosition;
  others: Circle[];
  position: PlayerPosition;
  size: number;
  tokenSize: number;
}): PlayerPosition {
  const baseAngle = Math.atan2(center.y - position.y, center.x - position.x);
  const distance = tokenSize / 2 + size / 2 + TOKEN_GAP;
  let best: PlayerPosition = {
    x: Math.cos(baseAngle) * distance,
    y: Math.sin(baseAngle) * distance,
  };
  for (const step of NUDGE_STEPS) {
    const angle = baseAngle + step * NUDGE_ANGLE;
    const offset = { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
    const free = others.every(
      (other) =>
        Math.hypot(position.x + offset.x - other.x, position.y + offset.y - other.y) >=
        size / 2 + other.size / 2,
    );
    if (free) {
      return offset;
    }
    if (step === 0) {
      best = offset;
    }
  }
  return best;
}
