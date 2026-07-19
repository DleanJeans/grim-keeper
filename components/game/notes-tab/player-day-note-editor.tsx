import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { NoteAutocompleteInput } from '@/components/game/notes-tab/note-autocomplete-input';
import { innerActionRow } from '@/components/game/styles';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';

export function PlayerDayNoteEditor({ day, player }: { day: number; player: Player }) {
  const { game, handleSaveNoteEdit, noteDraft, setNoteDraft } = useGameRouteContext();

  return (
    <View style={innerActionRow}>
      <NoteAutocompleteInput
        accessibilityLabel={`Day ${day} note for ${player.name}`}
        day={day}
        game={game}
        onChangeText={setNoteDraft}
        placeholder={`What did ${player.name} say?`}
        placeholderTextColor={colors.inputPlaceholder}
        style={styles.noteInput}
        value={noteDraft}
      />
      <Pressable
        accessibilityLabel={`Save day ${day} note for ${player.name}`}
        accessibilityRole="button"
        onPress={handleSaveNoteEdit}
        style={saveButtonStyle}
      >
        <Check color={colors.inputText} size={18} strokeWidth={2.8} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  noteInput: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.inputText,
    flex: 1,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
});

const saveButtonBase = StyleSheet.create({
  saveButton: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 48,
    width: 48,
  },
});

const saveButtonStyle = ({ pressed }: { pressed: boolean }) => ({
  ...saveButtonBase.saveButton,
  backgroundColor: pressed ? colors.saveButtonPressed : colors.saveButton,
});
