import { Check, Pencil } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { ClaimedRoleNotes, collectClaimedRoleNotes } from '@/components/game/notes-tab/claimed-role-notes';
import { NotesTabScriptPicker } from '@/components/game/notes-tab/notes-tab-script-picker';
import { PlayerNoteSection } from '@/components/game/notes-tab/player-note-section';
import { RoleAssignmentActions } from '@/components/game/notes-tab/role-assignment-actions';
import { SaveNoteForFutureButton } from '@/components/game/notes-tab/save-note-for-future-button';
import { SavedFriendNotes } from '@/components/game/notes-tab/saved-friend-notes';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { innerActionRow } from '@/components/game/styles';
import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';
import { getFriendByName } from '@/utils/friend-utils';
import { getRoleAssignmentForDayOrPrevious, getRolesByIds } from '@/utils/role-utils';

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

function DayNoteRow({ player, day, text }: { player: Player; day: number; text: string }) {
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
    <View style={{ gap: 4 }}>
      <View style={noteRowHeaderStyle}>
        <PlayerNameWithRole player={player} textStyle={noteRowPlayerNameStyle} />
        <Pressable
          accessibilityLabel={`Edit day ${day} note for ${player.name}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onShowNote(player.id, day)}
          style={noteEditIconStyle}
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
        <RoleReferencedNoteText
          day={day}
          game={game}
          players={game.players}
          roles={game.script?.roles ?? []}
          scriptId={game.script?.id}
          style={noteTextStyle}
          text={text}
        />
      )}
    </View>
  );
}

export function NotesTab() {
  const { activeDay, focusedPlayer, game, players, showRoles } = useGameRouteContext();
  const friends = useGameStore((state) => state.friends);
  const savedNotes = useGameStore((state) => state.savedNotes);

  if (focusedPlayer) {
    const savedFriendNotes = getFriendByName(friends, focusedPlayer.name)?.notes;
    const claimedRoleIds = new Set(
      getRoleAssignmentForDayOrPrevious(focusedPlayer.roleAssignments, activeDay, 'claim')
        ?.roleIds ?? [],
    );
    const claimedRoles = game.script
      ? getRolesByIds([...claimedRoleIds], game.script.roles)
      : [];
    const claimedRoleNotes = showRoles ? collectClaimedRoleNotes(savedNotes, claimedRoles) : [];

    return (
      <View style={{ gap: 14 }}>
        <NotesTabScriptPicker />
        <RoleAssignmentActions />
        <PlayerNoteSection player={focusedPlayer} />
        {showRoles ? (
          <ClaimedRoleNotes
            day={activeDay}
            game={game}
            notes={claimedRoleNotes}
            players={game.players}
            roles={game.script?.roles ?? []}
            scriptId={game.script?.id}
          />
        ) : null}
        <SavedFriendNotes
          day={activeDay}
          game={game}
          notes={savedFriendNotes}
          playerName={focusedPlayer.name}
          players={game.players}
          roles={game.script?.roles ?? []}
          scriptId={game.script?.id}
        />
      </View>
    );
  }

  const dayNotes = (game.playerDayNotes ?? [])
    .filter((entry) => entry.day === activeDay)
    .slice()
    .sort((a, b) => a.playerId.localeCompare(b.playerId));

  if (dayNotes.length === 0) {
    return (
      <View style={{ gap: 10 }}>
        <NotesTabScriptPicker />
        <RoleAssignmentActions />
      </View>
    );
  }

  const playerById = new Map(players.map((p) => [p.id, p]));

  return (
    <View style={{ gap: 10 }}>
      <NotesTabScriptPicker />
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
