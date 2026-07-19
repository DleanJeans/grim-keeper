import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { PlayerDayNoteEditor } from '@/components/game/notes-tab/player-day-note-editor';
import { PlayerNoteRoleAssignment } from '@/components/game/notes-tab/player-notes';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { RoleReferenceNoteLine } from '@/components/role-reference-note-line';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, PlayerDayNoteEntry } from '@/types/game';
import {
  getRoleAssignmentForDay,
  getRolesByIds,
  getRumorAboutPlayerForDay,
} from '@/utils/role-utils';

export function DayNoteRow({
  player,
  day,
  notes,
}: {
  player: Player;
  day: number;
  notes: PlayerDayNoteEntry[];
}) {
  const {
    addingNewNote,
    noteEditingNoteId,
    noteEditorDay,
    noteEditorPlayerId,
    game,
    showRoles,
    handleStartAddNote: onAddNote,
    handleStartEditNote: onEditNote,
  } = useGameRouteContext();

  const isEditingRow = noteEditorDay === day && noteEditorPlayerId === player.id;
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

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <PlayerNameWithRole player={player} textStyle={styles.rowPlayerName} />
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
            source={rumor.sourcePlayer}
            subject={player}
          />
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
  rowPlayerName: {
    color: colors.inputText,
    fontSize: 14,
    fontWeight: '800',
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
  noteLines: {
    borderLeftColor: colors.border,
    borderLeftWidth: 2,
    gap: 4,
    marginLeft: 4,
    paddingLeft: 10,
  },
});
