import type { CharacterTypeCounts, Game, GamePhase, Player, Role } from '@/types/game';
import { getAutomaticCharacterTypeCounts } from '@/utils/character-type-counts';
import {
  getAssignedRoleIdsForDayOrPrevious,
  getClaimedRoleIdsForDayOrPrevious,
} from '@/utils/role-utils';

export type EvilInPlayTeam = 'demon' | 'minion';

/** The Demon usually gets 3 good characters not in play to bluff as. */
export const BLUFF_COUNT = 3;

export type EvilInPlaySlot = {
  /** Fixed to the script's only Demon or a confirmed character, so it can't be changed. */
  locked: boolean;
  roleId?: string;
  slotId: string;
  team: EvilInPlayTeam;
};

export type NotInPlaySlot = Omit<EvilInPlaySlot, 'team'> & { team: 'notInPlay' };

export type BluffSlot = Omit<EvilInPlaySlot, 'team'> & { team: 'bluff' };

export { getAutomaticCharacterTypeCounts } from '@/utils/character-type-counts';

/**
 * Demon then Minion slots, one per character in the setup, with the chosen character in each.
 * Confirmed characters fill empty slots first, then replace chosen ones from the last slot.
 */
export function getEvilInPlaySlots(
  scriptRoles: Role[],
  counts: CharacterTypeCounts,
  evilInPlay: Game['evilInPlay'],
  confirmedRoleIds: string[] = [],
): EvilInPlaySlot[] {
  const demons = scriptRoles.filter((role) => getTeam(role) === 'demon');
  const onlyDemon = demons.length === 1 ? demons[0] : undefined;
  const scriptRoleIds = new Set(scriptRoles.map((role) => role.id));
  const getSlots = (team: EvilInPlayTeam, count: number) =>
    Array.from({ length: Math.max(0, count) }, (_, index): EvilInPlaySlot => {
      const slotId = `${team}-${index}`;
      if (team === 'demon' && onlyDemon) {
        return { locked: true, roleId: onlyDemon.id, slotId, team };
      }
      const roleId = evilInPlay?.[slotId];
      return {
        locked: false,
        roleId: roleId && scriptRoleIds.has(roleId) ? roleId : undefined,
        slotId,
        team,
      };
    });

  const fillConfirmed = (slots: EvilInPlaySlot[]) => {
    const confirmed = new Set(
      confirmedRoleIds.filter((roleId) =>
        scriptRoles.some((role) => role.id === roleId && getTeam(role) === slots[0]?.team),
      ),
    );
    for (const slot of slots) {
      if (slot.roleId && confirmed.delete(slot.roleId)) slot.locked = true;
    }
    const openSlots = [
      ...slots.filter((slot) => !slot.roleId),
      ...slots.filter((slot) => slot.roleId && !slot.locked).reverse(),
    ];
    [...confirmed].forEach((roleId, index) => {
      const slot = openSlots[index];
      if (!slot) return;
      slot.roleId = roleId;
      slot.locked = true;
    });
    return slots;
  };

  return [
    ...fillConfirmed(getSlots('demon', counts.demons)),
    ...fillConfirmed(getSlots('minion', counts.minions)),
  ];
}

/**
 * In-play slots for a game, sized by its character counts or the standard setup, with characters
 * any player was confirmed as filled in.
 */
export function getGameEvilInPlaySlots(
  game: Pick<Game, 'characterTypeCounts' | 'evilInPlay' | 'players'>,
  scriptRoles: Role[],
) {
  const travellerRoleIds = new Set(
    scriptRoles.filter((role) => getTeam(role) === 'traveller').map((role) => role.id),
  );
  const playerCount = game.players.filter(
    (player) =>
      !player.isStoryteller &&
      !(player.roleAssignments ?? []).some((assignment) =>
        assignment.roleIds.some((roleId) => travellerRoleIds.has(roleId)),
      ),
  ).length;
  const counts = game.characterTypeCounts ?? getAutomaticCharacterTypeCounts(playerCount);
  const confirmedRoleIds = game.players.flatMap((player) =>
    (player.roleAssignments ?? [])
      .filter((assignment) => assignment.kind === 'confirm')
      .flatMap((assignment) => assignment.roleIds.map((roleId) => roleId.replace(/_evil$/, ''))),
  );
  return getEvilInPlaySlots(scriptRoles, counts, game.evilInPlay, confirmedRoleIds);
}

