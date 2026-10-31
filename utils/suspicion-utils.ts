import type { GamePhase, Player, Role } from '@/types/game';
import { getEventPhaseIndex } from '@/utils/game-phase-utils';
import { APP_USER_ID } from '@/utils/object-id';
import { getEffectiveRoleForPlayer, getRoleAlignment } from '@/utils/role-utils';

export type SuspicionLevel = 'suspect' | 'trusted' | 'unsure';

export const SUSPICION_LEVELS: SuspicionLevel[] = ['trusted', 'unsure', 'suspect'];

/** Stored when a mark is cleared, so an earlier day's mark stops carrying forward. */
const CLEARED = 'none';

/** `<phase index>:<player id>` → mark set in that phase. Marks carry forward to later phases. */
export type SuspicionMarks = Record<string, string>;

/** The player's mark in this phase, carried forward from the latest earlier phase that set one. */
export function getPlayerSuspicion(
  marks: SuspicionMarks | undefined,
  playerId: string,
  day: number,
  phase: GamePhase,
): SuspicionLevel | undefined {
  const phaseIndex = getEventPhaseIndex(day, phase);
  let latestIndex = -1;
  let latest: string | undefined;

  for (const [key, value] of Object.entries(marks ?? {})) {
    const separator = key.indexOf(':');
    const markIndex = Number(key.slice(0, separator));
    if (key.slice(separator + 1) !== playerId || markIndex > phaseIndex) continue;
    if (markIndex > latestIndex) {
      latestIndex = markIndex;
      latest = value;
    }
  }

  return SUSPICION_LEVELS.find((level) => level === latest);
}

/** Marks with the player's mark for this phase set, or cleared when `level` is undefined. */
export function setPlayerSuspicion(
  marks: SuspicionMarks | undefined,
  playerId: string,
  day: number,
  phase: GamePhase,
  level: SuspicionLevel | undefined,
): SuspicionMarks {
  const key = `${getEventPhaseIndex(day, phase)}:${playerId}`;
  const next = { ...marks };
  delete next[key];
  const carried = getPlayerSuspicion(next, playerId, day, phase);
  if (level !== carried) {
    next[key] = level ?? CLEARED;
  }
  return next;
}

/**
 * Players the suspect filter dims: marked trusted, or confirmed as a good character, plus you
 * and Storytellers. Everyone else is still an open suspect.
 */
export function getClearedPlayerIds(
  players: Player[],
  marks: SuspicionMarks | undefined,
  roles: Role[],
  day: number,
  phase: GamePhase,
): string[] {
  return players
    .filter((player) => {
      if (player.id === APP_USER_ID || player.isStoryteller) return true;
      if (getPlayerSuspicion(marks, player.id, day, phase) === 'trusted') return true;
      const effective = getEffectiveRoleForPlayer(player, roles, day, phase);
      return (
        effective.kind === 'confirm' && !!effective.role && getRoleAlignment(effective.role) === 'g'
      );
    })
    .map((player) => player.id);
}
