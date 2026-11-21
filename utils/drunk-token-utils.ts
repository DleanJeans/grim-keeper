import type { GamePhase, PlayerPosition, PlayerRoleAssignment } from '@/types/game';
import { getEventPhaseIndex } from '@/utils/game-phase-utils';

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

/**
 * The character a confirmed Drunk believes they are: the character they were confirmed as before
 * the Drunk confirmation, else their latest claim. Undefined unless the latest confirm so far
 * is the Drunk.
 */
export function getDrunkAsRoleId(
  assignments: PlayerRoleAssignment[] | undefined,
  day: number,
  phase: GamePhase,
): string | undefined {
  const activeIndex = getEventPhaseIndex(day, phase);
  const upToNow = (assignments ?? [])
    .filter(
      (assignment) => getEventPhaseIndex(assignment.day, assignment.phase ?? 'day') <= activeIndex,
    )
    .sort(
      (a, b) =>
        getEventPhaseIndex(a.day, a.phase ?? 'day') - getEventPhaseIndex(b.day, b.phase ?? 'day'),
    );
  const confirms = upToNow.filter((assignment) => assignment.kind === 'confirm');
  const latest = confirms[confirms.length - 1];
  if (!latest?.roleIds.includes('drunk')) {
    return undefined;
  }
  const earlier = confirms
    .slice(0, -1)
    .reverse()
    .find((assignment) => assignment.roleIds.length > 0 && !assignment.roleIds.includes('drunk'));
  if (earlier) {
    return earlier.roleIds[0];
  }
  const claims = upToNow.filter((assignment) => assignment.kind === 'claim');
  return claims[claims.length - 1]?.roleIds[0];
}
