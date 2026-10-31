import type { Game, GameResult, Player, Role } from '@/types/game';
import { getEventPhaseIndex } from '@/utils/game-phase-utils';
import { APP_USER_ID } from '@/utils/object-id';
import { getEffectiveRoleForPlayer, getRoleAlignment } from '@/utils/role-utils';

export type GameStats = {
  completedGames: number;
  evilCompletedGames: number;
  evilGames: number;
  evilCompletedSideRate: number | undefined;
  evilSideRate: number | undefined;
  evilWins: number;
  evilWinRate: number | undefined;
  goodCompletedGames: number;
  goodGames: number;
  goodCompletedSideRate: number | undefined;
  goodSideRate: number | undefined;
  goodWins: number;
  goodWinRate: number | undefined;
  totalGames: number;
  winRate: number | undefined;
  wins: number;
};

export type CharacterStats = {
  completedGames: number;
  count: number;
  role: Role;
  winRate: number | undefined;
  wins: number;
};

export function getLastDayWithData(game: Game): number {
  let lastDay = 0;

  for (const conversation of game.conversations) {
    if (conversation.day > lastDay) {
      lastDay = conversation.day;
    }
  }

  for (const note of game.playerDayNotes ?? []) {
    if (note.day > lastDay) {
      lastDay = note.day;
    }
  }

  for (const player of game.players) {
    for (const assignment of player.roleAssignments ?? []) {
      if (assignment.day > lastDay) {
        lastDay = assignment.day;
      }
    }

    if (player.death && player.death.day > lastDay) {
      lastDay = player.death.day;
    }

    if (player.revive && player.revive.day > lastDay) {
      lastDay = player.revive.day;
    }
  }

  return Math.max(1, lastDay);
}

/**
 * Games where a player's current role (confirm over claim, as on the saved-game
 * row) or a Demon/Minion "In play" pick is `roleId`. `_evil`/`_good` variants
 * count as the base role.
 */
export function getGamesWithRoleInPlay(games: Game[], roleId: string): Game[] {
  const baseRoleId = getBaseRoleId(roleId);

  return games.filter((game) => {
    const roles = game.script?.roles ?? [];
    const isPlayerRole = game.players.some((player) => {
      if (player.isStoryteller) {
        return false;
      }
      const { role } = getEffectiveRoleForPlayer(player, roles, game.activeDay);
      return role ? getBaseRoleId(role.id) === baseRoleId : false;
    });

    return (
      isPlayerRole ||
      Object.values(game.evilInPlay ?? {}).some((id) => getBaseRoleId(id) === baseRoleId)
    );
  });
}

export function getGameStats(games: Game[], playerId = APP_USER_ID): GameStats {
  const playerGames =
    playerId === APP_USER_ID
      ? games
      : games.filter((game) => game.players.some((player) => player.id === playerId));
  let completedGames = 0;
  let evilGames = 0;
  let evilWins = 0;
  let evilCompletedGames = 0;
  let goodGames = 0;
  let goodWins = 0;
  let goodCompletedGames = 0;
  let wins = 0;

  for (const game of playerGames) {
    const result = getGameResultForPlayer(game, playerId);
    const hasResult = result !== undefined;

    if (hasResult) {
      completedGames += 1;
      if (result === 'won') {
        wins += 1;
      }
    }

    const alignment = getGameAlignment(game, playerId);
    if (alignment === 'g') {
      goodGames += 1;
      if (hasResult) {
        goodCompletedGames += 1;
        if (result === 'won') {
          goodWins += 1;
        }
      }
    } else if (alignment === 'e') {
      evilGames += 1;
      if (hasResult) {
        evilCompletedGames += 1;
        if (result === 'won') {
          evilWins += 1;
        }
      }
    }
  }

  const completedAlignmentGames = goodCompletedGames + evilCompletedGames;

  return {
    completedGames,
    evilCompletedGames,
    evilGames,
    evilCompletedSideRate: getPercentage(evilCompletedGames, completedAlignmentGames),
    evilSideRate: getPercentage(evilGames, goodGames + evilGames),
    evilWins,
    evilWinRate: getPercentage(evilWins, evilCompletedGames),
    goodCompletedGames,
    goodGames,
    goodCompletedSideRate: getPercentage(goodCompletedGames, completedAlignmentGames),
    goodSideRate: getPercentage(goodGames, goodGames + evilGames),
    goodWins,
    goodWinRate: getPercentage(goodWins, goodCompletedGames),
    totalGames: playerGames.length,
    winRate: completedGames === 0 ? undefined : Math.round((wins / completedGames) * 100),
    wins,
  };
}

export function getCharacterStats(games: Game[], playerId = APP_USER_ID): CharacterStats[] {
  const characterCounts = new Map<
    string,
    { completedGames: number; count: number; role: Role; wins: number }
  >();

  for (const game of games) {
    const player = game.players.find((candidate) => candidate.id === playerId);
    const role =
      player && game.script
        ? getEffectiveRoleForPlayer(player, game.script.roles, game.activeDay).role
        : null;

    if (!role) {
      continue;
    }

    const character = characterCounts.get(role.name) ?? {
      completedGames: 0,
      count: 0,
      role,
      wins: 0,
    };
    character.count += 1;

    const result = getGameResultForPlayer(game, playerId);
    if (result !== undefined) {
      character.completedGames += 1;
      if (result === 'won') {
        character.wins += 1;
      }
    }

    characterCounts.set(role.name, character);
  }

  return [...characterCounts.values()]
    .map((character) => ({
      ...character,
      winRate: getPercentage(character.wins, character.completedGames),
    }))
    .sort(
      (first, second) =>
        second.count - first.count || first.role.name.localeCompare(second.role.name),
    );
}

