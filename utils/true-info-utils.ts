import type { GamePhase, Player, Role } from '@/types/game';
import { getAliveNeighbors } from '@/utils/role-info-utils';
import {
  getRoleAlignment,
  getRoleAssignmentForDayOrPrevious,
  getRolesByIds,
} from '@/utils/role-utils';

/** Reminders that make a character's info unreliable, so the Storyteller picks it by hand. */
export const UNRELIABLE_STATUS_IDS = ['drunk', 'poisoned'];

export function isInfoUnreliable(player: Pick<Player, 'statuses'>) {
  return !!player.statuses?.some((status) => UNRELIABLE_STATUS_IDS.includes(status.kind));
}

/** The character the Storyteller gave the player: the confirmed one, else the claimed one. */
function getTrueRole(player: Player, roles: Role[], day: number, phase: GamePhase) {
  const roleId = (
    getRoleAssignmentForDayOrPrevious(player.roleAssignments, day, 'confirm', phase) ??
    getRoleAssignmentForDayOrPrevious(player.roleAssignments, day, 'claim', phase) ??
    // Characters handed out at the start of a game may be dated after the night being run.
    player.roleAssignments?.find((assignment) => assignment.kind === 'confirm') ??
    player.roleAssignments?.find((assignment) => assignment.kind === 'claim')
  )?.roleIds[0];
  return roleId ? getRolesByIds([roleId], roles)[0] : undefined;
}

/**
 * Empath info from the true characters: how many of the owner's alive neighbours are evil.
 * Undefined when the owner is marked drunk or poisoned, when no neighbour is alive, or when a
 * neighbour has no confirmed character yet.
 */
export function getTrueEmpathInfo({
  day,
  ownerId,
  phase,
  players,
  roles,
}: {
  day: number;
  ownerId: string;
  phase: GamePhase;
  players: Player[];
  roles: Role[];
}): Record<string, string> | undefined {
  const owner = players.find((player) => player.id === ownerId);
  if (!owner || isInfoUnreliable(owner)) return undefined;

  const neighbors = getAliveNeighbors(players, ownerId, day, phase);
  if (neighbors.length === 0) return undefined;

  let evil = 0;
  for (const neighbor of neighbors) {
    const role = getTrueRole(neighbor, roles, day, phase);
    if (!role) return undefined;
    if (getRoleAlignment(role) === 'e') evil += 1;
  }
  return { '0': String(evil) };
}
