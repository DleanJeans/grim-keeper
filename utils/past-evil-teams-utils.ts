import type { Game, Player, Role } from '@/types/game';
import { getAssignmentStages, getFriendGameRoles } from '@/utils/friend-game-roles-utils';
import { getWinningTeam } from '@/utils/game-utils';
import { getRoleAlignment, getRolesByIds, isTravelerRole } from '@/utils/role-utils';
import { getGameScriptRoles } from '@/utils/script-service';

export type PastEvilMemberKind = 'demon' | 'minion' | 'turned-evil';

export type PastEvilMember = {
  /** Good characters this player claimed. */
  bluffs: Role[];
  kind: PastEvilMemberKind;
  /** Missing when the character only comes from the In play picker. */
  player?: Pick<Player, 'id' | 'name'>;
  role: Role;
};

export type PastEvilGame = {
  /** The Bluffs tokens filled in for that game. */
  demonBluffs: Role[];
  game: Game;
  members: PastEvilMember[];
  playerCount: number;
  winningTeam: 'good' | 'evil' | undefined;
};

export type RoleTally = { count: number; role: Role };

export type PastEvilTeams = {
  bluffs: RoleTally[];
  demons: RoleTally[];
  evilWins: number;
  /** Earlier games that found a Demon, Minion or bluff, newest first. */
  games: PastEvilGame[];
  goodWins: number;
  minions: RoleTally[];
};

const KIND_ORDER: Record<PastEvilMemberKind, number> = { demon: 0, minion: 1, 'turned-evil': 2 };

/**
 * The evil teams of the other saved games on `currentGame`'s script: players whose last confirm
 * is evil, with the good characters they claimed, or the In play picker when nobody was
 * confirmed evil. Also counts the Demons, Minions and bluffs, and who won.
 */
export function getPastEvilTeams(games: Game[], currentGame: Game): PastEvilTeams {
  const scriptId = getScriptId(currentGame);
  const pastGames = scriptId
    ? games
        .filter((game) => game.id !== currentGame.id && getScriptId(game) === scriptId)
        .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    : [];

  let goodWins = 0;
  let evilWins = 0;
  const evilGames: PastEvilGame[] = [];

  for (const game of pastGames) {
    const pastGame = getPastEvilGame(game);
    if (pastGame.winningTeam === 'good') goodWins += 1;
    if (pastGame.winningTeam === 'evil') evilWins += 1;
    if (pastGame.members.length > 0 || pastGame.demonBluffs.length > 0) {
      evilGames.push(pastGame);
    }
  }

  return {
    bluffs: tally(evilGames.map((game) => game.members.flatMap((member) => member.bluffs))),
    demons: tally(evilGames.map((game) => getMemberRoles(game, 'demon'))),
    evilWins,
    games: evilGames,
    goodWins,
    minions: tally(evilGames.map((game) => getMemberRoles(game, 'minion'))),
  };
}

/** Whether `roleId` was on that game's evil team or bluffed by it. */
export function pastEvilGameHasRole(pastGame: PastEvilGame, roleId: string) {
  return pastGame.members.some(
    (member) => member.role.id === roleId || member.bluffs.some((bluff) => bluff.id === roleId),
  );
}

function getPastEvilGame(game: Game): PastEvilGame {
  const roles = getGameScriptRoles(game);
  const players = game.players.filter((player) => !player.isStoryteller);
  const members = players
    .flatMap((player) => getConfirmedEvilMember(player, roles) ?? [])
    .sort((first, second) => KIND_ORDER[first.kind] - KIND_ORDER[second.kind]);

  return {
    demonBluffs: getSlotRoles(game.bluffs, roles),
    game,
    members: members.length > 0 ? members : getInPlayMembers(game, roles),
    playerCount: players.filter((player) => !isTravelerPlayer(player, roles)).length,
    winningTeam: getWinningTeam(game),
  };
}

function getConfirmedEvilMember(player: Player, roles: Role[]): PastEvilMember | undefined {
  const confirmStages = getAssignmentStages(player.roleAssignments, 'confirm');
  const lastStage = confirmStages[confirmStages.length - 1];
  if (!lastStage) return undefined;

  const role = getRolesByIds(lastStage, roles).find(
    (candidate) => getRoleAlignment(candidate) === 'e' && !isTravelerRole(candidate),
  );
  if (!role) return undefined;

  const bluffs = getFriendGameRoles(player, roles).claims.filter(
    (claim) => getRoleAlignment(claim) === 'g' && !isTravelerRole(claim),
  );
  return { bluffs, kind: getKind(role), player: { id: player.id, name: player.name }, role };
}

function getInPlayMembers(game: Game, roles: Role[]): PastEvilMember[] {
  return getSlotRoles(game.evilInPlay, roles)
    .map((role): PastEvilMember => ({ bluffs: [], kind: getKind(role), role }))
    .sort((first, second) => KIND_ORDER[first.kind] - KIND_ORDER[second.kind]);
}

/** Roles in slot order (`demon-0`, `minion-1`, `bluff-2`), skipping unknown ids. */
function getSlotRoles(slots: Record<string, string> | undefined, roles: Role[]) {
  const roleIds = new Set(roles.map((role) => role.id));
  const slotRoleIds = Object.keys(slots ?? {})
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
    .map((slotId) => slots?.[slotId] ?? '')
    .filter((roleId) => roleIds.has(roleId));
  return getRolesByIds(slotRoleIds, roles);
}

function getKind(role: Role): PastEvilMemberKind {
  const team = role.team?.toLocaleLowerCase();
  if (team === 'demon') return 'demon';
  if (team === 'minion') return 'minion';
  return 'turned-evil';
}

function getMemberRoles(pastGame: PastEvilGame, kind: PastEvilMemberKind) {
  return pastGame.members.filter((member) => member.kind === kind).map((member) => member.role);
}

/** How many games each role shows up in, most first. */
function tally(rolesPerGame: Role[][]): RoleTally[] {
  const tallies = new Map<string, RoleTally>();
  for (const roles of rolesPerGame) {
    for (const role of new Map(roles.map((each) => [each.id, each])).values()) {
      const current = tallies.get(role.id);
      tallies.set(role.id, { count: (current?.count ?? 0) + 1, role: current?.role ?? role });
    }
  }
  return [...tallies.values()].sort(
    (first, second) =>
      second.count - first.count || first.role.name.localeCompare(second.role.name),
  );
}

function isTravelerPlayer(player: Player, roles: Role[]) {
  const confirmStages = getAssignmentStages(player.roleAssignments, 'confirm');
  const lastStage = confirmStages[confirmStages.length - 1] ?? [];
  const lastRoles = getRolesByIds(lastStage, roles);
  return lastRoles.length > 0 && lastRoles.every(isTravelerRole);
}

function getScriptId(game: Game) {
  return game.scriptId ?? game.script?.id;
}
