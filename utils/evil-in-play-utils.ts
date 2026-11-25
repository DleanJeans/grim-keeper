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

export type GoodInPlayTeam = 'townsfolk' | 'outsider';

export type GoodInPlaySlot = Omit<EvilInPlaySlot, 'team'> & { team: GoodInPlayTeam };

export type NotInPlaySlot = Omit<EvilInPlaySlot, 'team'> & {
  /** Which characters can be ruled out in this slot. */
  group: 'evil' | GoodInPlayTeam;
  team: 'notInPlay';
};

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
  const getSlot = (team: EvilInPlayTeam, index: number): EvilInPlaySlot => {
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
  };
  const getSlots = (team: EvilInPlayTeam, count: number) =>
    Array.from(
      { length: getSlotCount(team, count, (roleId) => scriptRoleIds.has(roleId), evilInPlay) },
      (_, index) => getSlot(team, index),
    );

  const confirmedOf = (team: EvilInPlayTeam) =>
    confirmedRoleIds.filter((roleId) =>
      scriptRoles.some((role) => role.id === roleId && getTeam(role) === team),
    );

  return [
    ...fillConfirmedSlots(getSlots('demon', counts.demons), confirmedOf('demon'), (index) =>
      getSlot('demon', index),
    ),
    ...fillConfirmedSlots(getSlots('minion', counts.minions), confirmedOf('minion'), (index) =>
      getSlot('minion', index),
    ),
  ];
}

/**
 * Townsfolk then Outsider slots sized by the setup, with the chosen character in each. Confirmed
 * characters fill empty slots first, like the evil ones.
 */
export function getGoodInPlaySlots(
  scriptRoles: Role[],
  counts: CharacterTypeCounts,
  goodInPlay: Game['goodInPlay'],
  confirmedRoleIds: string[] = [],
): GoodInPlaySlot[] {
  const getSlots = (team: GoodInPlayTeam, count: number) => {
    const teamRoleIds = new Set(
      scriptRoles.filter((role) => getTeam(role) === team).map((role) => role.id),
    );
    const getSlot = (index: number): GoodInPlaySlot => {
      const slotId = `${team}-${index}`;
      const roleId = goodInPlay?.[slotId];
      return {
        locked: false,
        roleId: roleId && teamRoleIds.has(roleId) ? roleId : undefined,
        slotId,
        team,
      };
    };
    const slots = Array.from(
      { length: getSlotCount(team, count, (roleId) => teamRoleIds.has(roleId), goodInPlay) },
      (_, index) => getSlot(index),
    );
    return fillConfirmedSlots(
      slots,
      confirmedRoleIds.filter((roleId) => teamRoleIds.has(roleId)),
      getSlot,
    );
  };

  return [...getSlots('townsfolk', counts.townsfolk), ...getSlots('outsider', counts.outsiders)];
}

/** Game players (no Storytellers or Travellers) and the setup counts for them. */
function getGameSetup(game: Pick<Game, 'characterTypeCounts' | 'players'>, scriptRoles: Role[]) {
  const travellerRoleIds = new Set(
    scriptRoles.filter((role) => getTeam(role) === 'traveller').map((role) => role.id),
  );
  const playerCount = game.players.filter(
    (player) =>
      !player.isStoryteller &&
      !(player.roleAssignments ?? []).some((assignment) =>
        assignment.roleIds.some((roleId) =>
          travellerRoleIds.has(roleId.replace(/_(good|evil)$/, '')),
        ),
      ),
  ).length;
  const counts = game.characterTypeCounts ?? getAutomaticCharacterTypeCounts(playerCount);
  const confirmedRoleIds = game.players.flatMap((player) =>
    (player.roleAssignments ?? [])
      .filter((assignment) => assignment.kind === 'confirm')
      .flatMap((assignment) => assignment.roleIds.map((roleId) => roleId.replace(/_evil$/, ''))),
  );
  return { confirmedRoleIds, counts };
}

/** Townsfolk and Outsider slots for a game, with characters any player was confirmed as filled in. */
export function getGameGoodInPlaySlots(
  game: Pick<Game, 'characterTypeCounts' | 'goodInPlay' | 'players'>,
  scriptRoles: Role[],
) {
  const { confirmedRoleIds, counts } = getGameSetup(game, scriptRoles);
  return getGoodInPlaySlots(scriptRoles, counts, game.goodInPlay, confirmedRoleIds);
}

/**
 * Fills the empty Townsfolk and Outsider slots with characters claimed or confirmed by this phase
 * that aren't in a slot yet, as far as they fit.
 */
