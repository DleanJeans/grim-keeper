import { router } from 'expo-router';
import { ChevronRight, X } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { RoleReferenceNoteLine } from '@/components/role-reference-note-line';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role, SavedNote } from '@/types/game';

type ClaimRoleNotesPopupProps = {
  notes: SavedNote[];
  onDismiss: () => void;
  playerName: string;
  players: Player[];
  role: Role;
  roles: Role[];
  scriptId?: string;
};

/** Saved notes for a character, popped up right after someone claims it. Stays until closed. */
export function ClaimRoleNotesPopup({
  notes,
  onDismiss,
  playerName,
  players,
  role,
  roles,
  scriptId,
}: ClaimRoleNotesPopupProps) {
  const countLabel = `${notes.length} saved ${notes.length === 1 ? 'note' : 'notes'}`;

  function handleOpenRoleNotes() {
    onDismiss();
    router.push({
      pathname: '/role-notes',
      params: scriptId ? { roleId: role.id, scriptId } : { roleId: role.id },
    });
  }

  return (
    <View accessibilityLiveRegion="polite" style={styles.popup}>
      <View style={styles.header}>
        <RoleIcon role={role} size={28} />
        <View style={styles.titleColumn}>
          <Text numberOfLines={1} style={styles.title}>
            {playerName} claimed {role.name}
          </Text>
          <Text style={styles.subtitle}>{countLabel}</Text>
        </View>
        <Pressable
          accessibilityLabel="Close role notes"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onDismiss}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <X color={colors.gameTextSoft} size={18} strokeWidth={2.6} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.notes} style={styles.notesScroll}>
        {notes.map((note) => (
          <RoleReferenceNoteLine
            key={note.id}
            players={players}
            roles={roles}
            scriptId={scriptId}
            style={styles.noteText}
            text={note.text}
          />
        ))}
      </ScrollView>
      <Pressable
        accessibilityHint="Opens notes for this role"
        accessibilityRole="button"
        onPress={handleOpenRoleNotes}
        style={({ pressed }) => [styles.allNotesButton, pressed && styles.pressed]}
      >
        <Text style={styles.allNotesText}>All {role.name} notes</Text>
        <ChevronRight color={colors.gameTextSoft} size={16} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  allNotesButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 2,
    minHeight: 36,
    paddingHorizontal: 8,
  },
  allNotesText: { color: colors.gameTextSoft, fontSize: 13, fontWeight: '800' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  iconButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  notes: { gap: 8 },
  notesScroll: { flexGrow: 0, maxHeight: 220 },
  noteText: { color: colors.gameTextSoft, fontSize: 14, lineHeight: 20 },
  popup: {
    backgroundColor: colors.gameSurfaceRaised,
    borderColor: colors.gameBorder,
    borderRadius: 10,
    borderWidth: 1,
    bottom: 88,
    gap: 8,
    left: 16,
    paddingBottom: 4,
    paddingLeft: 14,
    paddingRight: 6,
    paddingTop: 8,
    position: 'absolute',
    right: 92,
  },
  pressed: { backgroundColor: colors.gameSurfacePressed },
  subtitle: { color: colors.gameTextMuted, fontSize: 12, fontWeight: '700' },
  title: { color: colors.gameText, fontSize: 14, fontWeight: '800' },
  titleColumn: { flex: 1 },
});
