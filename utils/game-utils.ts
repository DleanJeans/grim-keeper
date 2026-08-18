import type { Game, GameResult } from '@/types/game';
import { APP_USER_ID } from '@/utils/object-id';
import { getEffectiveRoleForPlayer, getRoleAlignment } from '@/utils/role-utils';

export type GameStats = {
  completedGames: number;
  evilWinRate: number | undefined;
  goodWinRate: number | undefined;
  totalGames: number;
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

export function getGameStats(games: Game[]): GameStats {
  const completedGames = games.filter((game) => game.result !== undefined).length;
  const wins = games.filter((game) => game.result === 'won').length;
  const goodGames = games.filter(
    (game) => game.result !== undefined && getGameAlignment(game) === 'g',
  );
  const evilGames = games.filter(
    (game) => game.result !== undefined && getGameAlignment(game) === 'e',
  );

  return {
    completedGames,
    evilWinRate: getWinRate(evilGames),
    goodWinRate: getWinRate(goodGames),
    totalGames: games.length,
    winRate: completedGames === 0 ? undefined : Math.round((wins / completedGames) * 100),
    wins,
  };
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
  if (games.length === 0) {
    return undefined;
  }

  return Math.round((games.filter((game) => game.result === 'won').length / games.length) * 100);
}

export function isGameResult(value: unknown): value is GameResult {
  return value === 'lost' || value === 'won';
}
