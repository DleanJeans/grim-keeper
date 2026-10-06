import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { ClaimedRoleNotesLink } from '@/components/game/notes-tab/claimed-role-notes-link';
import { DayNoteRow } from '@/components/game/notes-tab/day-note-row';
import { NotesTabScriptPicker } from '@/components/game/notes-tab/notes-tab-script-picker';
import { PlayerNoteSection } from '@/components/game/notes-tab/player-note-section';
import { RoleAssignmentActions } from '@/components/game/notes-tab/role-assignment-actions';
import { RoleInfoTable } from '@/components/game/notes-tab/role-info/role-info-table';
import { SavedFriendNotesLink } from '@/components/game/notes-tab/saved-friend-notes-link';
import { Text } from '@/components/text';
import { getNotesForPlayer, useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getFriendByName, getFriendSummaries } from '@/utils/friend-utils';
import { getPhaseLabel } from '@/utils/game-phase-utils';
import { getRoleAssignmentForDayOrPrevious, getRolesByIds } from '@/utils/role-utils';

export function NotesTab() {
  const { activeDay, activePhase, focusedPlayer, game, players, showRoles, startingNight } =
    useGameRouteContext();
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
      getRoleAssignmentForDayOrPrevious(
        focusedPlayer.roleAssignments,
        activeDay,
        'claim',
        activePhase,
      )?.roleIds ?? [],
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
          <ClaimedRoleNotesLink
            count={count}
            key={role.id}
            role={role}
            scriptId={game.script?.id}
          />
        ))}
        {savedFriendNotes.length > 0 && focusedFriend ? (
          <SavedFriendNotesLink
            count={savedFriendNotes.length}
            friendId={focusedFriend.id}
            playerName={focusedPlayer.name}
          />
        ) : null}
      </View>
    );
  }

  const dayNotes = (game.playerDayNotes ?? [])
    .filter((entry) => entry.day === activeDay && (entry.phase ?? 'day') === activePhase)
    .slice()
    .sort((a, b) => a.playerId.localeCompare(b.playerId));

  if (dayNotes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <NotesTabScriptPicker />
        <RoleAssignmentActions />
        <Text style={styles.phaseHeader}>
          {getPhaseLabel({ activeDay, activePhase }, startingNight)}
        </Text>
        <RoleInfoTable />
      </View>
    );
  }

  const playerById = new Map(players.map((p) => [p.id, p]));

  return (
    <View style={styles.container}>
      <NotesTabScriptPicker />
      <RoleAssignmentActions />
      <Text style={styles.phaseHeader}>
        {getPhaseLabel({ activeDay, activePhase }, startingNight)}
      </Text>
      {dayNotes.map((entry) => {
        const player = playerById.get(entry.playerId);
        if (!player) {
          return null;
        }
        return (
          <DayNoteRow
            day={activeDay}
            key={entry.playerId}
            notes={entry.notes}
            phase={activePhase}
            player={player}
          />
        );
      })}
      <RoleInfoTable />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  emptyContainer: { gap: 10 },
  focusedContainer: { gap: 14 },
  phaseHeader: {
    color: colors.noteDayHeader,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
