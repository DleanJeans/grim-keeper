import type { GameData } from '@/store/game-store';

export type BackupStats = {
  friends: number;
  games: number;
  notes: number;
  players: number;
  scripts: number;
};

export function getBackupStats(data: GameData): BackupStats {
  return {
    friends: data.friends.length,
    games: data.games.length,
    notes:
      data.savedNotes.length +
      data.games.reduce(
        (total, game) =>
          total +
          (game.playerDayNotes?.reduce((gameTotal, entry) => gameTotal + entry.notes.length, 0) ??
            0),
        0,
      ),
    players: data.games.reduce((total, game) => total + game.players.length, 0),
    scripts: data.scripts.length,
  };
}
