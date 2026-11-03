import { router } from 'expo-router';
import { ChevronRight, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { RoleReferenceNoteLine } from '@/components/role-reference-note-line';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player, Role, SavedNote } from '@/types/game';

type ClaimedRoleSavedNotesProps = {
  gameId: string;
  players: Player[];
  /** The focused player's claimed characters with their saved notes not yet dismissed. */
  roleNotes: { notes: SavedNote[]; role: Role }[];
  roles: Role[];
  scriptId?: string;
};

/** Saved notes for the characters the focused player claims, at the bottom of Character info. */
export function ClaimedRoleSavedNotes({
  gameId,
  players,
  roleNotes,
  roles,
  scriptId,
}: ClaimedRoleSavedNotesProps) {
  const dismissGameNote = useGameStore((state) => state.dismissGameNote);

  if (roleNotes.length === 0) return null;

  return (
    <View style={styles.container}>
      {roleNotes.map(({ notes, role }) => (
        <View key={role.id} style={styles.roleNotes}>
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
            <RoleIcon role={role} size={20} />
            <Text style={styles.title}>
              {role.name} notes ({notes.length})
            </Text>
            <ChevronRight color={colors.textMuted} size={16} strokeWidth={2.5} />
          </Pressable>
          {notes.map((note) => (
            <DismissableNote
              key={note.id}
              note={note}
              onDismiss={() => dismissGameNote(gameId, note.id)}
              players={players}
              roles={roles}
              scriptId={scriptId}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 10,
    marginTop: 4,
    paddingTop: 8,
  },
  dismissButton: {
    alignItems: 'center',
    borderRadius: 6,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  dismissButtonPressed: { backgroundColor: colors.surfacePressed },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 32 },
  headerPressed: { opacity: 0.65 },
  note: { flex: 1 },
  noteRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 4 },
  noteText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  roleNotes: { gap: 6 },
  title: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '800' },
});

function DismissableNote({
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
    <View style={styles.noteRow}>
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
