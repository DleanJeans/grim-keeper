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

export type RoleNameMatch = {
  end: number;
  role: Role;
  start: number;
};

export function getRoleNameMatches(text: string, roles: Role[]): RoleNameMatch[] {
  const candidates = roles.flatMap((role) => {
    const escapedName = role.name
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s+');

    if (!escapedName) {
      return [];
    }

    const matches: RoleNameMatch[] = [];
    const pattern = new RegExp(`(^|[^a-z0-9])(${escapedName})(?=$|[^a-z0-9])`, 'gi');
    let match = pattern.exec(text);

    while (match) {
      const start = match.index + match[1].length;
      matches.push({ end: start + match[2].length, role, start });
      match = pattern.exec(text);
    }

    return matches;
  });

  const matches: RoleNameMatch[] = [];
  for (const candidate of candidates.sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start),
  )) {
    if (!matches.length || candidate.start >= matches[matches.length - 1].end) {
      matches.push(candidate);
    }
  }

  return matches;
}
