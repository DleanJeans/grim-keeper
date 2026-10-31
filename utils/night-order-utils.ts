import type { GamePhase, Player, Role } from '@/types/game';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';
import { getAssignedRoleIdsForDayOrPrevious } from '@/utils/role-utils';
import type { NightSheet } from '@/utils/script-utils';

export type NightOrderClaimer = {
  dead: boolean;
  id: string;
  name: string;
};

export type NightOrderRow = {
  claimers: NightOrderClaimer[];
  role: Role;
};

/**
 * Script characters that wake on Night `day`, in night order, with the players who claim or were
 * confirmed as each one by then. Night 1 uses the first-night order.
 */
export function getNightOrderRows(
  scriptRoles: Role[],
  players: Player[],
  nightSheet: NightSheet,
  day: number,
  phase: GamePhase = 'night',
): NightOrderRow[] {
  const order = new Map<string, number>();
  for (const roleId of nightSheet[day <= 1 ? 'firstNight' : 'otherNight']) {
    const key = normalizeRoleId(roleId);
    if (!order.has(key)) order.set(key, order.size);
  }

  const claimersByRole = new Map<string, NightOrderClaimer[]>();
  for (const player of players) {
    if (player.isStoryteller) continue;
    const roleIds = getAssignedRoleIdsForDayOrPrevious(player.roleAssignments, day, phase);
    for (const roleId of new Set(roleIds.map((id) => id.replace(/_(?:good|evil)$/, '')))) {
      const claimers = claimersByRole.get(roleId) ?? [];
      claimers.push({
        dead: isPlayerCurrentlyDead(player, day, phase),
        id: player.id,
        name: player.name,
      });
      claimersByRole.set(roleId, claimers);
    }
  }

  return scriptRoles
    .map((role) => ({ index: order.get(normalizeRoleId(role.id)), role }))
    .filter((item): item is { index: number; role: Role } => item.index !== undefined)
    .sort((a, b) => a.index - b.index)
    .map(({ role }) => ({ claimers: claimersByRole.get(role.id) ?? [], role }));
}

function normalizeRoleId(roleId: string) {
  return roleId.toLocaleLowerCase().replace(/[^a-z]/g, '');
}
