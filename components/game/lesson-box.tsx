import { X } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { NoteAutocompleteInput } from '@/components/game/notes-tab/note-autocomplete-input';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game } from '@/types/game';
import { detectPlayerNameInNote, detectRoleIdsInNote } from '@/utils/saved-note-utils';

type LessonBoxProps = {
  game: Game;
  onChangeText: (text: string) => void;
  onRemove: () => void;
  onTagPlayerChange: (tagPlayer: boolean) => void;
  tagPlayer: boolean;
  value: string;
};

/** One lesson of a game: a text box with suggestions and the characters it will be saved under. */
export function LessonBox({
  game,
  onChangeText,
  onRemove,
  onTagPlayerChange,
  tagPlayer,
  value,
}: LessonBoxProps) {
  const roles = game.script?.roles;
  const namedRoles = useMemo(() => {
    const roleIds = detectRoleIdsInNote(value, roles ?? []);
    return (roles ?? []).filter((role) => roleIds.includes(role.id));
  }, [value, roles]);

  const playerName = useMemo(
    () => detectPlayerNameInNote(value, game.players),
    [value, game.players],
  );

  return (
    <View style={styles.box}>
      <View style={styles.inputRow}>
        <NoteAutocompleteInput
          accessibilityLabel="Lesson from this game"
          day={game.activeDay}
          game={game}
          onChangeText={onChangeText}
          phase={game.activePhase ?? 'day'}
          placeholder="What will you take away from this game?"
          placeholderTextColor={colors.inputPlaceholder}
          style={styles.input}
          value={value}
        />
        <Pressable
          accessibilityLabel="Remove lesson"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onRemove}
          style={styles.remove}
        >
          <X color={colors.textMuted} size={16} strokeWidth={2.5} />
        </Pressable>
      </View>
      {playerName ? (
        <View style={styles.tagRow}>
          <Text style={styles.savedFor}>
            {tagPlayer ? `Tagged: ${playerName}` : `Not tagged: only about the characters`}
          </Text>
          <Switch
            accessibilityLabel={`Tag ${playerName} in this lesson`}
            accessibilityRole="switch"
            accessibilityState={{ checked: tagPlayer }}
            onValueChange={onTagPlayerChange}
            thumbColor={tagPlayer ? colors.primary : colors.onDisabled}
            trackColor={{ false: colors.disabled, true: colors.borderStrong }}
            value={tagPlayer}
          />
        </View>
      ) : null}
      {namedRoles.length > 0 ? (
        <Text style={styles.savedFor}>
          {`Also saved as a note about ${namedRoles.map((role) => role.name).join(', ')}`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 6,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.inputText,
    flex: 1,
    fontSize: 15,
    maxHeight: 160,
    minHeight: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  remove: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  tagRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  savedFor: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
