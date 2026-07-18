import { Check, Pencil } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { SaveNoteForFutureButton } from '@/components/game/notes-tab/save-note-for-future-button';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { innerActionRow } from '@/components/game/styles';
import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';

export function DayNoteRow({ player, day, text }: { player: Player; day: number; text: string }) {
  const {
    noteDraft,
    noteEditingDay,
    noteEditingPlayerId,
    game,
    setNoteDraft: onChangeNoteDraft,
    handleShowPlayerNoteForDay: onShowNote,
    handleSavePlayerNote: onSaveNote,
  } = useGameRouteContext();

  const isEditing = noteEditingDay === day && noteEditingPlayerId === player.id;
  const reusableNoteText = isEditing ? noteDraft : text;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <PlayerNameWithRole player={player} textStyle={styles.rowPlayerName} />
        <Pressable
          accessibilityLabel={`Edit day ${day} note for ${player.name}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onShowNote(player.id, day)}
          style={styles.editIcon}
        >
          <Pencil color={colors.textMuted} size={14} strokeWidth={2.5} />
        </Pressable>
        <SaveNoteForFutureButton
          day={day}
          disabled={!reusableNoteText.trim()}
          playerId={player.id}
          playerName={player.name}
          text={reusableNoteText}
        />
      </View>
      {isEditing ? (
        <View style={innerActionRow}>
          <TextInput
            accessibilityLabel={`Day ${day} note for ${player.name}`}
            multiline
            onChangeText={onChangeNoteDraft}
            placeholder={`What did ${player.name} say?`}
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.noteInput}
            value={noteDraft}
          />
          <Pressable
            accessibilityLabel={`Save day ${day} note for ${player.name}`}
            accessibilityRole="button"
            onPress={onSaveNote}
            style={saveButtonStyle}
          >
            <Check color={colors.inputText} size={18} strokeWidth={2.8} />
          </Pressable>
        </View>
      ) : (
        <RoleReferencedNoteText
          day={day}
          game={game}
          players={game.players}
          roles={game.script?.roles ?? []}
          scriptId={game.script?.id}
          style={styles.noteText}
          text={text}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 4 },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  rowPlayerName: {
    color: colors.inputText,
    fontSize: 14,
    fontWeight: '800',
  },
  editIcon: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
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
  noteText: {
    color: colors.noteText,
    fontSize: 14,
    lineHeight: 20,
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
