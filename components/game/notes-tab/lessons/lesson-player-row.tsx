import { Check, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { SavedNote } from '@/types/game';
import type { LessonPlayer } from '@/utils/lesson-utils';

type LessonPlayerRowProps = {
  day: number;
  editing: boolean;
  gameId: string;
  /** Lessons already saved about this player in this game. */
  lessons: SavedNote[];
  onClose: () => void;
  onEdit: () => void;
  player: LessonPlayer;
  scriptId?: string;
  showRoles: boolean;
};

/** One player in Lessons for next time: + opens an empty field that saves a lesson about them. */
export function LessonPlayerRow({
  day,
  editing,
  gameId,
  lessons,
  onClose,
  onEdit,
  player,
  scriptId,
  showRoles,
}: LessonPlayerRowProps) {
  const saveNoteForFutureGames = useGameStore((state) => state.saveNoteForFutureGames);
  const [text, setText] = useState('');

  function handleClose() {
    setText('');
    onClose();
  }

  function handleSave() {
    if (saveNoteForFutureGames(player.playerName, [], text, { day, gameId, scriptId })) {
      handleClose();
    }
  }

  return (
    <View style={[styles.row, editing && styles.rowEditing]}>
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.name}>
          {player.playerName}
        </Text>
        {showRoles && player.roleText ? (
          <Text
            numberOfLines={1}
            style={[styles.roleChip, player.evil ? styles.roleChipEvil : styles.roleChipGood]}
          >
            {player.roleText}
          </Text>
        ) : null}
        {editing ? null : (
          <Pressable
            accessibilityLabel={`Add lesson about ${player.playerName}`}
            accessibilityRole="button"
            hitSlop={4}
            onPress={onEdit}
            style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
          >
            <Plus color={colors.gameText} size={18} strokeWidth={2.6} />
          </Pressable>
        )}
      </View>
      {lessons.map((lesson) => (
        <View key={lesson.id} style={styles.lesson}>
          <Check color={colors.success} size={14} strokeWidth={2.6} />
          <Text selectable style={styles.lessonText}>
            {lesson.text}
          </Text>
        </View>
      ))}
      {editing ? (
        <>
          <TextInput
            accessibilityLabel={`Lesson about ${player.playerName}`}
            autoFocus
            multiline
            onChangeText={setText}
            placeholder={`What to remember about ${player.playerName} next time`}
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.input}
            value={text}
          />
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={handleClose}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !text.trim() }}
              disabled={!text.trim()}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveButton,
                !text.trim() && styles.saveButtonDisabled,
                pressed && styles.saveButtonPressed,
              ]}
            >
              <Text style={styles.saveText}>Save lesson</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.gameSurfaceRaised,
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 44,
  },
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
  header: { alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 36 },
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
  lesson: { alignItems: 'flex-start', flexDirection: 'row', gap: 6 },
  lessonText: { color: colors.noteText, flex: 1, fontSize: 14, lineHeight: 19 },
  name: { color: colors.gameText, flex: 1, fontSize: 15, fontWeight: '800' },
  roleChip: {
    borderRadius: 999,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleChipEvil: { backgroundColor: colors.dangerSurface, color: colors.danger },
  roleChipGood: { backgroundColor: colors.gameSurfaceRaised, color: colors.gameTextSoft },
  row: {
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowEditing: { borderColor: colors.savedNoteIcon },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.saveButton,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 14,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonPressed: { backgroundColor: colors.saveButtonPressed },
  saveText: { color: colors.gameText, fontSize: 14, fontWeight: '800' },
});
