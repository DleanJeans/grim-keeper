import { Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { SavedNote } from '@/types/game';

type LessonsListProps = {
  lessons: SavedNote[];
};

/**
 * Saved notes about a player, one line each with the script and date they came from, and a
 * trash button that deletes the note everywhere after a confirm.
 */
export function LessonsList({ lessons }: LessonsListProps) {
  const showDialog = useAppDialog();
  const deleteSavedNote = useGameStore((state) => state.deleteSavedNote);

  function handleDelete(lesson: SavedNote) {
    showDialog('Delete note?', lesson.text, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSavedNote(lesson) },
    ]);
  }

  return (
    <View style={styles.list}>
      {lessons.map((lesson) => (
        <View key={lesson.id} style={styles.lesson}>
          <View style={styles.body}>
            <Text selectable style={styles.text}>
              {lesson.text}
            </Text>
            <Text style={styles.meta}>{getLessonSource(lesson)}</Text>
          </View>
          <Pressable
            accessibilityLabel={`Delete note: ${lesson.text}`}
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => handleDelete(lesson)}
            style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}
          >
            <Trash2 color={colors.gameTextMuted} size={16} strokeWidth={2.2} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function getLessonSource(lesson: SavedNote) {
  const date = new Date(lesson.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
  return lesson.scriptName ? `${lesson.scriptName} · ${date}` : date;
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 1 },
  delete: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  deletePressed: { opacity: 0.6 },
  lesson: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  list: { alignSelf: 'stretch', gap: 6 },
  meta: { color: colors.gameTextSubtle, fontSize: 12 },
  text: { color: colors.noteText, fontSize: 14, lineHeight: 19 },
});
