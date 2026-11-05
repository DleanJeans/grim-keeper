import { BookMarked } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { LessonsList } from '@/components/game/notes-tab/lessons/lessons-list';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { SavedNote } from '@/types/game';

type PlayerLessonsProps = {
  lessons: SavedNote[];
};

/** The focused player's notes from other games, shown in full above the link to all of them. */
export function PlayerLessons({ lessons }: PlayerLessonsProps) {
  if (lessons.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <BookMarked color={colors.savedNoteIcon} size={16} strokeWidth={2.4} />
        <Text style={styles.title}>Lessons ({lessons.length})</Text>
      </View>
      <LessonsList lessons={lessons} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  title: {
    color: colors.savedNoteIcon,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
