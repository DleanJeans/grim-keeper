import type { Player, PlayerRoleAssignment, Role } from '@/types/game';
import { getEventPhaseIndex } from '@/utils/game-phase-utils';
import { getRoleAlignment, getRolesByIds, isTravelerRole } from '@/utils/role-utils';

export type FriendGameRoles = {
  /**
   * The characters the player had, in order: one entry per change (a Damsel that became a
   * Townsfolk, a Pit-Hag change). Each entry can hold several roles when they were logged
   * together.
   */
  characters: Role[][];
  /** Claims that differ from their characters. Empty when there is nothing else to show. */
  claims: Role[];
  /** "Bluffed as" when the player ended evil and claimed good characters. */
  claimLabel: 'Claimed' | 'Bluffed as';
};

/**
 * What a friend played in a game. Confirmed characters come first; with no confirm, the claims
 * are their real characters. Claims that match a character are left out.
 */
export function getFriendGameRoles(player: Player, roles: Role[]): FriendGameRoles {
  const confirmStages = getAssignmentStages(player.roleAssignments, 'confirm');
  const claimStages = getAssignmentStages(player.roleAssignments, 'claim');

  if (confirmStages.length === 0) {
    return {
      characters: claimStages.map((roleIds) => getRolesByIds(roleIds, roles)),
      claimLabel: 'Claimed',
      claims: [],
    };
  }

  const characters = confirmStages.map((roleIds) => getRolesByIds(roleIds, roles));
  const finalCharacters = characters[characters.length - 1];
  const characterIds = new Set(characters.flat().map((role) => getBaseRoleId(role.id)));
  const claimIds = [...new Set(claimStages.flat())].filter(
    (roleId) => !characterIds.has(getBaseRoleId(roleId)),
  );
  const claims = finalCharacters.every(isTravelerRole) ? [] : getRolesByIds(claimIds, roles);
  const endedEvil = finalCharacters.some((role) => getRoleAlignment(role) === 'e');
  const bluffed =
    endedEvil && claims.length > 0 && claims.every((role) => getRoleAlignment(role) !== 'e');

  return { characters, claimLabel: bluffed ? 'Bluffed as' : 'Claimed', claims };
}

/**
 * Role ids of `kind`, oldest first: the latest assignment of each phase, skipping phases that
 * repeat the previous roles and empty assignments.
 */
function getAssignmentStages(
  assignments: PlayerRoleAssignment[] | undefined,
  kind: PlayerRoleAssignment['kind'],
): string[][] {
  const latestByPhase = new Map<number, PlayerRoleAssignment>();

  for (const assignment of assignments ?? []) {
    if (assignment.kind !== kind) {
      continue;
    }

    const phaseIndex = getEventPhaseIndex(assignment.day, assignment.phase ?? 'day');
    const current = latestByPhase.get(phaseIndex);
    if (!current || assignment.updatedAt > current.updatedAt) {
      latestByPhase.set(phaseIndex, assignment);
    }
  }

  const stages: string[][] = [];
  const phaseIndexes = [...latestByPhase.keys()].sort((first, second) => first - second);

  for (const phaseIndex of phaseIndexes) {
    const roleIds = [...new Set(latestByPhase.get(phaseIndex)?.roleIds ?? [])];
    const previous = stages[stages.length - 1];
    if (roleIds.length === 0 || (previous && sameIds(previous, roleIds))) {
      continue;
    }

    stages.push(roleIds);
  }

  return stages;
}

function sameIds(first: string[], second: string[]) {
  return first.length === second.length && first.every((roleId) => second.includes(roleId));
}

function getBaseRoleId(roleId: string) {
  return roleId.replace(/_(evil|good)$/, '');
}
