import type { GamePhase, Player, Role } from '@/types/game';
import { getDeathPhase } from '@/utils/game-phase-utils';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';
import { getAssignedRoleIdsForDayOrPrevious } from '@/utils/role-utils';
import type { NightSheet } from '@/utils/script-utils';

export type NightOrderClaimer = {
  dead: boolean;
  /** Died during this very night, so a Ravenkeeper still wakes. */
  diedTonight: boolean;
  id: string;
  name: string;
};

export type NightOrderRow = {
  /** True when every known claimer is dead, so the character won't be woken tonight. */
  asleep: boolean;
  claimers: NightOrderClaimer[];
  role: Role;
};

/** Characters that only act on a trigger (death, a day event), so they don't belong on later nights. */
const NOT_WAKING_AFTER_FIRST_NIGHT = new Set(['grandmother', 'tinker', 'moonchild']);

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
    if (day > 1 && NOT_WAKING_AFTER_FIRST_NIGHT.has(key)) continue;
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
        diedTonight:
          !!player.death && player.death.day === day && getDeathPhase(player.death) === 'night',
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
    .map(({ role }) => {
      const claimers = claimersByRole.get(role.id) ?? [];
      return { asleep: isAsleep(role, claimers), claimers, role };
    });
}

function normalizeRoleId(roleId: string) {
  return roleId.toLocaleLowerCase().replace(/[^a-z]/g, '');
}

/** Unclaimed characters stay awake (unknown); a Ravenkeeper killed tonight still wakes. */
function isAsleep(role: Role, claimers: NightOrderClaimer[]) {
  if (claimers.length === 0) return false;
  const keepsWaking = (claimer: NightOrderClaimer) =>
    !claimer.dead || (normalizeRoleId(role.id) === 'ravenkeeper' && claimer.diedTonight);
  return !claimers.some(keepsWaking);
}
