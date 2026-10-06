import type { CharacterTypeCounts, Game, Role } from '@/types/game';

export type EvilInPlayTeam = 'demon' | 'minion';

export type EvilInPlaySlot = {
  /** Fixed to the script's only Demon, so it can't be changed. */
  locked: boolean;
  roleId?: string;
  slotId: string;
  team: EvilInPlayTeam;
};

/** Standard setup for the player count (travellers excluded). */
export function getAutomaticCharacterTypeCounts(playerCount: number): CharacterTypeCounts {
  if (playerCount <= 5) return { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
  if (playerCount === 6) return { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
  if (playerCount === 7) return { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 };
  if (playerCount === 8) return { townsfolk: 5, outsiders: 1, minions: 1, demons: 1 };
  if (playerCount === 9) return { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 };
  if (playerCount === 10) return { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 };
  if (playerCount === 11) return { townsfolk: 7, outsiders: 1, minions: 2, demons: 1 };
  if (playerCount === 12) return { townsfolk: 7, outsiders: 2, minions: 2, demons: 1 };
  if (playerCount === 13) return { townsfolk: 9, outsiders: 0, minions: 3, demons: 1 };
  if (playerCount === 14) return { townsfolk: 9, outsiders: 1, minions: 3, demons: 1 };
  return { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 };
}

/** Demon then Minion slots, one per character in the setup, with the chosen character in each. */
export function getEvilInPlaySlots(
  scriptRoles: Role[],
  counts: CharacterTypeCounts,
  evilInPlay: Game['evilInPlay'],
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

  return [...getSlots('demon', counts.demons), ...getSlots('minion', counts.minions)];
}

/** In-play slots for a game, sized by its character counts or the standard setup. */
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
  return getEvilInPlaySlots(scriptRoles, counts, game.evilInPlay);
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

/** Sets or clears the character chosen in one slot, dropping the map once it is empty. */
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

function getTeam(role: Role) {
  return role.team?.toLocaleLowerCase();
}
