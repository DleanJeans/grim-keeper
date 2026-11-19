import type { GamePhase, Player, PlayerRoleAssignment } from '@/types/game';
import { getEventPhaseIndex } from '@/utils/game-phase-utils';

export type RoleAssignmentHistoryEntry = {
  day: number;
  kind: PlayerRoleAssignment['kind'];
  /** The player whose roleAssignments hold the entry; for a rumor, the player who told it. */
  ownerPlayerId: string;
  /** Only for a rumor told by someone else about the player. */
  ownerName?: string;
  phase: GamePhase;
  phaseIndex: number;
  roleIds: string[];
};

/**
 * Every claim, confirm or guess logged for the player, or every rumor about them, oldest first.
 * Empty assignments are left out.
 */
export function getRoleAssignmentHistory(
  players: Player[],
  playerId: string,
  kind: PlayerRoleAssignment['kind'],
): RoleAssignmentHistoryEntry[] {
  const entries: RoleAssignmentHistoryEntry[] = [];

  for (const owner of players) {
    if (kind !== 'rumor' && owner.id !== playerId) {
      continue;
    }

    for (const assignment of owner.roleAssignments ?? []) {
      if (
        assignment.kind !== kind ||
        assignment.roleIds.length === 0 ||
        (kind === 'rumor' && assignment.subjectPlayerId !== playerId)
      ) {
        continue;
      }

      const phase = assignment.phase ?? 'day';
      entries.push({
        day: assignment.day,
        kind,
        ownerName: kind === 'rumor' && owner.id !== playerId ? owner.name : undefined,
        ownerPlayerId: owner.id,
        phase,
        phaseIndex: getEventPhaseIndex(assignment.day, phase),
        roleIds: assignment.roleIds,
      });
    }
  }

  return entries.sort((first, second) => first.phaseIndex - second.phaseIndex);
}

/** The newest entry logged in or before the phase, which is what the dock shows for it. */
export function getLatestHistoryEntry(
  entries: RoleAssignmentHistoryEntry[],
  phaseIndex: number,
): RoleAssignmentHistoryEntry | undefined {
  return entries.filter((entry) => entry.phaseIndex <= phaseIndex).at(-1);
}
