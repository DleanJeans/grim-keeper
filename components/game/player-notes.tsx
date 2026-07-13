import { Check, MessageCircle } from 'lucide-react-native';
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

const noteDayHeaderStyle = {
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: '800' as const,
  letterSpacing: 0.5,
  textTransform: 'uppercase' as const,
};

export function PlayerNotes() {
  const {
    activeDay,
    focusedPlayer,
    game,
    noteDraft,
    noteEditorVisible,
    focusedPlayerNote: note,
    setNoteDraft: onChangeNoteDraft,
    handleSaveFocusedPlayerNote: onSaveNote,
    handleShowFocusedPlayerNote: onShowNote,
  } = useGameRouteContext();

  if (!focusedPlayer) {
    return null;
  }

  const playerNotes = (game.playerDayNotes ?? [])
    .filter((entry) => entry.playerId === focusedPlayer.id)
    .slice()
    .sort((a, b) => b.day - a.day);

  return (
    <View style={{ alignSelf: 'stretch', gap: 10 }}>
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
        ) : null}

        {playerNotes.length > 0 ? (
          <View style={{ gap: 6 }}>
            {playerNotes.map((entry) => (
              <View key={entry.day} style={{ gap: 4 }}>
                <Text style={noteDayHeaderStyle}>Day {entry.day}</Text>
                <Text selectable style={noteTextStyle}>
                  {entry.text}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
