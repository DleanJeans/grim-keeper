import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { FriendNotes } from '@/components/friends/friend-row';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getFriendSummaries } from '@/utils/friend-utils';

export default function FriendDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appUserName = useGameStore((state) => state.appUserName);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const friend = useMemo(
    () =>
      getFriendSummaries(games, storedFriends, appUserName).find(
        (candidate) => candidate.id === id,
      ),
    [appUserName, games, id, storedFriends],
  );

  if (!friend) {
    return (
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 }}>
        <Stack.Screen options={{ title: 'Friend not found' }} />
        <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
          Friend not found.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: friend.name }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
        style={{ backgroundColor: colors.background, flex: 1 }}
      >
        <View style={{ gap: 4 }}>
          <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>
            {friend.name}
          </Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 14 }}>
            {friend.gamesPlayed} {friend.gamesPlayed === 1 ? 'game played' : 'games played'}
          </Text>
        </View>

        {friend.notes?.length ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 8,
              borderWidth: 1,
              padding: 16,
            }}
          >
            <FriendNotes friendId={friend.id} notes={friend.notes} />
          </View>
        ) : (
          <Text selectable style={{ color: colors.textMuted, fontSize: 15 }}>
            No saved notes yet.
          </Text>
        )}
      </ScrollView>
    </>
  );
}
