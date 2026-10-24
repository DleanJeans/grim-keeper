import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DjSongSection } from '@/components/dj/dj-song-section';
import { NotFoundScreen } from '@/components/not-found-screen';
import { ResponsiveContent } from '@/components/responsive-content';
import { RoleIcon } from '@/components/role-icon';
import { RoleWikiLink } from '@/components/role-wiki-link';
import { SavedGameRow } from '@/components/saved-game-row';
import { SavedNotes } from '@/components/saved-notes';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useDjStore } from '@/store/dj-store';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { SavedNote } from '@/types/game';
import { getGamesWithRoleInPlay } from '@/utils/game-utils';
import { GENERIC_CHARACTER_TYPE_ROLE_REFERENCES, GENERIC_KILLER_ROLES } from '@/utils/role-utils';

export default function RoleNotesScreen() {
  const { roleId, scriptId } = useLocalSearchParams<{ roleId: string; scriptId?: string }>();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const games = useGameStore((state) => state.games);
  const scripts = useGameStore((state) => state.scripts);
  const djEnabled = useDjStore((state) => state.enabled);
  const script = scripts.find((item) => item.id === scriptId);
  const game = games.find((item) => (item.scriptId ?? item.script?.id) === scriptId);
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
    return <NotFoundScreen message="Role not found." title="Role not found" />;
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
  const roleGames = getGamesWithRoleInPlay(games, role.id);

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
        contentContainerStyle={styles.scrollContent}
        style={styles.screen}
      >
        <ResponsiveContent style={styles.content}>
          <Text selectable style={styles.description}>
            {description ?? 'No description available.'}
          </Text>

          <RoleWikiLink roleName={role.name} />

          {djEnabled ? (
            <DjSongSection editable target={{ id: role.id, type: 'character' }} title="DJ songs" />
          ) : null}

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

          {roleGames.length > 0 ? (
            <View style={styles.gamesSection}>
              <Text selectable style={styles.sectionTitle}>
                Saved games
              </Text>
              {roleGames.map((roleGame) => (
                <SavedGameRow key={roleGame.id} game={roleGame} />
              ))}
            </View>
          ) : null}
        </ResponsiveContent>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  gamesSection: {
    gap: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
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
