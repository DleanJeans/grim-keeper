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

export function getGameStats(games: Game[]): GameStats {
  let completedGames = 0;
  let evilGames = 0;
  let evilWins = 0;
  let evilCompletedGames = 0;
  let goodGames = 0;
  let goodWins = 0;
  let goodCompletedGames = 0;
  let wins = 0;

  for (const game of games) {
    const hasResult = game.result !== undefined;

    if (hasResult) {
      completedGames += 1;
      if (game.result === 'won') {
        wins += 1;
      }
    }

    const alignment = getGameAlignment(game);
    if (alignment === 'g') {
      goodGames += 1;
      if (hasResult) {
        goodCompletedGames += 1;
        if (game.result === 'won') {
          goodWins += 1;
        }
      }
    } else if (alignment === 'e') {
      evilGames += 1;
      if (hasResult) {
        evilCompletedGames += 1;
        if (game.result === 'won') {
          evilWins += 1;
        }
      }
    }
  }

  return {
    completedGames,
    evilGames,
    evilSideRate: getPercentage(evilGames, goodGames + evilGames),
    evilWins,
    evilWinRate: getPercentage(evilWins, evilCompletedGames),
    goodGames,
    goodSideRate: getPercentage(goodGames, goodGames + evilGames),
    goodWins,
    goodWinRate: getPercentage(goodWins, goodCompletedGames),
    totalGames: games.length,
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

    if (game.result !== undefined) {
      character.completedGames += 1;
      if (game.result === 'won') {
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

function getGameAlignment(game: Game) {
  const appUser = game.players.find((player) => player.id === APP_USER_ID);
  const role =
    appUser && game.script
      ? getEffectiveRoleForPlayer(appUser, game.script.roles, game.activeDay).role
      : null;

  return role ? getRoleAlignment(role) : undefined;
}

function getPercentage(value: number, total: number) {
  return total === 0 ? undefined : Math.round((value / total) * 100);
}

export function isGameResult(value: unknown): value is GameResult {
  return value === 'lost' || value === 'won';
}
