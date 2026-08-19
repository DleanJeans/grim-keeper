import type { Game, GameResult, Role } from '@/types/game';
import { APP_USER_ID } from '@/utils/object-id';
import { getEffectiveRoleForPlayer, getRoleAlignment } from '@/utils/role-utils';

export type GameStats = {
  completedGames: number;
  evilGames: number;
  evilSideRate: number | undefined;
  evilWins: number;
  evilWinRate: number | undefined;
  goodGames: number;
  goodSideRate: number | undefined;
  goodWins: number;
  goodWinRate: number | undefined;
  totalGames: number;
  winRate: number | undefined;
  wins: number;
};

export type MostPlayedCharacter = {
  count: number;
  role: Role;
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

export function getGameStats(games: Game[]): GameStats {
  const completedGames = games.filter((game) => game.result !== undefined).length;
  const wins = games.filter((game) => game.result === 'won').length;
  const goodGames = games.filter((game) => getGameAlignment(game) === 'g');
  const evilGames = games.filter((game) => getGameAlignment(game) === 'e');
  const completedGoodGames = goodGames.filter((game) => game.result !== undefined);
  const completedEvilGames = evilGames.filter((game) => game.result !== undefined);
  const goodWins = completedGoodGames.filter((game) => game.result === 'won').length;
  const evilWins = completedEvilGames.filter((game) => game.result === 'won').length;

  return {
    completedGames,
    evilGames: evilGames.length,
    evilSideRate: getPercentage(evilGames.length, goodGames.length + evilGames.length),
    evilWins,
    evilWinRate: getWinRate(completedEvilGames),
    goodGames: goodGames.length,
    goodSideRate: getPercentage(goodGames.length, goodGames.length + evilGames.length),
    goodWins,
    goodWinRate: getWinRate(completedGoodGames),
    totalGames: games.length,
    winRate: completedGames === 0 ? undefined : Math.round((wins / completedGames) * 100),
    wins,
  };
}

export function getMostPlayedCharacters(games: Game[], limit = 5): MostPlayedCharacter[] {
  const characterCounts = new Map<string, MostPlayedCharacter>();

  for (const game of games) {
    const appUser = game.players.find((player) => player.id === APP_USER_ID);
    const role =
      appUser && game.script
        ? getEffectiveRoleForPlayer(appUser, game.script.roles, game.activeDay).role
        : null;

    if (!role) {
      continue;
    }

    const character = characterCounts.get(role.name);
    if (character) {
      character.count += 1;
    } else {
      characterCounts.set(role.name, { count: 1, role });
    }
  }

  return [...characterCounts.values()]
    .sort(
      (first, second) =>
        second.count - first.count || first.role.name.localeCompare(second.role.name),
    )
    .slice(0, limit);
}

function getGameAlignment(game: Game) {
  const appUser = game.players.find((player) => player.id === APP_USER_ID);
  const role =
    appUser && game.script
      ? getEffectiveRoleForPlayer(appUser, game.script.roles, game.activeDay).role
      : null;

  return role ? getRoleAlignment(role) : undefined;
}

function getWinRate(games: Game[]) {
  return getPercentage(games.filter((game) => game.result === 'won').length, games.length);
}

function getPercentage(value: number, total: number) {
  return total === 0 ? undefined : Math.round((value / total) * 100);
}

export function isGameResult(value: unknown): value is GameResult {
  return value === 'lost' || value === 'won';
}
