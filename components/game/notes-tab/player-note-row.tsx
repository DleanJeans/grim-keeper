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
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Conversation, GamePhase, Player, PlayerDayNoteEntry, Role } from '@/types/game';
import { getDeathPhase, getPhaseLabel } from '@/utils/game-phase-utils';
import {
  getRoleAssignmentForDay,
  getRolesByIds,
  getRumorAboutPlayerForDay,
} from '@/utils/role-utils';

const emptyNominationActivity = {
  bigWigPlayerIds: [],
  nomineeIds: [],
  nominatorIds: [],
  votedForIds: [],
};

export function PlayerNoteRow({
  player,
  day,
  phase,
  notes = [],
}: {
  player: Player;
  day: number;
  phase: GamePhase;
  notes?: PlayerDayNoteEntry[];
}) {
  const {
    addingNewNote,
    activeDay,
    activePhase,
    noteEditingNoteId,
    noteEditorDay,
    noteEditorPhase,
    noteEditorPlayerId,
    game,
    startingNight,
    showRoles,
    handleDeleteRumor: onDeleteRumor,
    handleStartAddNote: onAddNote,
    handleStartEditNote: onEditNote,
  } = useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);

  const isEditingRow =
    noteEditorDay === day && noteEditorPhase === phase && noteEditorPlayerId === player.id;
  const isActivePhase = day === activeDay && phase === activePhase;
  const roleAssignment = showRoles
    ? getRoleAssignmentForDay(player.roleAssignments, day, undefined, phase)
    : undefined;
  const roles =
    roleAssignment && game.script ? getRolesByIds(roleAssignment.roleIds, game.script.roles) : [];
  const guessAssignment = showRoles
    ? getRoleAssignmentForDay(player.roleAssignments, day, 'guess', phase)
    : undefined;
  const guessedRoles =
    guessAssignment && game.script ? getRolesByIds(guessAssignment.roleIds, game.script.roles) : [];
  const rumorAboutThisPlayer =
    showRoles && game.script
      ? getRumorAboutPlayerForDay(game.players, player.id, day, game.script.roles, phase)
      : [];
  const ownRumor =
    showRoles && game.script && player.roleAssignments
      ? player.roleAssignments.filter(
          (assignment) =>
            assignment.kind === 'rumor' &&
            assignment.day === day &&
            (assignment.phase ?? 'day') === phase,
        )
      : [];
  const playersById = new Map(game.players.map((candidate) => [candidate.id, candidate]));
  const dayHeaderStyle = isActivePhase ? styles.noteDayHeaderActive : styles.noteDayHeader;
  const activityLines = getPlayerActivityLines(
    player,
    day,
    phase,
    game.players,
    game.conversations,
    getRolesByIds(game.lorics ?? [], roleCatalog),
  );

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={dayHeaderStyle}>
          {getPhaseLabel({ activeDay: day, activePhase: phase }, startingNight)}
        </Text>
        <Pressable
          accessibilityLabel={`Add ${getPhaseLabel({ activeDay: day, activePhase: phase }, startingNight)} note for ${player.name}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onAddNote(player.id, day, phase)}
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

        {guessedRoles.length > 0 ? (
          <PlayerNoteRoleAssignment kind="guess" roles={guessedRoles} scriptId={game.script?.id} />
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
              phase={phase}
              kind="rumor"
              key={`own-rumor-${rumor.subjectPlayerId}-${day}-${phase}`}
              roles={rumorRoles}
              scriptId={game.script?.id}
              onDelete={() => onDeleteRumor(player.id, day, phase)}
              source={player}
              subject={subject}
            />
          );
        })}

        {rumorAboutThisPlayer.map((rumor) => (
          <PlayerNoteRoleAssignment
            day={day}
            phase={phase}
            kind="rumor"
            key={`rumor-${rumor.sourcePlayer.id}-${day}-${phase}`}
            roles={rumor.roles}
            scriptId={game.script?.id}
            onDelete={() => onDeleteRumor(rumor.sourcePlayer.id, day, phase)}
            showSource
            source={rumor.sourcePlayer}
            subject={player}
          />
        ))}

        {activityLines.map((activity) => (
          <PlayerActivityRow activity={activity} day={day} key={activity.kind} phase={phase} />
        ))}

        {notes.map((note) =>
          isEditingRow && noteEditingNoteId === note.id ? (
            <PlayerDayNoteEditor day={day} phase={phase} key={note.id} player={player} />
          ) : (
            <RoleReferenceNoteLine
              day={day}
              phase={phase}
              game={game}
              key={note.id}
              onEdit={() => onEditNote(player.id, day, note.id, phase)}
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
        {isEditingRow && addingNewNote ? (
          <PlayerDayNoteEditor day={day} phase={phase} player={player} />
        ) : null}
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
  phase: GamePhase,
  players: Player[],
  conversations: Conversation[],
  lorics: Role[],
) {
  const playersById = new Map(players.map((candidate) => [candidate.id, candidate]));
  const death =
    player.death?.day === day && getDeathPhase(player.death) === phase ? player.death : undefined;
  const killerIds = death
    ? (death.killerPlayerIds ?? (death.killerPlayerId ? [death.killerPlayerId] : []))
    : [];
  const nominationActivity =
    phase === 'day'
      ? getNominationActivity(player.id, day, conversations)
      : emptyNominationActivity;
  const bigWig = lorics.find((role) => role.id === 'bigwig');

  return [
    formatActivity(
      death?.kind === 'execution' ? 'death-execution' : 'death-night',
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
