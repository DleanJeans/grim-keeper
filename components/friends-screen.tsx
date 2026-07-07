import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { FriendNameForm } from '@/components/friend-name-form';
import { FriendRow } from '@/components/friend-row';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getFriendSummaries } from '@/utils/friend-utils';

export function FriendsScreen() {
  const appUserName = useGameStore((state) => state.appUserName);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const addFriend = useGameStore((state) => state.addFriend);
  const friends = useMemo(
    () => getFriendSummaries(games, storedFriends, appUserName),
    [appUserName, games, storedFriends],
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background, flex: 1 }}
      contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
    >
      <FriendNameForm friends={friends} onAddFriend={addFriend} />

      <View style={{ gap: 10 }}>
        <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
          Friends
        </Text>

        {friends.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 8,
              borderWidth: 1,
              padding: 16,
            }}
          >
            <Text selectable style={{ color: colors.textMuted, fontSize: 16, lineHeight: 22 }}>
              No friends yet.
            </Text>
          </View>
        ) : (
          friends.map((friend) => <FriendRow friend={friend} key={friend.id} />)
        )}
      </View>
    </ScrollView>
  );
}
