import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { ClaimedRoleNotes, collectClaimedRoleNotes } from '@/components/game/notes-tab/claimed-role-notes';
import { DayNoteRow } from '@/components/game/notes-tab/day-note-row';
import { NotesTabScriptPicker } from '@/components/game/notes-tab/notes-tab-script-picker';
import { PlayerNoteSection } from '@/components/game/notes-tab/player-note-section';
import { RoleAssignmentActions } from '@/components/game/notes-tab/role-assignment-actions';
import { SavedFriendNotes } from '@/components/game/notes-tab/saved-friend-notes';
import { useGameStore } from '@/store/game-store';
import { getFriendByName } from '@/utils/friend-utils';
import { getRoleAssignmentForDayOrPrevious, getRolesByIds } from '@/utils/role-utils';

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
      <View style={styles.focusedContainer}>
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
      <View style={styles.emptyContainer}>
        <NotesTabScriptPicker />
        <RoleAssignmentActions />
      </View>
    );
  }

  const playerById = new Map(players.map((p) => [p.id, p]));

  return (
    <View style={styles.container}>
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

const styles = StyleSheet.create({
  container: { gap: 10 },
  emptyContainer: { gap: 10 },
  focusedContainer: { gap: 14 },
});