/** Bluff slots with the good character chosen in each. */
export function getBluffSlots(scriptRoles: Role[], bluffs: Game['bluffs']): BluffSlot[] {
  const goodRoleIds = new Set(scriptRoles.filter(isGoodRole).map((role) => role.id));
  return Array.from({ length: BLUFF_COUNT }, (_, index): BluffSlot => {
    const slotId = `bluff-${index}`;
    const roleId = bluffs?.[slotId];
    return {
      locked: false,
      roleId: roleId && goodRoleIds.has(roleId) ? roleId : undefined,
      slotId,
      team: 'bluff',
    };
  });
}

/**
 * Characters chosen as in play, per team. A team with nothing chosen is left out, so all of its
 * characters keep showing.
 */
export function getEvilInPlayRoleIds(slots: EvilInPlaySlot[]) {
  const roleIdsByTeam = new Map<EvilInPlayTeam, Set<string>>();
  for (const { roleId, team } of slots) {
    if (!roleId) continue;
    const roleIds = roleIdsByTeam.get(team) ?? new Set<string>();
    roleIds.add(roleId);
    roleIdsByTeam.set(team, roleIds);
  }
  return roleIdsByTeam;
}

/**
 * Good characters nobody has claimed or been confirmed as by this phase, and not chosen as a bluff,
 * so they may belong to the players without a claim.
 */
export function getUnclaimedRoles(
  scriptRoles: Role[],
  players: Player[],
  bluffs: Game['bluffs'],
  day: number,
  phase: GamePhase,
) {
  const takenRoleIds = new Set([
    ...getClaimedRoleIdsForDayOrPrevious(players, day, phase),
    ...Object.values(bluffs ?? {}),
  ]);
  return scriptRoles.filter((role) => isGoodRole(role) && !takenRoleIds.has(role.id));
}

/** Players (Storytellers excluded) with no claim or confirmed character by this phase, by seat. */
export function getPlayersWithoutClaims(players: Player[], day: number, phase: GamePhase) {
  return players
    .filter(
      (player) =>
        !player.isStoryteller &&
        getAssignedRoleIdsForDayOrPrevious(player.roleAssignments, day, phase).length === 0,
    )
    .sort((first, second) => first.seat - second.seat);
}

/**
 * Sets or clears the character chosen in one slot (in play or bluff), dropping the map once it is
 * empty.
 */
export function setEvilInPlayRole(
  evilInPlay: Game['evilInPlay'],
  slotId: string,
  roleId: string | undefined,
): Game['evilInPlay'] {
  const next = { ...evilInPlay };
  if (roleId) next[slotId] = roleId;
  else delete next[slotId];
  return Object.keys(next).length > 0 ? next : undefined;
}

/**
 * Adds a character to the not-in-play list, or swaps/removes `previousRoleId`. An empty list is
 * dropped.
 */
export function setNotInPlayRole(
  notInPlay: Game['notInPlay'],
  previousRoleId: string | undefined,
  roleId: string | undefined,
): Game['notInPlay'] {
  const next = (notInPlay ?? []).filter((id) => id !== previousRoleId && id !== roleId);
  if (roleId) next.push(roleId);
  return next.length > 0 ? next : undefined;
}

function getTeam(role: Role) {
  return role.team?.toLocaleLowerCase();
}

function isGoodRole(role: Role) {
  return getTeam(role) === 'townsfolk' || getTeam(role) === 'outsider';
}
