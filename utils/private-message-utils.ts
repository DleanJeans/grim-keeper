import type { Player, Role } from '@/types/game';
import { getPlayerNameMatches, getRoleNameMatches } from '@/utils/saved-note-utils';

export type PrivateMessagePiece =
  | { kind: 'player'; player: Player }
  | { kind: 'role'; role: Role }
  | { kind: 'text'; text: string };

/**
 * One line of a private message as groups of pieces that must stay together on one row. Groups
 * are separated by a space, so a word, a role or a player only wraps at a space, and
 * punctuation such as the comma in "Imp," stays with its name.
 */
export type PrivateMessageLine = PrivateMessagePiece[][];

/** Splits a message into lines of words, role names and player names, in reading order. */
export function getPrivateMessageLines(
  text: string,
  roles: Role[],
  players: Player[],
): PrivateMessageLine[] {
  return text.split('\n').map((line) => getLineGroups(line, roles, players));
}

function getLineGroups(line: string, roles: Role[], players: Player[]): PrivateMessageLine {
  const candidates = [
    ...getRoleNameMatches(line, roles).map((match) => ({ ...match, kind: 'role' as const })),
    ...getPlayerNameMatches(line, players).map((match) => ({ ...match, kind: 'player' as const })),
  ].sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const matches: typeof candidates = [];
  for (const candidate of candidates) {
    if (!matches.length || candidate.start >= matches[matches.length - 1].end) {
      matches.push(candidate);
    }
  }

  const groups: PrivateMessageLine = [];
  let current: PrivateMessagePiece[] = [];
  const flush = () => {
    if (current.length) groups.push(current);
    current = [];
  };
  const addText = (text: string) => {
    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        flush();
      } else {
        current.push({ kind: 'text', text: part });
      }
    }
  };

  let cursor = 0;
  for (const match of matches) {
    addText(line.slice(cursor, match.start));
    current.push(
      match.kind === 'role'
        ? { kind: 'role', role: match.role }
        : { kind: 'player', player: match.player },
    );
    cursor = match.end;
  }
  addText(line.slice(cursor));
  flush();
  return groups;
}
