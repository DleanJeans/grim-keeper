import type { CharacterTypeCounts, GamePhase, Player, Role } from '@/types/game';
import {
  GENERIC_CHARACTER_TYPE_ROLES,
  getRoleAssignmentForDayOrPrevious,
} from '@/utils/role-utils';

/** Most Outsiders a script role can add to the setup. Infinity: it can add any number. */
const OUTSIDER_INCREASES: Record<string, number> = {
  balloonist: 1,
  baron: 2,
  fanggu: 1,
  godfather: 1,
  kazali: Number.POSITIVE_INFINITY,
  sentinel: 1,
  xaan: Number.POSITIVE_INFINITY,
};

export type DoubleClaim = {
  playerIds: string[];
  roleId: string;
};

export type OutsiderClash = {
  claimed: number;
  /** Outsiders in the setup before any character changes it. */
  setup: number;
  /** Most Outsiders the script's characters could make it, when that is more than `setup`. */
  maxSetup: number;
  /** Script characters that can add Outsiders. */
  modifierRoleIds: string[];
};

export type PlayerRoleClaim = {
  playerId: string;
  roleId: string;
};

export type ClaimClashes = {
  /** Claims of a character in the Bluffs row. */
  bluffClaims: PlayerRoleClaim[];
  doubleClaims: DoubleClaim[];
  /** Claims of a character that isn't on the script (Travellers are fine). */
  offScriptClaims: PlayerRoleClaim[];
  outsiders?: OutsiderClash;
};

type ClaimClashOptions = {
  /** Characters in the Bluffs row. */
  bluffRoleIds?: string[];
  /** All known characters, to tell Travellers apart from off-script claims. */
  catalog?: Role[];
};

/**
 * Claims that can't all be true: two players on the same character, more Outsiders claimed than
 * the setup could have, a character from the Bluffs row, or one that isn't on the script. A
 * confirmed character wins over that player's claim.
 */
export function getClaimClashes(
  players: Player[],
  scriptRoles: Role[],
  counts: CharacterTypeCounts,
  day: number,
  phase: GamePhase,
  { bluffRoleIds = [], catalog = [] }: ClaimClashOptions = {},
): ClaimClashes {
  const bluffs = new Set(bluffRoleIds);
  const scriptRoleIds = new Set(scriptRoles.map((role) => role.id));
  const travellerIds = new Set(
    catalog.filter((role) => role.team?.toLocaleLowerCase() === 'traveller').map((role) => role.id),
  );
  const bluffClaims: PlayerRoleClaim[] = [];
  const offScriptClaims: PlayerRoleClaim[] = [];
  const roleById = new Map(
    [...GENERIC_CHARACTER_TYPE_ROLES, ...scriptRoles].map((role) => [role.id, role]),
  );
  const playerIdsByRole = new Map<string, string[]>();
  let claimedOutsiders = 0;

  for (const player of players) {
    if (player.isStoryteller) continue;
    const roleIds = getCurrentRoleIds(player, day, phase);
    for (const roleId of roleIds) {
      // "Outsider" and the like say what type someone is, not which character.
      if (roleId.startsWith('generic_')) continue;
      if (bluffs.has(roleId)) bluffClaims.push({ playerId: player.id, roleId });
      if (scriptRoleIds.size > 0 && !scriptRoleIds.has(roleId) && !travellerIds.has(roleId)) {
        offScriptClaims.push({ playerId: player.id, roleId });
      }
      // A "3 for 3" claim names characters the player might not be, so it can't clash.
      if (roleIds.length === 1) {
        playerIdsByRole.set(roleId, [...(playerIdsByRole.get(roleId) ?? []), player.id]);
      }
    }
    if (
      roleIds.length > 0 &&
      roleIds.every((roleId) => roleById.get(roleId)?.team?.toLocaleLowerCase() === 'outsider')
    ) {
      claimedOutsiders += 1;
    }
  }

  const doubleClaims = [...playerIdsByRole]
    .filter(([, playerIds]) => playerIds.length > 1)
    .map(([roleId, playerIds]) => ({ playerIds, roleId }));

  const modifierRoleIds = scriptRoles
    .map((role) => role.id)
    .filter((roleId) => OUTSIDER_INCREASES[roleId] !== undefined);
  const maxSetup =
    counts.outsiders +
    modifierRoleIds.reduce((most, roleId) => Math.max(most, OUTSIDER_INCREASES[roleId]), 0);

  return {
    bluffClaims,
    doubleClaims,
    offScriptClaims,
    outsiders:
      claimedOutsiders > maxSetup
        ? { claimed: claimedOutsiders, maxSetup, modifierRoleIds, setup: counts.outsiders }
        : undefined,
  };
}

function getCurrentRoleIds(player: Player, day: number, phase: GamePhase): string[] {
  const assignment =
    getRoleAssignmentForDayOrPrevious(player.roleAssignments, day, 'confirm', phase) ??
    getRoleAssignmentForDayOrPrevious(player.roleAssignments, day, 'claim', phase);
  const roleIds = (assignment?.roleIds ?? []).map((roleId) =>
    roleId.replace(/_(?:good|evil)$/, ''),
  );
  return [...new Set(roleIds)];
}
