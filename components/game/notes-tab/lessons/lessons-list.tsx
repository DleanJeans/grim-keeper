import { StyleSheet, View } from 'react-native';

import { LessonRow } from '@/components/game/notes-tab/lessons/lesson-row';
import type { Role, SavedNote } from '@/types/game';

type LessonsListProps = {
  lessons: SavedNote[];
  /** The game's script roles, to name characters the catalog doesn't know. */
  roles?: Role[];
};

/** Saved notes about a player, one editable row each. */
export function LessonsList({ lessons, roles }: LessonsListProps) {
  return (
    <View style={styles.list}>
      {lessons.map((lesson) => (
        <LessonRow key={lesson.id} lesson={lesson} roles={roles} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { alignSelf: 'stretch', gap: 6 },
});
