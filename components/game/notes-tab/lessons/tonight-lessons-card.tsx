import { BookMarked, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { FriendNameLink } from '@/components/game/notes-tab/lessons/friend-name-link';
import { LessonsList } from '@/components/game/notes-tab/lessons/lessons-list';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { useLessonsCollapsed } from '@/hooks/use-lessons-collapsed';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role, SavedNote } from '@/types/game';
import {
  findNoteRole,
  getLessonsForPlayers,
  getLessonsForScriptCharacters,
  getStorytellerLessons,
} from '@/utils/lesson-utils';

/**
 * Notes you saved in other games about the players in this one, grouped by player, then notes
 * about only the characters on this script, grouped by character (with the note's other
 * characters beside it in the heading), until the game ends. The header button collapses
 * the card to just its title and expands it again.
 */
export function TonightLessonsCard() {
  const { game } = useGameRouteContext();
  const [collapsed, toggleCollapsed] = useLessonsCollapsed();
  const savedNotes = useGameStore((state) => state.savedNotes);
  const appUserName = useGameStore((state) => state.appUserName);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const scriptRoles = game.script?.roles ?? [];
  const dismissedNoteIds = new Set(game.dismissedNoteIds ?? []);
  const keepShown = <Entry extends { lessons: SavedNote[] }>(entry: Entry) => ({
    ...entry,
    lessons: entry.lessons.filter((lesson) => !dismissedNoteIds.has(lesson.id)),
  });
  const entries = getLessonsForPlayers(game, savedNotes)
    .map(keepShown)
    .filter((entry) => entry.lessons.length > 0);
  const storytellerLessons = keepShown({
    lessons: getStorytellerLessons(game, savedNotes),
  }).lessons;
  const characterEntries = getLessonsForScriptCharacters(game, savedNotes, appUserName)
    .map(keepShown)
    .filter((entry) => entry.lessons.length > 0);

  if (
    game.result !== undefined ||
    entries.length + characterEntries.length + storytellerLessons.length === 0
  ) {
    return null;
  }

  const Chevron = collapsed ? ChevronDown : ChevronUp;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel={collapsed ? 'Show lessons' : 'Collapse lessons'}
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
        onPress={toggleCollapsed}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <BookMarked color={colors.savedNoteIcon} size={16} strokeWidth={2.4} />
        <Text style={styles.title}>Lessons for tonight</Text>
        <View style={styles.close}>
          <Chevron color={colors.gameTextMuted} size={18} strokeWidth={2.4} />
        </View>
      </Pressable>
      {collapsed
        ? null
        : entries.map((entry) => (
            <View key={entry.playerId} style={styles.player}>
              <FriendNameLink name={entry.playerName} style={styles.name} />
              <LessonsList lessons={entry.lessons} />
            </View>
          ))}
      {collapsed || storytellerLessons.length === 0 ? null : (
        <View style={styles.player}>
          <Text style={styles.name}>(Storyteller)</Text>
          <LessonsList lessons={storytellerLessons} roles={scriptRoles} />
        </View>
      )}
      {collapsed
        ? null
        : characterEntries.map((entry) => (
            <View key={entry.key} style={styles.player}>
              <CharacterHeading
                otherRoles={entry.otherRoleIds.map((roleId) => ({
                  id: roleId,
                  role: findNoteRole(roleId, scriptRoles, roleCatalog),
                }))}
                role={entry.role}
              />
              <LessonsList lessons={entry.lessons} roles={scriptRoles} />
            </View>
          ))}
    </View>
  );
}

/** The character the notes are listed under, then the other characters they are about. */
function CharacterHeading({
  otherRoles,
  role,
}: {
  otherRoles: { id: string; role?: Role }[];
  role: Role;
}) {
  return (
    <View style={styles.character}>
      <View style={styles.mainRole}>
        <RoleIcon role={role} size={22} />
        <Text style={styles.name}>{role.name}</Text>
      </View>
      {otherRoles.map((other) => (
        <View key={other.id} style={styles.otherRole}>
          {other.role ? <RoleIcon role={other.role} size={16} /> : null}
          <Text style={styles.otherRoleName}>{other.role?.name ?? other.id}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  character: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 2,
  },
  card: {
    backgroundColor: colors.gameSurface,
    borderColor: colors.savedNoteIcon,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  close: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  headerPressed: { opacity: 0.65 },
  mainRole: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  name: { color: colors.gameText, fontSize: 14, fontWeight: '800' },
  otherRole: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  otherRoleName: { color: colors.gameTextSoft, fontSize: 12, fontWeight: '700' },
  player: { alignItems: 'flex-start', gap: 2 },
  title: {
    color: colors.savedNoteIcon,
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
