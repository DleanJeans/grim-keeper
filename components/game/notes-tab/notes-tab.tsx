import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { ClaimedRoleCountRow } from '@/components/game/notes-tab/claimed-role-count-row';
import { DayNoteRow } from '@/components/game/notes-tab/day-note-row';
import { NotesTabScriptPicker } from '@/components/game/notes-tab/notes-tab-script-picker';
import { PlayerNoteSection } from '@/components/game/notes-tab/player-note-section';
import { RoleAssignmentActions } from '@/components/game/notes-tab/role-assignment-actions';
import { SavedFriendCountRow } from '@/components/game/notes-tab/saved-friend-count-row';
import { getNotesForPlayer, useGameStore } from '@/store/game-store';
import { getFriendByName, getFriendSummaries } from '@/utils/friend-utils';
import { getRoleAssignmentForDayOrPrevious, getRolesByIds } from '@/utils/role-utils';

export function NotesTab() {
  const { activeDay, focusedPlayer, game, players, showRoles } = useGameRouteContext();
  const savedNotes = useGameStore((state) => state.savedNotes);
  const appUserName = useGameStore((state) => state.appUserName);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const friends = useMemo(
    () => getFriendSummaries(games, storedFriends, appUserName),
    [appUserName, games, storedFriends],
  );

  if (focusedPlayer) {
    const savedFriendNotes = getNotesForPlayer(savedNotes, focusedPlayer.name);
    const claimedRoleIds = new Set(
      getRoleAssignmentForDayOrPrevious(focusedPlayer.roleAssignments, activeDay, 'claim')
        ?.roleIds ?? [],
    );
    const claimedRoles = game.script ? getRolesByIds([...claimedRoleIds], game.script.roles) : [];
    const claimedRoleCounts = showRoles
      ? claimedRoles
          .map((role) => ({
            count: savedNotes.filter((note) => note.roleIds.includes(role.id)).length,
            role,
          }))
          .filter((entry) => entry.count > 0)
      : [];
    const focusedFriend = getFriendByName(friends, focusedPlayer.name);

    return (
      <View style={styles.focusedContainer}>
        <NotesTabScriptPicker />
        <RoleAssignmentActions />
        <PlayerNoteSection player={focusedPlayer} />
        {claimedRoleCounts.map(({ count, role }) => (
          <ClaimedRoleCountRow count={count} key={role.id} role={role} scriptId={game.script?.id} />
        ))}
        {savedFriendNotes.length > 0 && focusedFriend ? (
          <SavedFriendCountRow
            count={savedFriendNotes.length}
            friendId={focusedFriend.id}
            playerName={focusedPlayer.name}
          />
        ) : null}
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
