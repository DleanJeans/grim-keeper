import { StyleSheet, View } from 'react-native';

import { LessonRow } from '@/components/game/notes-tab/lessons/lesson-row';
import type { SavedNote } from '@/types/game';

type LessonsListProps = {
  lessons: SavedNote[];
};

/** Saved notes about a player, one editable row each. */
export function LessonsList({ lessons }: LessonsListProps) {
  return (
    <View style={styles.list}>
      {lessons.map((lesson) => (
        <LessonRow key={lesson.id} lesson={lesson} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { alignSelf: 'stretch', gap: 6 },
});
