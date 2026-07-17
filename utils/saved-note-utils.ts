import type { SavedNote } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';

export function getSavedNote(savedNotes: SavedNote[], playerName: string, text: string) {
  const playerKey = normalizePlayerName(playerName).toLocaleLowerCase();
  const savedText = text.trim();

  return savedNotes.find(
    (note) =>
      normalizePlayerName(note.playerName).toLocaleLowerCase() === playerKey &&
      note.text === savedText,
  );
}

export function getSavedNoteTextsForRole(savedNotes: SavedNote[], roleId: string) {
  return savedNotes.filter((note) => note.roleIds.includes(roleId)).map((note) => note.text);
}
