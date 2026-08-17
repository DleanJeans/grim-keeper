import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FriendNameForm } from '@/components/friends/friend-name-form';
import { FriendRow } from '@/components/friends/friend-row';
import { ResponsiveContent } from '@/components/responsive-content';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getFriendSummaries } from '@/utils/friend-utils';

export default function FriendsRoute() {
  const appUserName = useGameStore((state) => state.appUserName);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const addFriend = useGameStore((state) => state.addFriend);
  const friends = useMemo(
    () => getFriendSummaries(games, storedFriends, appUserName),
    [appUserName, games, storedFriends],
  );

  return (
    <>
      <Stack.Screen options={{ header: () => <TitleHeader title="Friends" />, title: 'Friends' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <ResponsiveContent style={styles.contentContainer}>
          <FriendNameForm friends={friends} onAddFriend={addFriend} />

          <View style={styles.friendList}>
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Text selectable style={styles.emptyStateText}>
                  No friends yet.
                </Text>
              </View>
            ) : (
              friends.map((friend) => <FriendRow friend={friend} key={friend.id} />)
            )}
          </View>
        </ResponsiveContent>
      </ScrollView>
    </>
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
