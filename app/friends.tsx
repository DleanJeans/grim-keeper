import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FriendNameForm } from '@/components/friends/friend-name-form';
import { FriendRow } from '@/components/friends/friend-row';
import { FriendSortControls } from '@/components/friends/friend-sort-controls';
import { ResponsiveContent } from '@/components/responsive-content';
import { SearchBox } from '@/components/search-box';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import {
  DEFAULT_MIN_RATED_GAMES,
  type FriendSort,
  getFriendSummaries,
  rankFriendsByWinRate,
  sortFriendSummaries,
} from '@/utils/friend-utils';

type FriendListEmptyStateProps = {
  message: string;
};

export default function FriendsRoute() {
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState<FriendSort>('games');
  const [minGames, setMinGames] = useState(DEFAULT_MIN_RATED_GAMES);
  const appUserName = useGameStore((state) => state.appUserName);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const addFriend = useGameStore((state) => state.addFriend);
  const friends = useMemo(
    () => sortFriendSummaries(getFriendSummaries(games, storedFriends, appUserName), savedNotes),
    [appUserName, games, savedNotes, storedFriends],
  );
  const sortedFriends = useMemo(
    () =>
      sort === 'games'
        ? { friends, hiddenCount: 0 }
        : rankFriendsByWinRate(friends, games, sort, minGames),
    [friends, games, minGames, sort],
  );
  const visibleFriends = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLocaleLowerCase();
    return normalizedSearchText
      ? sortedFriends.friends.filter((friend) =>
          friend.name.toLocaleLowerCase().includes(normalizedSearchText),
        )
      : sortedFriends.friends;
  }, [sortedFriends, searchText]);
  const hiddenLabel = `${sortedFriends.hiddenCount} ${
    sortedFriends.hiddenCount === 1 ? 'friend' : 'friends'
  } with fewer than ${minGames} ${minGames === 1 ? 'game' : 'games'}${
    sort === 'goodWinRate' ? ' as good' : sort === 'evilWinRate' ? ' as evil' : ''
  } hidden.`;

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
          <FriendNameForm friends={friends} onAddFriend={addFriend} />
          {friends.length > 0 ? (
            <>
              <SearchBox label="Search friends" onChangeText={setSearchText} value={searchText} />
              <FriendSortControls
                minGames={minGames}
                onChangeMinGames={setMinGames}
                onChangeSort={setSort}
                sort={sort}
              />
            </>
          ) : null}

          <View style={styles.friendList}>
            {friends.length === 0 ? (
              <FriendListEmptyState message="No friends yet." />
            ) : visibleFriends.length === 0 ? (
              <FriendListEmptyState
                message={
                  sortedFriends.friends.length === 0
                    ? `No friends have ${minGames} ${minGames === 1 ? 'game' : 'games'} with a result yet.`
                    : 'No friends match your search.'
                }
              />
            ) : (
              visibleFriends.map((friend) => <FriendRow friend={friend} key={friend.id} />)
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
  scrollView: {
    backgroundColor: colors.background,
    flex: 1,
  },
  contentContainer: {
    gap: 18,
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