function getGameAlignment(game: Game, playerId: string) {
  const player = game.players.find((candidate) => candidate.id === playerId);
  const role =
    player && game.script
      ? getEffectiveRoleForPlayer(player, game.script.roles, game.activeDay).role
      : null;

  return role ? getRoleAlignment(role) : undefined;
}

export function getGameResultForPlayer(game: Game, playerId: string): GameResult | undefined {
  if (game.result === undefined || playerId === APP_USER_ID) {
    return game.result;
  }

  const playerAlignment = getGameAlignment(game, playerId);
  const appUserAlignment = getGameAlignment(game, APP_USER_ID);
  if (!playerAlignment || !appUserAlignment || playerAlignment === appUserAlignment) {
    return game.result;
  }

  return game.result === 'won' ? 'lost' : 'won';
}

function getPercentage(value: number, total: number) {
  return total === 0 ? undefined : Math.round((value / total) * 100);
}

export function isGameResult(value: unknown): value is GameResult {
  return value === 'lost' || value === 'won';
}

function getBaseRoleId(roleId: string) {
  return roleId.replace(/_(evil|good)$/, '');
}

export type HeadToHeadSide = {
  /** Games with this friend on this side, results or not. */
  games: number;
  /** Games on this side that have a result. */
  completedGames: number;
  /** Games the app user won, out of `completedGames`. */
  wins: number;
};

export type HeadToHeadStats = {
  opposite: HeadToHeadSide;
  same: HeadToHeadSide;
};

/**
 * The app user's record with a friend: games on the same team and on opposite teams. Games where
 * either alignment is unknown are left out.
 */
export function getHeadToHeadStats(games: Game[], friendId: string): HeadToHeadStats {
  const stats: HeadToHeadStats = {
    opposite: { completedGames: 0, games: 0, wins: 0 },
    same: { completedGames: 0, games: 0, wins: 0 },
  };

  for (const game of games) {
    if (friendId === APP_USER_ID || !game.players.some((player) => player.id === friendId)) {
      continue;
    }
    const friendAlignment = getGameAlignment(game, friendId);
    const appUserAlignment = getGameAlignment(game, APP_USER_ID);
    if (!friendAlignment || !appUserAlignment) continue;

    const side = friendAlignment === appUserAlignment ? stats.same : stats.opposite;
    side.games += 1;
    if (game.result !== undefined) {
      side.completedGames += 1;
      if (game.result === 'won') side.wins += 1;
    }
  }

  return stats;
}

export type FriendClaimStats = {
  /** Games where the friend's claim could be checked against a confirmed character. */
  checkedClaims: number;
  /** Characters the friend claimed, most often first; one count per game. */
  topClaims: Array<{ count: number; roleId: string }>;
  /** Checked claims that matched the confirmed character. */
  trueClaims: number;
};

/**
 * What a friend tends to claim, and how often their final claim in a game matched the character
 * they were confirmed as. Evil and Traveller suffixes are ignored.
 */
export function getFriendClaimStats(games: Game[], friendId: string): FriendClaimStats {
  const counts = new Map<string, number>();
  let checkedClaims = 0;
  let trueClaims = 0;

  for (const game of games) {
    const player = game.players.find((candidate) => candidate.id === friendId);
    if (!player) continue;
    const assignments = player.roleAssignments ?? [];
    const claimed = new Set(
      assignments
        .filter((assignment) => assignment.kind === 'claim')
        .flatMap((assignment) => assignment.roleIds.map(getBaseRoleId))
        .filter((roleId) => !roleId.startsWith('generic_')),
    );
    for (const roleId of claimed) counts.set(roleId, (counts.get(roleId) ?? 0) + 1);

    const lastClaim = getLastAssignment(assignments, 'claim');
    const lastConfirm = getLastAssignment(assignments, 'confirm');
    const claimIds = (lastClaim?.roleIds ?? []).map(getBaseRoleId);
    if (claimIds.length > 0 && lastConfirm?.roleIds.length) {
      checkedClaims += 1;
      const confirmed = new Set(lastConfirm.roleIds.map(getBaseRoleId));
      if (claimIds.some((roleId) => confirmed.has(roleId))) trueClaims += 1;
    }
  }

  const topClaims = [...counts]
    .map(([roleId, count]) => ({ count, roleId }))
    .sort((a, b) => b.count - a.count || a.roleId.localeCompare(b.roleId));

  return { checkedClaims, topClaims, trueClaims };
}

function getLastAssignment(
  assignments: NonNullable<Player['roleAssignments']>,
  kind: 'claim' | 'confirm',
) {
  return assignments
    .filter((assignment) => assignment.kind === kind)
    .reduce<(typeof assignments)[number] | undefined>(
      (latest, assignment) =>
        !latest ||
        getEventPhaseIndex(assignment.day, assignment.phase ?? 'day') >
          getEventPhaseIndex(latest.day, latest.phase ?? 'day') ||
        (assignment.day === latest.day &&
          (assignment.phase ?? 'day') === (latest.phase ?? 'day') &&
          assignment.updatedAt > latest.updatedAt)
          ? assignment
          : latest,
      undefined,
    );
}
