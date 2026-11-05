import { Stack } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FriendMonthFilter } from '@/components/friends/friend-month-filter';
import { FriendRow } from '@/components/friends/friend-row';
import { FriendSortControls } from '@/components/friends/friend-sort-controls';
import { ResponsiveContent } from '@/components/responsive-content';
import { SearchBox } from '@/components/search-box';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import {
  applyTeamFilter,
  DEFAULT_MIN_RATED_GAMES,
  type FriendSort,
  getFriendSummaries,
  hasFriendName,
  rankFriendsByWinRate,
  sortFriendSummaries,
} from '@/utils/friend-utils';
import { getGameMonthKey, getGameMonthKeys, type TeamFilter } from '@/utils/game-utils';
import { APP_USER_ID } from '@/utils/object-id';

type FriendListEmptyStateProps = {
  message: string;
};

type AddFriendRowProps = {
  name: string;
  onAdd: () => void;
};

export default function FriendsRoute() {
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState<FriendSort>('games');
  const [team, setTeam] = useState<TeamFilter>('all');
  const [minGames, setMinGames] = useState(DEFAULT_MIN_RATED_GAMES);
  const appUserName = useGameStore((state) => state.appUserName);
  const allGames = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const addFriend = useGameStore((state) => state.addFriend);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const minGamesBeforeMonth = useRef(DEFAULT_MIN_RATED_GAMES);
  const months = useMemo(() => getGameMonthKeys(allGames), [allGames]);
  const games = useMemo(
    () =>
      selectedMonths.length > 0
        ? allGames.filter((game) => selectedMonths.includes(getGameMonthKey(game)))
        : allGames,
    [allGames, selectedMonths],
  );
  const allFriends = useMemo(
    () => getFriendSummaries(allGames, storedFriends, appUserName),
    [allGames, appUserName, storedFriends],
  );
  const friends = useMemo(
    () =>
      selectedMonths.length > 0
        ? getFriendSummaries(games, storedFriends, appUserName)
        : allFriends,
    [allFriends, appUserName, games, selectedMonths.length, storedFriends],
  );
  const sortedFriends = useMemo(() => {
    const teamFriends = applyTeamFilter(friends, games, team);
    // Your own row joins the ranking, so you can see where you stand. Team filters compare a
    // friend with you, so they leave your row out.
    const you: FriendSummary | null =
      team === 'all' && allFriends.length > 0 && games.length > 0
        ? {
            createdAt: '',
            gamesPlayed: games.length,
            gamesStorytold: 0,
            id: APP_USER_ID,
            name: normalizePlayerName(appUserName) || 'You',
          }
        : null;
    const ranked = you ? [...teamFriends, you] : teamFriends;

    if (sort === 'games') {
      // A month leaves out friends you didn't play with in it.
      const played =
        selectedMonths.length > 0 ? ranked.filter((friend) => friend.gamesPlayed > 0) : ranked;
      return { friends: sortFriendSummaries(played, savedNotes), hiddenCount: 0 };
    }

    const result = rankFriendsByWinRate(ranked, games, sort, minGames, team);
    const youHidden = !!you && you.gamesPlayed < Math.max(1, minGames);
    return { ...result, hiddenCount: result.hiddenCount - (youHidden ? 1 : 0) };
  }, [
    allFriends.length,
    appUserName,
    friends,
    games,
    minGames,
    savedNotes,
    selectedMonths.length,
    sort,
    team,
  ]);
  const visibleFriends = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLocaleLowerCase();
    return normalizedSearchText
      ? sortedFriends.friends.filter((friend) =>
          friend.name.toLocaleLowerCase().includes(normalizedSearchText),
        )
      : sortedFriends.friends;
  }, [sortedFriends, searchText]);
  const rankById = useMemo(
    () => new Map(sortedFriends.friends.map((friend, index) => [friend.id, index + 1])),
    [sortedFriends],
  );
  const newFriendName = normalizePlayerName(searchText);
  const canAddFriend = newFriendName.length > 0 && !hasFriendName(allFriends, newFriendName);
  const hiddenLabel = `${sortedFriends.hiddenCount} ${
    sortedFriends.hiddenCount === 1 ? 'friend' : 'friends'
  } with fewer than ${minGames} ${minGames === 1 ? 'game' : 'games'} hidden.`;

  // Comparing months leaves few games per friend, so picking a month lowers the minimum to 1 and
  // going back to all time restores the value it had.
  function handleChangeMonths(next: string[]) {
    if (next.length > 0 && selectedMonths.length === 0) {
      minGamesBeforeMonth.current = minGames;
      setMinGames(1);
    } else if (next.length === 0 && selectedMonths.length > 0) {
      setMinGames(minGamesBeforeMonth.current);
    }

    setSelectedMonths(next);
  }

  function handleAddFriend() {
    if (!canAddFriend) {
      return;
    }

    addFriend(newFriendName);
    setSearchText('');
  }

  return (
    <>
      <Stack.Screen options={{ header: () => <TitleHeader title="Friends" />, title: 'Friends' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <ResponsiveContent style={styles.contentContainer}>
          <SearchBox
            label="Search or add a friend"
            onChangeText={setSearchText}
            onSubmit={handleAddFriend}
            value={searchText}
          />
          {canAddFriend ? <AddFriendRow name={newFriendName} onAdd={handleAddFriend} /> : null}
          {allFriends.length > 0 ? (
            <FriendMonthFilter
              months={months}
              onChangeMonths={handleChangeMonths}
              selectedMonths={selectedMonths}
            />
          ) : null}
          {allFriends.length > 0 ? (
            <FriendSortControls
              minGames={minGames}
              onChangeMinGames={setMinGames}
              onChangeSort={setSort}
              onChangeTeam={setTeam}
              sort={sort}
              team={team}
            />
          ) : null}

          <View style={styles.friendList}>
            {allFriends.length === 0 ? (
              canAddFriend ? null : (
                <FriendListEmptyState message="No friends yet. Type a name above to add one." />
              )
            ) : visibleFriends.length === 0 ? (
              canAddFriend ? null : (
                <FriendListEmptyState
                  message={
                    sortedFriends.friends.length === 0
                      ? 'No friends have a rate for this view yet.'
                      : 'No friends match your search.'
                  }
                />
              )
            ) : (
              visibleFriends.map((friend) => (
                <FriendRow
                  friend={friend}
                  games={games}
                  isYou={friend.id === APP_USER_ID}
                  key={friend.id}
                  rank={rankById.get(friend.id)}
                  team={team}
                />
              ))
            )}
            {sortedFriends.hiddenCount > 0 && sortedFriends.friends.length > 0 ? (
              <Text selectable style={styles.hiddenText}>
                {hiddenLabel}
              </Text>
            ) : null}
          </View>
        </ResponsiveContent>
      </ScrollView>
    </>
  );
}

function AddFriendRow({ name, onAdd }: AddFriendRowProps) {
  return (
    <Pressable
      accessibilityLabel={`Add ${name} as a new friend`}
      accessibilityRole="button"
      onPress={onAdd}
      style={({ pressed }) => [styles.addRow, pressed && styles.addRowPressed]}
    >
      <View style={styles.addBadge}>
        <Plus color={colors.onPrimary} size={16} strokeWidth={2.8} />
        <Text style={styles.addBadgeText}>Add</Text>
      </View>
      <Text numberOfLines={1} style={styles.addText}>
        Add <Text style={styles.addName}>{name}</Text> as a new friend
      </Text>
    </Pressable>
  );
}

function FriendListEmptyState({ message }: FriendListEmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text selectable style={styles.emptyStateText}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  addBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addBadgeText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  addName: {
    fontWeight: '800',
  },
  addRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 50,
    paddingHorizontal: 12,
  },
  addRowPressed: {
    backgroundColor: colors.surfacePressed,
  },
  addText: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
  },
  scrollView: {
    backgroundColor: colors.background,
    flex: 1,
  },
  contentContainer: {
    gap: 14,
    padding: 20,
    paddingBottom: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  friendList: {
    gap: 10,
  },
  hiddenText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },
});
