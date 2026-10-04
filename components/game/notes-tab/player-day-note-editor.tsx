import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { NoteAutocompleteInput } from '@/components/game/notes-tab/note-autocomplete-input';
import { innerActionRow } from '@/components/game/styles';
import { colors } from '@/theme/colors';
import type { GamePhase, Player } from '@/types/game';
import { getPhaseLabel } from '@/utils/game-phase-utils';

export function PlayerDayNoteEditor({
  day,
  phase,
  player,
}: {
  day: number;
  phase: GamePhase;
  player: Player;
}) {
  const { game, handleSaveNoteEdit, noteDraft, setNoteDraft, startingNight } =
    useGameRouteContext();
  const phaseLabel = getPhaseLabel({ activeDay: day, activePhase: phase }, startingNight);

  return (
    <View style={innerActionRow}>
      <NoteAutocompleteInput
        accessibilityLabel={`${phaseLabel} note for ${player.name}`}
        day={day}
        phase={phase}
        game={game}
        onChangeText={setNoteDraft}
        placeholder={`What happened during ${phaseLabel}?`}
        placeholderTextColor={colors.inputPlaceholder}
        style={styles.noteInput}
        value={noteDraft}
      />
      <Pressable
        accessibilityLabel={`Save ${phaseLabel} note for ${player.name}`}
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
