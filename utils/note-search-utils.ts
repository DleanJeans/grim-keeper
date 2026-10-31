import type { Game, GamePhase, Role, SavedNote } from '@/types/game';

/** Most results shown per section, newest first. */
export const NOTE_SEARCH_LIMIT = 50;

export type SavedNoteHit = {
  gameId: string;
  id: string;
  playerName: string;
  roleNames: string[];
  scriptName: string;
  text: string;
};

export type GameNoteHit = {
  day: number;
  gameCreatedAt: string;
  gameId: string;
  id: string;
  phase: GamePhase;
  playerName: string;
  scriptName: string;
  text: string;
};

export type NoteSearchResults = {
  gameNotes: GameNoteHit[];
  savedNotes: SavedNoteHit[];
};

/**
 * Notes matching the query by text, player name or (for saved notes) character name: saved
 * notes, which include role notes, then notes written during games. Empty for a blank query.
 */
export function searchNotes(
  query: string,
  savedNotes: SavedNote[],
  games: Game[],
  roles: Role[],
): NoteSearchResults {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) {
    return { gameNotes: [], savedNotes: [] };
  }
  const matches = (...values: string[]) =>
    values.some((value) => value.toLocaleLowerCase().includes(needle));
  const roleById = new Map(roles.map((role) => [role.id, role]));

  const savedHits = savedNotes
    .map((note) => ({
      gameId: note.gameId,
      id: note.id,
      playerName: note.playerName,
      roleNames: note.roleIds.map((roleId) => roleById.get(roleId)?.name ?? roleId),
      scriptName: note.scriptName,
      text: note.text,
      updatedAt: note.updatedAt,
    }))
    .filter((note) => matches(note.text, note.playerName, ...note.roleNames))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, NOTE_SEARCH_LIMIT)
    .map(({ updatedAt: _updatedAt, ...hit }) => hit);

  const gameHits: Array<GameNoteHit & { updatedAt: string }> = [];
  for (const game of games) {
    const playerNameById = new Map(game.players.map((player) => [player.id, player.name]));
    for (const dayNote of game.playerDayNotes ?? []) {
      const playerName = playerNameById.get(dayNote.playerId) ?? 'Unknown';
      for (const entry of dayNote.notes) {
        if (!matches(entry.text, playerName)) continue;
        gameHits.push({
          day: dayNote.day,
          gameCreatedAt: game.createdAt,
          gameId: game.id,
          id: `${game.id}:${entry.id}`,
          phase: dayNote.phase ?? 'day',
          playerName,
          scriptName: game.script?.name ?? '',
          text: entry.text,
          updatedAt: entry.updatedAt,
        });
      }
    }
  }

  return {
    gameNotes: gameHits
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, NOTE_SEARCH_LIMIT)
      .map(({ updatedAt: _updatedAt, ...hit }) => hit),
    savedNotes: savedHits,
  };
}
