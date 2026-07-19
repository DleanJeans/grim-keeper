import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { RoleIcon } from '@/components/role-icon';
import { RoleWikiLink } from '@/components/role-wiki-link';
import { SavedNotes } from '@/components/saved-notes';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
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
      <View style={styles.notFoundContainer}>
        <Stack.Screen options={{ title: 'Role not found' }} />
        <Text selectable style={styles.notFoundText}>
          Role not found.
        </Text>
      </View>
    );
  }

  const description = scriptRole?.ability ?? catalogRole?.ability;
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
      <Stack.Screen
        options={{
          header: () => (
            <TitleHeader icon={<RoleIcon role={role} scale={2} size={28} />} title={role.name} />
          ),
          title: role.name,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        style={styles.screen}
      >
        <Text selectable style={styles.description}>
          {description ?? 'No description available.'}
        </Text>

        <RoleWikiLink roleName={role.name} />

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
          <Text selectable style={styles.emptyText}>
            No notes for this role.
          </Text>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  notFoundContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});

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
