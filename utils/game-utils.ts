import type { Game, GameResult } from '@/types/game';

export type GameStats = {
  completedGames: number;
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

  return {
    completedGames,
    totalGames: games.length,
    winRate: completedGames === 0 ? undefined : Math.round((wins / completedGames) * 100),
    wins,
  };
}

export function isGameResult(value: unknown): value is GameResult {
  return value === 'lost' || value === 'won';
}
