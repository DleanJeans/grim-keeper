import { StyleSheet, View } from 'react-native';

import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Player, Role, SavedNote } from '@/types/game';

export type ClaimedRoleNote = {
  key: string;
  roleName: string;
  text: string;
  scriptName: string;
  day: number;
  createdAt: string;
};

export function collectClaimedRoleNotes(
  savedNotes: SavedNote[],
  claimedRoles: Role[],
): ClaimedRoleNote[] {
  if (claimedRoles.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const notes: ClaimedRoleNote[] = [];
  for (const role of claimedRoles) {
    for (const savedNote of savedNotes) {
      if (!savedNote.roleIds.includes(role.id)) {
        continue;
      }
      const dedupeKey = `${role.id}:${savedNote.id}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      notes.push({
        createdAt: savedNote.createdAt,
        day: savedNote.day,
        key: dedupeKey,
        roleName: role.name,
        scriptName: savedNote.scriptName,
        text: savedNote.text,
      });
    }
  }
  return notes;
}

export function ClaimedRoleNotes({
  day,
  game,
  notes,
  players,
  roles,
  scriptId,
}: {
  day: number;
  game: Game;
  notes: ClaimedRoleNote[];
  players: Player[];
  roles: Role[];
  scriptId?: string;
}) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      {notes.map((note) => {
        const labelParts = [note.roleName];
        if (note.scriptName) {
          labelParts.push(note.scriptName);
        }
        labelParts.push(formatClaimedRoleDate(note.createdAt));
        return (
          <View key={note.key} style={styles.noteRow}>
            <RoleReferencedNoteText
              day={note.day || day}
              game={game}
              players={players}
              roles={roles}
              scriptId={scriptId}
              style={styles.noteText}
              text={note.text}
            />
            <Text style={styles.roleName}>{labelParts.join(' - ')}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  noteRow: { gap: 2 },
  noteText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  roleName: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

function formatClaimedRoleDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  const monthDay = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
  }).format(date);

  return date.getFullYear() === new Date().getFullYear()
    ? monthDay
    : `${monthDay}, ${date.getFullYear()}`;
}