export function autoFillGoodInPlay(
  slots: GoodInPlaySlot[],
  scriptRoles: Role[],
  players: Player[],
  day: number,
  phase: GamePhase,
  goodInPlay: Game['goodInPlay'],
): Game['goodInPlay'] {
  const next = { ...goodInPlay };
  const taken = new Set(slots.map((slot) => slot.roleId));
  for (const roleId of getClaimedRoleIdsForDayOrPrevious(players, day, phase)) {
    const role = scriptRoles.find((candidate) => candidate.id === roleId);
    const team = role ? getTeam(role) : undefined;
    if (!role || taken.has(role.id) || (team !== 'townsfolk' && team !== 'outsider')) continue;
    const slot = slots.find((candidate) => candidate.team === team && !candidate.roleId);
    if (!slot) continue;
    slot.roleId = role.id;
    taken.add(role.id);
    next[slot.slotId] = role.id;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

/**
 * In-play slots for a game, sized by its character counts or the standard setup, with characters
 * any player was confirmed as filled in.
 */
export function getGameEvilInPlaySlots(
  game: Pick<Game, 'characterTypeCounts' | 'evilInPlay' | 'players'>,
  scriptRoles: Role[],
) {
  const { confirmedRoleIds, counts } = getGameSetup(game, scriptRoles);
  return getEvilInPlaySlots(scriptRoles, counts, game.evilInPlay, confirmedRoleIds);
}

/**
 * Bluff slots with the good character chosen in each: the usual 3, plus one spare after the last
 * when every slot is filled, for a 4-evil game where the Storyteller gave more than 3 bluffs.
 */
export function getBluffSlots(scriptRoles: Role[], bluffs: Game['bluffs']): BluffSlot[] {
  const goodRoleIds = new Set(scriptRoles.filter(isGoodRole).map((role) => role.id));
  const isFilled = (index: number) => {
    const roleId = bluffs?.[`bluff-${index}`];
    return Boolean(roleId && goodRoleIds.has(roleId));
  };
  let count = BLUFF_COUNT;
  for (let index = BLUFF_COUNT; index < 20; index++) if (isFilled(index)) count = index + 1;
  while (Array.from({ length: count }, (_, index) => isFilled(index)).every(Boolean)) count++;
  return Array.from({ length: count }, (_, index): BluffSlot => {
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
  notInPlay: Game['notInPlay'] = [],
) {
  const takenRoleIds = new Set([
    ...getClaimedRoleIdsForDayOrPrevious(players, day, phase),
    ...Object.values(bluffs ?? {}),
    ...notInPlay,
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
 * Sets or clears the character chosen in one slot (in play, good in play or bluff), dropping the map once it is
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

/** Confirmed characters fill empty slots first, then replace chosen ones from the last slot. */
function fillConfirmedSlots<Slot extends { locked: boolean; roleId?: string }>(
  slots: Slot[],
  confirmedRoleIds: string[],
  /** Makes an extra slot, past the setup count, for a confirmed character that doesn't fit. */
  createSlot?: (index: number) => Slot,
) {
  const confirmed = new Set(confirmedRoleIds);
  for (const slot of slots) {
    if (slot.roleId && confirmed.delete(slot.roleId)) slot.locked = true;
  }
  const openSlots = [
    ...slots.filter((slot) => !slot.roleId),
    ...slots.filter((slot) => slot.roleId && !slot.locked).reverse(),
  ];
  [...confirmed].forEach((roleId, index) => {
    let slot = openSlots[index];
    if (!slot && createSlot) {
      slot = createSlot(slots.length);
      slots.push(slot);
    }
    if (!slot) return;
    slot.roleId = roleId;
    slot.locked = true;
  });
  return slots;
}

/** The setup count, or more when characters were logged in slots past it. */
function getSlotCount(
  team: string,
  count: number,
  isValidRole: (roleId: string) => boolean,
  stored: Record<string, string> | undefined,
) {
  let length = Math.max(0, count);
  for (const [slotId, roleId] of Object.entries(stored ?? {})) {
    const match = slotId.match(/^(.+)-(\d+)$/);
    if (match?.[1] === team && isValidRole(roleId)) {
      length = Math.max(length, Number(match[2]) + 1);
    }
  }
  return length;
}

/** The Townsfolk, Outsider, Minion and Demon counts the setup expects for a game. */
export function getGameCharacterCounts(
  game: Pick<Game, 'characterTypeCounts' | 'players'>,
  scriptRoles: Role[],
) {
  return getGameSetup(game, scriptRoles).counts;
}

function getTeam(role: Role) {
  return role.team?.toLocaleLowerCase();
}

function isGoodRole(role: Role) {
  return getTeam(role) === 'townsfolk' || getTeam(role) === 'outsider';
}
