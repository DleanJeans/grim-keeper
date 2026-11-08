import { Pencil, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { SavedNote } from '@/types/game';
import { detectRoleIdsInNote } from '@/utils/saved-note-utils';

type LessonRowProps = {
  lesson: SavedNote;
};

/**
 * One saved note with its script and date. The pencil edits the text in place and can untag the
 * player, which keeps the note only for its characters; the trash deletes it after a confirm.
 */
export function LessonRow({ lesson }: LessonRowProps) {
  const showDialog = useAppDialog();
  const deleteSavedNote = useGameStore((state) => state.deleteSavedNote);
  const updateSavedNote = useGameStore((state) => state.updateSavedNote);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(lesson.text);
  const [tagPlayer, setTagPlayer] = useState(true);
  const [error, setError] = useState('');
  const playerName = lesson.playerName;

  function handleEdit() {
    setText(lesson.text);
    setTagPlayer(true);
    setError('');
    setEditing(true);
  }

  function handleSave() {
    const roleIds =
      tagPlayer || lesson.roleIds.length > 0
        ? lesson.roleIds
        : detectRoleIdsInNote(text, roleCatalog);
    if (updateSavedNote(lesson.id, { playerName: tagPlayer ? playerName : '', roleIds, text })) {
      setEditing(false);
      return;
    }
    setError(
      text.trim()
        ? `Name a character in the note to keep it without ${playerName}.`
        : 'Write something before saving.',
    );
  }

  function handleDelete() {
    showDialog('Delete note?', lesson.text, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSavedNote(lesson) },
    ]);
  }

  if (editing) {
    return (
      <View style={styles.editor}>
        <TextInput
          accessibilityLabel="Edit note"
          autoFocus
          multiline
          onChangeText={setText}
          placeholderTextColor={colors.inputPlaceholder}
          style={styles.input}
          value={text}
        />
        {playerName ? (
          <View style={styles.tagRow}>
            <Text style={styles.tagText}>
              {tagPlayer
                ? `Tagged: ${playerName}`
                : `Untagged: only about the character, not ${playerName}`}
            </Text>
            <Switch
              accessibilityLabel={`Tag ${playerName} in this note`}
              accessibilityRole="switch"
              accessibilityState={{ checked: tagPlayer }}
              onValueChange={setTagPlayer}
              thumbColor={tagPlayer ? colors.primary : colors.onDisabled}
              trackColor={{ false: colors.disabled, true: colors.borderStrong }}
              value={tagPlayer}
            />
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setEditing(false)}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          >
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.lesson}>
      <View style={styles.body}>
        <Text selectable style={styles.text}>
          {lesson.text}
        </Text>
        <Text style={styles.meta}>{getLessonSource(lesson)}</Text>
      </View>
      <Pressable
        accessibilityLabel={`Edit note: ${lesson.text}`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={handleEdit}
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
      >
        <Pencil color={colors.gameTextMuted} size={16} strokeWidth={2.2} />
      </Pressable>
      <Pressable
        accessibilityLabel={`Delete note: ${lesson.text}`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={handleDelete}
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
      >
        <Trash2 color={colors.gameTextMuted} size={16} strokeWidth={2.2} />
      </Pressable>
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
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  body: { flex: 1, gap: 1 },
  buttonPressed: { backgroundColor: colors.gameSurfacePressed },
  cancelButton: {
    alignItems: 'center',
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
  },
  cancelText: { color: colors.gameTextMuted, fontSize: 14, fontWeight: '700' },
  editor: { alignSelf: 'stretch', gap: 8 },
  error: { color: colors.danger, fontSize: 13 },
  iconButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  iconButtonPressed: { opacity: 0.6 },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.inputText,
    fontSize: 14,
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  lesson: { alignItems: 'flex-start', flexDirection: 'row', gap: 4 },
  meta: { color: colors.gameTextSubtle, fontSize: 12 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.saveButton,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 14,
  },
  saveButtonPressed: { backgroundColor: colors.saveButtonPressed },
  saveText: { color: colors.gameText, fontSize: 14, fontWeight: '800' },
  tagRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  tagText: { color: colors.gameTextSoft, flex: 1, fontSize: 13 },
  text: { color: colors.noteText, fontSize: 14, lineHeight: 19 },
});
