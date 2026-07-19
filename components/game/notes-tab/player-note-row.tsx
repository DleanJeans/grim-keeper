import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import {
  type PlayerActivity,
  PlayerActivityRow,
} from '@/components/game/notes-tab/player-activity-row';
import { PlayerDayNoteEditor } from '@/components/game/notes-tab/player-day-note-editor';
import { PlayerNoteRoleAssignment } from '@/components/game/notes-tab/player-notes';
import { RoleReferenceNoteLine } from '@/components/role-reference-note-line';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Conversation, Player, PlayerDayNoteEntry, Role } from '@/types/game';
import {
  getRoleAssignmentForDay,
  getRolesByIds,
  getRumorAboutPlayerForDay,
} from '@/utils/role-utils';

export function PlayerNoteRow({
  player,
  day,
  notes = [],
}: {
  player: Player;
  day: number;
  notes?: PlayerDayNoteEntry[];
}) {
  const {
    addingNewNote,
    activeDay,
    noteEditingNoteId,
    noteEditorDay,
    noteEditorPlayerId,
    game,
    showRoles,
    handleStartAddNote: onAddNote,
    handleStartEditNote: onEditNote,
  } = useGameRouteContext();

  const isEditingRow = noteEditorDay === day && noteEditorPlayerId === player.id;
  const isActiveDay = day === activeDay;
  const roleAssignment = showRoles
    ? getRoleAssignmentForDay(player.roleAssignments, day)
    : undefined;
  const roles =
    roleAssignment && game.script ? getRolesByIds(roleAssignment.roleIds, game.script.roles) : [];
  const rumorAboutThisPlayer =
    showRoles && game.script
      ? getRumorAboutPlayerForDay(game.players, player.id, day, game.script.roles)
      : [];
  const ownRumor =
    showRoles && game.script && player.roleAssignments
      ? player.roleAssignments.filter(
          (assignment) => assignment.kind === 'rumor' && assignment.day === day,
        )
      : [];
  const playersById = new Map(game.players.map((candidate) => [candidate.id, candidate]));
  const dayHeaderStyle = isActiveDay ? styles.noteDayHeaderActive : styles.noteDayHeader;
  const activityLines = getPlayerActivityLines(
    player,
    day,
    game.players,
    game.conversations,
    game.lorics ?? [],
  );

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={dayHeaderStyle}>Day {day}</Text>
        <Pressable
          accessibilityLabel={`Add day ${day} note for ${player.name}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onAddNote(player.id, day)}
          style={styles.addNoteButton}
        >
          <Plus color={colors.textMuted} size={14} strokeWidth={2.5} />
          <Text style={styles.addNoteLabel}>Add new note</Text>
        </Pressable>
      </View>

      <View style={styles.noteLines}>
        {roleAssignment && roleAssignment.kind !== 'rumor' && roles.length > 0 ? (
          <PlayerNoteRoleAssignment
            kind={roleAssignment.kind}
            roles={roles}
            scriptId={game.script?.id}
          />
        ) : null}

        {ownRumor.map((rumor) => {
          const subject = rumor.subjectPlayerId
            ? playersById.get(rumor.subjectPlayerId)
            : undefined;
          if (!subject) {
            return null;
          }
          const rumorRoles = getRolesByIds(rumor.roleIds, game.script?.roles ?? []);
          if (rumorRoles.length === 0) {
            return null;
          }
          return (
            <PlayerNoteRoleAssignment
              day={day}
              kind="rumor"
              key={`own-rumor-${rumor.subjectPlayerId}-${day}`}
              roles={rumorRoles}
              scriptId={game.script?.id}
              source={player}
              subject={subject}
            />
          );
        })}

        {rumorAboutThisPlayer.map((rumor) => (
          <PlayerNoteRoleAssignment
            day={day}
            kind="rumor"
            key={`rumor-${rumor.sourcePlayer.id}-${day}`}
            roles={rumor.roles}
            scriptId={game.script?.id}
            showSource
            source={rumor.sourcePlayer}
            subject={player}
          />
        ))}

        {activityLines.map((activity) => (
          <PlayerActivityRow activity={activity} day={day} key={activity.kind} />
        ))}

        {notes.map((note) =>
          isEditingRow && noteEditingNoteId === note.id ? (
            <PlayerDayNoteEditor day={day} key={note.id} player={player} />
          ) : (
            <RoleReferenceNoteLine
              day={day}
              game={game}
              key={note.id}
              onEdit={() => onEditNote(player.id, day, note.id)}
              playerId={player.id}
              playerName={player.name}
              players={game.players}
              roles={game.script?.roles ?? []}
              scriptId={game.script?.id}
              style={styles.noteText}
              text={note.text}
            />
          ),
        )}
        {isEditingRow && addingNewNote ? <PlayerDayNoteEditor day={day} player={player} /> : null}
      </View>
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
  noteLines: {
    borderLeftColor: colors.border,
    borderLeftWidth: 2,
    gap: 4,
    marginLeft: 4,
    paddingLeft: 10,
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
  addNoteButton: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  addNoteLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  noteText: {
    color: colors.noteText,
    fontSize: 14,
    lineHeight: 20,
  },
});

function getPlayerActivityLines(
  player: Player,
  day: number,
  players: Player[],
  conversations: Conversation[],
  lorics: Role[],
) {
  const playersById = new Map(players.map((candidate) => [candidate.id, candidate]));
  const killerIds =
    player.death?.day === day
      ? (player.death.killerPlayerIds ??
        (player.death.killerPlayerId ? [player.death.killerPlayerId] : []))
      : [];
  const nominationActivity = getNominationActivity(player.id, day, conversations);
  const bigWig = lorics.find((role) => role.id === 'bigwig');

  return [
    formatActivity(
      player.death?.kind === 'execution' ? 'death-execution' : 'death-night',
      'Killed',
      'by',
      killerIds,
      playersById,
    ),
    formatActivity('nominator', 'Nominated', undefined, nominationActivity.nomineeIds, playersById),
    formatActivity('nominated', 'Nominated', 'by', nominationActivity.nominatorIds, playersById),
    bigWig
      ? formatActivity(
          'big-wig',
          'Chose',
          undefined,
          nominationActivity.bigWigPlayerIds,
          playersById,
          bigWig,
        )
      : undefined,
    formatActivity('vote', 'Voted', 'for', nominationActivity.votedForIds, playersById),
  ].filter((activity): activity is PlayerActivity => !!activity);
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
    bigWigPlayerIds: nominations
      .filter((nomination) => getNomineeId(nomination) === playerId)
      .flatMap(({ bigWigPlayerId }) => bigWigPlayerId ?? []),
    votedForIds: nominations
      .filter(({ voterIds }) => voterIds?.includes(playerId))
      .flatMap((nomination) => getNomineeId(nomination) ?? []),
  };
}

function formatActivity(
  kind: Exclude<PlayerActivity['kind'], 'rumor'>,
  verb: string,
  preposition: 'by' | 'for' | undefined,
  playerIds: string[],
  playersById: Map<string, Player>,
  role?: Role,
): PlayerActivity | undefined {
  const players = [...new Set(playerIds)].flatMap((playerId) => playersById.get(playerId) ?? []);
  return players.length > 0 ? { kind, players, preposition, role, verb } : undefined;
}
