import type { Role, SavedNote } from '@/types/game';
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

export function detectRoleIdsInNote(text: string, roles: Role[]) {
  return roles
    .filter((role) => {
      const escapedName = role.name
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\s+/g, '\\s+');

      return (
        !!escapedName && new RegExp(`(^|[^a-z0-9])${escapedName}(?=$|[^a-z0-9])`, 'i').test(text)
      );
    })
    .map((role) => role.id);
}
