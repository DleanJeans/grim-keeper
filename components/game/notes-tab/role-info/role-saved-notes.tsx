import { router } from 'expo-router';
import { ChevronRight, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { RoleReferenceNoteLine } from '@/components/role-reference-note-line';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player, Role, SavedNote } from '@/types/game';

type RoleSavedNotesProps = {
  gameId: string;
  /** Saved notes for the character not yet dismissed in this game. */
  notes: SavedNote[];
  players: Player[];
  role: Role;
  roles: Role[];
  scriptId?: string;
  /** Name the character in the header, when the notes aren't under its Character info row. */
  showRole?: boolean;
};

/** A claimed character's saved notes in Character info, each in its own card with an X. */
export function RoleSavedNotes({
  gameId,
  notes,
  players,
  role,
  roles,
  scriptId,
  showRole = false,
}: RoleSavedNotesProps) {
  const dismissGameNote = useGameStore((state) => state.dismissGameNote);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint="Opens notes for this role"
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: '/role-notes',
            params: scriptId ? { roleId: role.id, scriptId } : { roleId: role.id },
          })
        }
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        {showRole ? <RoleIcon role={role} size={20} /> : null}
        <Text style={styles.title}>
          {showRole ? `${role.name} notes` : 'Notes'} ({notes.length})
        </Text>
        <ChevronRight color={colors.textMuted} size={16} strokeWidth={2.5} />
      </Pressable>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDismiss={() => dismissGameNote(gameId, note.id)}
          players={players}
          roles={roles}
          scriptId={scriptId}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 6,
  },
  container: { gap: 6 },
  dismissButton: {
    alignItems: 'center',
    borderRadius: 6,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  dismissButtonPressed: { backgroundColor: colors.surfacePressed },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 28 },
  headerPressed: { opacity: 0.65 },
  note: { flex: 1, paddingTop: 2 },
  noteText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  title: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '800' },
});

function NoteCard({
  note,
  onDismiss,
  players,
  roles,
  scriptId,
}: {
  note: SavedNote;
  onDismiss: () => void;
  players: Player[];
  roles: Role[];
  scriptId?: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.note}>
        <RoleReferenceNoteLine
          players={players}
          roles={roles}
          scriptId={scriptId}
          style={styles.noteText}
          text={note.text}
        />
      </View>
      <Pressable
        accessibilityLabel="Dismiss note"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onDismiss}
        style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}
      >
        <X color={colors.textMuted} size={16} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
