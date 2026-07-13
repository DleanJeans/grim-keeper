import { Check, MessageCircle, Pencil } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { innerActionRow, onDarkTextStrong, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

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

const noteRowHeaderStyle = {
  alignItems: 'center' as const,
  flexDirection: 'row' as const,
  gap: 6,
};

const noteEditIconStyle = {
  alignItems: 'center' as const,
  borderRadius: 6,
  justifyContent: 'center' as const,
  paddingHorizontal: 6,
  paddingVertical: 4,
};

const noteEmptyBodyStyle = {
  color: '#64748b',
  fontSize: 13,
  fontStyle: 'italic' as const,
  lineHeight: 18,
};

export function PlayerNotes() {
  const {
    activeDay,
    focusedPlayer,
    game,
    lastDayWithData,
    noteDraft,
    noteEditingDay,
    focusedPlayerNote: currentDayNote,
    setNoteDraft: onChangeNoteDraft,
    handleShowPlayerNoteForDay: onShowNote,
    handleSavePlayerNote: onSaveNote,
  } = useGameRouteContext();

  if (!focusedPlayer) {
    return null;
  }

  const lastDay = Math.max(lastDayWithData, activeDay);
  const noteByDay = new Map<number, string>();
  for (const entry of game.playerDayNotes ?? []) {
    if (entry.playerId === focusedPlayer.id) {
      noteByDay.set(entry.day, entry.text);
    }
  }
  const days = Array.from({ length: lastDay }, (_, i) => lastDay - i);

  return (
    <View style={{ alignSelf: 'stretch', gap: 10 }}>
      <View style={{ gap: 10 }}>
        <Pressable
          accessibilityLabel={`Add day ${activeDay} note for ${focusedPlayer.name}`}
          accessibilityRole="button"
          onPress={() => onShowNote(activeDay)}
          style={({ pressed }) =>
            outlinedActionStyle({ pressed, borderColor: currentDayNote ? '#38bdf8' : '#334155' })
          }
        >
          <MessageCircle color="#38bdf8" size={17} strokeWidth={2.7} />
          <Text style={onDarkTextStrong}>{currentDayNote ? 'Edit Note' : 'Note'}</Text>
        </Pressable>

        {lastDay > 0 ? (
          <View style={{ gap: 6 }}>
            {days.map((day) => {
              const text = noteByDay.get(day);
              const isEditing = noteEditingDay === day;
              return (
                <View key={day} style={{ gap: 4 }}>
                  <View style={noteRowHeaderStyle}>
                    <Text style={noteDayHeaderStyle}>Day {day}</Text>
                    <Pressable
                      accessibilityLabel={`Edit day ${day} note for ${focusedPlayer.name}`}
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => onShowNote(day)}
                      style={noteEditIconStyle}
                    >
                      <Pencil color={colors.textMuted} size={14} strokeWidth={2.5} />
                    </Pressable>
                  </View>
                  {isEditing ? (
                    <View style={innerActionRow}>
                      <TextInput
                        accessibilityLabel={`Day ${day} note for ${focusedPlayer.name}`}
                        multiline
                        onChangeText={onChangeNoteDraft}
                        placeholder={`What did ${focusedPlayer.name} say?`}
                        placeholderTextColor="#64748b"
                        style={noteTextInputStyle}
                        value={noteDraft}
                      />
                      <Pressable
                        accessibilityLabel={`Save day ${day} note for ${focusedPlayer.name}`}
                        accessibilityRole="button"
                        onPress={onSaveNote}
                        style={noteSaveButtonStyle}
                      >
                        <Check color="#f8fafc" size={18} strokeWidth={2.8} />
                      </Pressable>
                    </View>
                  ) : text ? (
                    <Text selectable style={noteTextStyle}>
                      {text}
                    </Text>
                  ) : (
                    <Text style={noteEmptyBodyStyle}>No note.</Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}
