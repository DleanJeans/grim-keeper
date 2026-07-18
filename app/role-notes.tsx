import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { SavedNotes } from '@/components/saved-notes';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { SavedNote } from '@/types/game';
import { GENERIC_CHARACTER_TYPE_ROLE_REFERENCES, GENERIC_KILLER_ROLES } from '@/utils/role-utils';

export default function RoleNotesScreen() {
  const { roleId, scriptId } = useLocalSearchParams<{ roleId: string; scriptId: string }>();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const games = useGameStore((state) => state.games);
  const scripts = useGameStore((state) => state.scripts);
  const script = scripts.find((item) => item.id === scriptId);
  const game = games.find((item) => item.script?.id === scriptId);
  const scriptRole = script?.roles.find((role) => role.id === roleId);
  const catalogRole = roleCatalog.find((role) => role.id === roleId);
  const genericRole = [...GENERIC_CHARACTER_TYPE_ROLE_REFERENCES, ...GENERIC_KILLER_ROLES].find(
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

  const roleSavedNotes = savedNotes.filter((note) => note.roleIds.includes(role.id));
  const mergedNotes: SavedNote[] = [];
  const seenTexts = new Set<string>();
  for (const note of roleSavedNotes) {
    if (seenTexts.has(note.text)) {
      continue;
    }
    seenTexts.add(note.text);
    mergedNotes.push(note);
  }
  for (const text of role.notes ?? []) {
    if (seenTexts.has(text)) {
      continue;
    }
    seenTexts.add(text);
    mergedNotes.push(buildLegacyNote(text, role.id, script));
  }

  const hasNotes = mergedNotes.length > 0;

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

        {hasNotes ? (
          <SavedNotes
            day={game?.activeDay}
            games={games}
            label
            mode="role"
            notes={mergedNotes}
            players={game?.players}
            roleId={role.id}
            roles={script?.roles ?? roleCatalog}
            scripts={scripts}
          />
        ) : (
          <Text selectable style={{ color: colors.textMuted, fontSize: 15 }}>
            No notes for this role.
          </Text>
        )}
      </ScrollView>
    </>
  );
}

function buildLegacyNote(text: string, roleId: string, script?: { id: string; name: string }) {
  return {
    createdAt: '',
    day: 0,
    gameId: '',
    id: `legacy-${roleId}-${text}`,
    playerName: '',
    roleIds: [roleId],
    scriptId: script?.id,
    scriptName: script?.name ?? '',
    text,
    updatedAt: '',
  } satisfies SavedNote;
}
