import { Check, Pencil } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { NoteAutocompleteInput } from '@/components/game/notes-tab/note-autocomplete-input';
import { PlayerNoteRoleAssignment } from '@/components/game/notes-tab/player-notes';
import { SaveNoteForFutureButton } from '@/components/game/notes-tab/save-note-for-future-button';
import { innerActionRow } from '@/components/game/styles';
import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Conversation, Player } from '@/types/game';
import { getRoleAssignmentForDay, getRolesByIds } from '@/utils/role-utils';

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
    activeDay,
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
  const isActiveDay = day === activeDay;
  const reusableNoteText = isEditing ? noteDraft : (text ?? '');
  const roleAssignment = showRoles
    ? getRoleAssignmentForDay(player.roleAssignments, day)
    : undefined;
  const roles =
    roleAssignment && game.script ? getRolesByIds(roleAssignment.roleIds, game.script.roles) : [];
  const dayHeaderStyle = isActiveDay ? styles.noteDayHeaderActive : styles.noteDayHeader;
  const activityLines = getPlayerActivityLines(player, day, game.players, game.conversations);

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={dayHeaderStyle}>Day {day}</Text>
        <Pressable
          accessibilityLabel={`Edit day ${day} note for ${player.name}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onShowNote(player.id, day)}
          style={styles.editIcon}
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

      {roleAssignment && roles.length > 0 ? (
        <PlayerNoteRoleAssignment
          kind={roleAssignment.kind}
          roles={roles}
          scriptId={game.script?.id}
        />
      ) : null}

      {activityLines.map((line) => (
        <Text key={line} style={styles.activityText}>
          {line}
        </Text>
      ))}

      {isEditing ? (
        <View style={innerActionRow}>
          <NoteAutocompleteInput
            accessibilityLabel={`Day ${day} note for ${player.name}`}
            day={day}
            game={game}
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
            style={noteSaveButtonStyle}
          >
            <Check color={colors.inputText} size={18} strokeWidth={2.8} />
          </Pressable>
        </View>
      ) : text ? (
        <RoleReferencedNoteText
          day={day}
          game={game}
          players={game.players}
          roles={game.script?.roles ?? []}
          scriptId={game.script?.id}
          style={styles.noteText}
          text={text}
        />
      ) : null}
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
  noteDayHeader: {
    color: colors.noteDayHeader,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  noteDayHeaderActive: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  activityText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});

const noteSaveButtonStatic = StyleSheet.create({
  noteSaveButton: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 48,
    width: 48,
  },
});

const noteSaveButtonStyle = ({ pressed }: { pressed: boolean }) => ({
  ...noteSaveButtonStatic.noteSaveButton,
  backgroundColor: pressed ? colors.saveButtonPressed : colors.saveButton,
});

function getPlayerActivityLines(
  player: Player,
  day: number,
  players: Player[],
  conversations: Conversation[],
) {
  const playerNamesById = new Map(players.map(({ id, name }) => [id, name]));
  const killerIds =
    player.death?.day === day
      ? (player.death.killerPlayerIds ??
        (player.death.killerPlayerId ? [player.death.killerPlayerId] : []))
      : [];
  const nominationActivity = getNominationActivity(player.id, day, conversations);

  return [
    formatActivityLine('Killed by', killerIds, playerNamesById),
    formatActivityLine('Nominated for', nominationActivity.nomineeIds, playerNamesById),
    formatActivityLine('Nominated by', nominationActivity.nominatorIds, playerNamesById),
    formatActivityLine('Voted for', nominationActivity.votedForIds, playerNamesById),
  ].filter((line): line is string => !!line);
}

function getNominationActivity(playerId: string, day: number, conversations: Conversation[]) {
  const nominations = conversations.filter(
    ({ kind, day: nominationDay }) => kind === 'nomination' && nominationDay === day,
  );
  const getNomineeId = (nomination: (typeof nominations)[number]) =>
    nomination.participantIds.find((participantId) => participantId !== nomination.initiatorId);

  return {
    nomineeIds: nominations
      .filter(({ initiatorId }) => initiatorId === playerId)
      .flatMap((nomination) => getNomineeId(nomination) ?? []),
    nominatorIds: nominations
      .filter((nomination) => getNomineeId(nomination) === playerId)
      .map(({ initiatorId }) => initiatorId),
    votedForIds: nominations
      .filter(({ voterIds }) => voterIds?.includes(playerId))
      .flatMap((nomination) => getNomineeId(nomination) ?? []),
  };
}

function formatActivityLine(
  label: string,
  playerIds: string[],
  playerNamesById: Map<string, string>,
) {
  const names = [...new Set(playerIds)].flatMap((playerId) => playerNamesById.get(playerId) ?? []);
  return names.length > 0 ? `${label} ${names.join(', ')}` : undefined;
}
