import { BookMarked, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { FriendNameLink } from '@/components/game/notes-tab/lessons/friend-name-link';
import { LessonsList } from '@/components/game/notes-tab/lessons/lessons-list';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { SavedNote } from '@/types/game';
import { getLessonsForPlayers, getLessonsForScriptCharacters } from '@/utils/lesson-utils';

/**
 * Notes you saved in other games about the players in this one, grouped by player, then notes
 * about only the characters on this script, grouped by character, until the game ends. The X hides
 * them for this game only; the gold dots on the map stay.
 */
export function TonightLessonsCard() {
  const { game } = useGameRouteContext();
  const savedNotes = useGameStore((state) => state.savedNotes);
  const dismissGameNote = useGameStore((state) => state.dismissGameNote);
  const appUserName = useGameStore((state) => state.appUserName);
  const dismissedNoteIds = new Set(game.dismissedNoteIds ?? []);
  const keepShown = <Entry extends { lessons: SavedNote[] }>(entry: Entry) => ({
    ...entry,
    lessons: entry.lessons.filter((lesson) => !dismissedNoteIds.has(lesson.id)),
  });
  const entries = getLessonsForPlayers(game, savedNotes)
    .map(keepShown)
    .filter((entry) => entry.lessons.length > 0);
  const characterEntries = getLessonsForScriptCharacters(game, savedNotes, appUserName)
    .map(keepShown)
    .filter((entry) => entry.lessons.length > 0);

  if (game.result !== undefined || entries.length + characterEntries.length === 0) {
    return null;
  }

  function handleHide() {
    for (const entry of [...entries, ...characterEntries]) {
      for (const lesson of entry.lessons) {
        dismissGameNote(game.id, lesson.id);
      }
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <BookMarked color={colors.savedNoteIcon} size={16} strokeWidth={2.4} />
        <Text style={styles.title}>Lessons for tonight</Text>
        <Pressable
          accessibilityHint="Hides these notes for this game. The dots on the map stay."
          accessibilityLabel="Hide lessons"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleHide}
          style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
        >
          <X color={colors.gameTextMuted} size={16} strokeWidth={2.4} />
        </Pressable>
      </View>
      {entries.map((entry) => (
        <View key={entry.playerId} style={styles.player}>
          <FriendNameLink name={entry.playerName} style={styles.name} />
          <LessonsList lessons={entry.lessons} />
        </View>
      ))}
      {characterEntries.map((entry) => (
        <View key={entry.role.id} style={styles.player}>
          <View style={styles.character}>
            <RoleIcon role={entry.role} size={22} />
            <Text style={styles.name}>{entry.role.name}</Text>
          </View>
          <LessonsList lessons={entry.lessons} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  character: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  card: {
    backgroundColor: colors.gameSurface,
    borderColor: colors.savedNoteIcon,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  close: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  closePressed: { opacity: 0.65 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  name: { color: colors.gameText, fontSize: 14, fontWeight: '800' },
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
