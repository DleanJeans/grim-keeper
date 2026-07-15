import { Check, Pencil } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { PlayerNoteSection } from '@/components/game/player-notes';
import { RoleAssignmentActions } from '@/components/game/role-assignment-actions';
import { innerActionRow } from '@/components/game/styles';
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

const noteRowPlayerNameStyle = {
  color: '#f8fafc',
  fontSize: 14,
  fontWeight: '800' as const,
};

function DayNoteRow({
  player,
  day,
  text,
}: {
  player: { id: string; name: string };
  day: number;
  text: string;
}) {
  const {
    noteDraft,
    noteEditingDay,
    noteEditingPlayerId,
    setNoteDraft: onChangeNoteDraft,
    handleShowPlayerNoteForDay: onShowNote,
    handleSavePlayerNote: onSaveNote,
  } = useGameRouteContext();

  const isEditing = noteEditingDay === day && noteEditingPlayerId === player.id;

  return (
    <View style={{ gap: 4 }}>
      <View style={noteRowHeaderStyle}>
        <Text style={noteRowPlayerNameStyle}>{player.name}</Text>
        <Pressable
          accessibilityLabel={`Edit day ${day} note for ${player.name}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onShowNote(player.id, day)}
          style={noteEditIconStyle}
        >
          <Pencil color={colors.textMuted} size={14} strokeWidth={2.5} />
        </Pressable>
      </View>
      {isEditing ? (
        <View style={innerActionRow}>
          <TextInput
            accessibilityLabel={`Day ${day} note for ${player.name}`}
            multiline
            onChangeText={onChangeNoteDraft}
            placeholder={`What did ${player.name} say?`}
            placeholderTextColor="#64748b"
            style={noteTextInputStyle}
            value={noteDraft}
          />
          <Pressable
            accessibilityLabel={`Save day ${day} note for ${player.name}`}
            accessibilityRole="button"
            onPress={onSaveNote}
            style={noteSaveButtonStyle}
          >
            <Check color="#f8fafc" size={18} strokeWidth={2.8} />
          </Pressable>
        </View>
      ) : (
        <Text selectable style={noteTextStyle}>
          {text}
        </Text>
      )}
    </View>
  );
}

export function NotesTab() {
  const { activeDay, focusedPlayer, game, players } = useGameRouteContext();

  if (focusedPlayer) {
    return (
      <View style={{ gap: 14 }}>
        <RoleAssignmentActions />
        <PlayerNoteSection player={focusedPlayer} />
      </View>
    );
  }

  const dayNotes = (game.playerDayNotes ?? [])
    .filter((entry) => entry.day === activeDay)
    .slice()
    .sort((a, b) => a.playerId.localeCompare(b.playerId));

  if (dayNotes.length === 0) {
    return <RoleAssignmentActions />;
  }

  const playerById = new Map(players.map((p) => [p.id, p]));

  return (
    <View style={{ gap: 10 }}>
      <RoleAssignmentActions />
      {dayNotes.map((entry) => {
        const player = playerById.get(entry.playerId);
        if (!player) {
          return null;
        }
        return (
          <DayNoteRow day={activeDay} key={entry.playerId} player={player} text={entry.text} />
        );
      })}
    </View>
  );
}
