import { StyleSheet, View } from 'react-native';

import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Player, Role, SavedNote } from '@/types/game';
import { getSavedNoteTextsForRole } from '@/utils/saved-note-utils';

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
      <Text selectable style={styles.title}>
        Claimed role notes
      </Text>
      {notes.map((note) => (
        <View key={note.key} style={styles.noteRow}>
          <RoleReferencedNoteText
            day={day}
            game={game}
            players={players}
            roles={roles}
            scriptId={scriptId}
            style={styles.noteText}
            text={note.text}
          />
          <Text selectable style={styles.roleName}>
            {note.roleName}
          </Text>
        </View>
      ))}
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
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
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

export type ClaimedRoleNote = {
  key: string;
  roleName: string;
  text: string;
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
    for (const text of getSavedNoteTextsForRole(savedNotes, role.id)) {
      const dedupeKey = `${role.id}:${text}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      notes.push({ key: dedupeKey, roleName: role.name, text });
    }
  }
  return notes;
}
