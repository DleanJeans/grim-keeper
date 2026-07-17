import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { RoleNotes } from '@/components/role-notes';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { GENERIC_CHARACTER_TYPE_ROLES, GENERIC_KILLER_ROLES } from '@/utils/role-utils';
import { getSavedNoteTextsForRole } from '@/utils/saved-note-utils';

export default function RoleNotesScreen() {
  const { roleId, scriptId } = useLocalSearchParams<{ roleId: string; scriptId: string }>();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const deleteRoleNote = useGameStore((state) => state.deleteRoleNote);
  const script = useGameStore((state) => state.scripts.find((item) => item.id === scriptId));
  const game = useGameStore((state) => state.games.find((item) => item.script?.id === scriptId));
  const scriptRole = script?.roles.find((role) => role.id === roleId);
  const catalogRole = roleCatalog.find((role) => role.id === roleId);
  const genericRole = [...GENERIC_CHARACTER_TYPE_ROLES, ...GENERIC_KILLER_ROLES].find(
    (role) => role.id === roleId,
  );
  const role = scriptRole
    ? {
        ...scriptRole,
        notes: [...new Set([...(scriptRole.notes ?? []), ...(catalogRole?.notes ?? [])])],
      }
    : (catalogRole ?? genericRole);

  if (!role) {
    return (
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 }}>
        <Stack.Screen options={{ title: 'Role not found' }} />
        <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
          Role not found.
        </Text>
      </View>
    );
  }

  const currentRoleId = role.id;
  const hasNotes = !!role.notes?.length || getSavedNoteTextsForRole(savedNotes, role.id).length > 0;

  function handleDeleteNote(note: string) {
    Alert.alert('Delete note?', note, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRoleNote(currentRoleId, note) },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: `${role.name} Notes` }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
        style={{ backgroundColor: colors.background, flex: 1 }}
      >
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
          <RoleIcon role={role} size={48} />
          <Text selectable style={{ color: colors.text, flex: 1, fontSize: 24, fontWeight: '900' }}>
            {role.name}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: 8,
            borderWidth: 1,
            padding: 16,
          }}
        >
          {hasNotes ? (
            <RoleNotes
              day={game?.activeDay}
              game={game}
              label
              onDeleteNote={handleDeleteNote}
              players={game?.players}
              role={role}
              roles={script?.roles ?? roleCatalog}
              scriptId={scriptId}
            />
          ) : (
            <Text selectable style={{ color: colors.textMuted, fontSize: 15 }}>
              No notes for this role.
            </Text>
          )}
        </View>
      </ScrollView>
    </>
  );
}
