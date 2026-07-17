import { Check, Pencil } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { SaveNoteForFutureButton } from '@/components/game/save-note-for-future-button';
import { innerActionRow } from '@/components/game/styles';
import { RoleReference } from '@/components/role-reference';
import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import { getRoleAssignmentForDay, getRolesByIds } from '@/utils/role-utils';

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

export function PlayerNoteRow({
  player,
  day,
  text,
}: {
  player: Player;
  day: number;
  text?: string;
}) {
  const {
    noteDraft,
    noteEditingDay,
    noteEditingPlayerId,
    game,
    showRoles,
    setNoteDraft: onChangeNoteDraft,
    handleShowPlayerNoteForDay: onShowNote,
    handleSavePlayerNote: onSaveNote,
  } = useGameRouteContext();

  const isEditing = noteEditingDay === day && noteEditingPlayerId === player.id;
  const reusableNoteText = isEditing ? noteDraft : (text ?? '');
  const roleAssignment = showRoles
    ? getRoleAssignmentForDay(player.roleAssignments, day)
    : undefined;
  const roles =
    roleAssignment && game.script ? getRolesByIds(roleAssignment.roleIds, game.script.roles) : [];

  return (
    <View style={{ gap: 4 }}>
      <View style={noteRowHeaderStyle}>
        <Text style={noteDayHeaderStyle}>Day {day}</Text>
        <Pressable
          accessibilityLabel={`Edit day ${day} note for ${player.name}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onShowNote(player.id, day)}
          style={noteEditIconStyle}
        >
          <Pencil color={colors.textMuted} size={14} strokeWidth={2.5} />
        </Pressable>
        {reusableNoteText.trim() ? (
          <SaveNoteForFutureButton
            day={day}
            disabled={false}
            playerId={player.id}
            playerName={player.name}
            text={reusableNoteText}
          />
        ) : null}
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
      ) : text ? (
        <RoleReferencedNoteText
          day={day}
          game={game}
          players={game.players}
          roles={game.script?.roles ?? []}
          scriptId={game.script?.id}
          style={noteTextStyle}
          text={text}
        />
      ) : null}
      {roleAssignment && roles.length > 0 ? (
        <PlayerNoteRoleAssignment
          kind={roleAssignment.kind}
          roles={roles}
          scriptId={game.script?.id}
        />
      ) : null}
    </View>
  );
}

function PlayerNoteRoleAssignment({
  kind,
  roles,
  scriptId,
}: {
  kind: 'claim' | 'confirm';
  roles: Role[];
  scriptId?: string;
}) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      <Text
        style={{
          color: kind === 'confirm' ? '#86efac' : '#fcd34d',
          fontSize: 12,
          fontWeight: '900',
        }}
      >
        {kind === 'confirm' ? 'Confirmed' : 'Claimed'}
      </Text>
      {kind === 'confirm' ? <Check color="#86efac" size={14} strokeWidth={3} /> : null}
      {roles.map((role) => (
        <RoleReference
          iconSize={18}
          key={role.id}
          role={role}
          scriptId={scriptId}
          textStyle={{ fontSize: 12 }}
        />
      ))}
    </View>
  );
}

export function PlayerNoteSection({ player }: { player: Player }) {
  const { activeDay, game, lastDayWithData } = useGameRouteContext();

  const lastDay = Math.max(lastDayWithData, activeDay);
  const noteByDay = new Map<number, string>();
  for (const entry of game.playerDayNotes ?? []) {
    if (entry.playerId === player.id) {
      noteByDay.set(entry.day, entry.text);
    }
  }
  const days = Array.from({ length: lastDay }, (_, i) => lastDay - i);

  if (lastDay === 0) {
    return null;
  }

  return (
    <View style={{ gap: 6 }}>
      {days.map((day) => (
        <PlayerNoteRow key={day} day={day} player={player} text={noteByDay.get(day)} />
      ))}
    </View>
  );
}
