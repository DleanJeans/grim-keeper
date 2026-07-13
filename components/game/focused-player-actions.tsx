import { Check, MessageCircle, Trash2 } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { innerActionRow, onDarkTextStrong, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';

const noteTextInputStyle = {
  backgroundColor: '#111827',
  borderColor: '#334155',
  borderRadius: 8,
  borderWidth: 1,
  color: '#f8fafc',
  flex: 1,
  fontSize: 15,
  minHeight: 48,
  paddingHorizontal: 12,
  paddingVertical: 12,
  textAlignVertical: 'top' as const,
};

const noteSaveButtonStyle = ({ pressed }: { pressed: boolean }) => ({
  alignItems: 'center' as const,
  backgroundColor: pressed ? '#15803d' : '#16a34a',
  borderRadius: 8,
  justifyContent: 'center' as const,
  minWidth: 48,
  width: 48,
});

const noteTextStyle = {
  color: '#cbd5e1',
  fontSize: 14,
  lineHeight: 20,
};

export function FocusedPlayerActions() {
  const {
    activeDay,
    focusedPlayer,
    noteDraft,
    noteEditorVisible,
    focusedPlayerNote: note,
    setNoteDraft: onChangeNoteDraft,
    confirmDeletePlayer: onConfirmDeletePlayer,
    handleSaveFocusedPlayerNote: onSaveNote,
    handleShowFocusedPlayerNote: onShowNote,
  } = useGameRouteContext();

  if (!focusedPlayer) {
    return null;
  }

  return (
    <View style={{ alignSelf: 'stretch', gap: 10 }}>
      <View style={innerActionRow}>
        <Pressable
          accessibilityLabel={`Delete ${focusedPlayer.name}`}
          accessibilityRole="button"
          disabled={focusedPlayer.isAppUser}
          onPress={onConfirmDeletePlayer}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: focusedPlayer.isAppUser ? '#1f2937' : pressed ? '#2a1517' : '#111827',
            borderColor: focusedPlayer.isAppUser ? '#334155' : '#fca5a5',
            borderRadius: 8,
            borderWidth: 1,
            justifyContent: 'center',
            minWidth: 48,
            opacity: focusedPlayer.isAppUser ? 0.48 : 1,
            paddingVertical: 14,
          })}
        >
          <Trash2
            color={focusedPlayer.isAppUser ? '#94a3b8' : '#fca5a5'}
            size={17}
            strokeWidth={2.7}
          />
        </Pressable>
      </View>

      <View style={{ gap: 10 }}>
        <Pressable
          accessibilityLabel={`Add day ${activeDay} note for ${focusedPlayer.name}`}
          accessibilityRole="button"
          onPress={onShowNote}
          style={({ pressed }) =>
            outlinedActionStyle({ pressed, borderColor: note ? '#38bdf8' : '#334155' })
          }
        >
          <MessageCircle color="#38bdf8" size={17} strokeWidth={2.7} />
          <Text style={onDarkTextStrong}>{note ? 'Edit Note' : 'Note'}</Text>
        </Pressable>

        {noteEditorVisible ? (
          <View style={innerActionRow}>
            <TextInput
              accessibilityLabel={`Day ${activeDay} note for ${focusedPlayer.name}`}
              multiline
              onChangeText={onChangeNoteDraft}
              placeholder={`What did ${focusedPlayer.name} say?`}
              placeholderTextColor="#64748b"
              style={noteTextInputStyle}
              value={noteDraft}
            />
            <Pressable
              accessibilityLabel={`Save day ${activeDay} note for ${focusedPlayer.name}`}
              accessibilityRole="button"
              onPress={onSaveNote}
              style={noteSaveButtonStyle}
            >
              <Check color="#f8fafc" size={18} strokeWidth={2.8} />
            </Pressable>
          </View>
        ) : note ? (
          <Text selectable style={noteTextStyle}>
            {note.text}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
