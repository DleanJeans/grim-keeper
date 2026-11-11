import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';
import { APP_USER_ID } from '@/utils/app-user';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { getFriendSummaries } from '@/utils/friend-utils';

type DockPlayerNameProps = {
  player: Player;
};

/** The focused player's name in the dock; opens their friend details when they are a friend. */
export function DockPlayerName({ player }: DockPlayerNameProps) {
  const appUserName = useGameStore((state) => state.appUserName);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const friendId = useMemo(() => {
    if (player.id === APP_USER_ID) {
      return undefined;
    }
    const key = normalizePlayerName(player.name).toLocaleLowerCase();
    if (!key) {
      return undefined;
    }
    // Same ids as the Friends screen, so players only seen in games open too.
    return getFriendSummaries(games, storedFriends, appUserName).find(
      (friend) => friend.name.toLocaleLowerCase() === key,
    )?.id;
  }, [appUserName, games, player.id, player.name, storedFriends]);

  if (!friendId) {
    return (
      <Text numberOfLines={1} style={styles.name}>
        {player.name}
      </Text>
    );
  }

  return (
    <Pressable
      accessibilityHint="Opens this friend's details"
      accessibilityLabel={`${player.name} details`}
      accessibilityRole="link"
      hitSlop={6}
      onPress={() => router.push({ pathname: '/friends/[id]', params: { id: friendId } })}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <Text numberOfLines={1} style={styles.name}>
        {player.name}
      </Text>
      <ChevronRight color={colors.gameTextMuted} size={16} strokeWidth={2.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    flexShrink: 1,
    gap: 2,
    minHeight: 32,
    minWidth: 0,
    paddingRight: 2,
  },
  name: { color: colors.gameText, flexShrink: 1, fontSize: 16, fontWeight: '900' },
  pressed: { backgroundColor: colors.gameSurfacePressed },
});
