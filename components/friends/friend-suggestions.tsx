import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';

type FriendSuggestionsProps = {
  friends: FriendSummary[];
  onSelectFriend: (name: string) => void;
};

export function FriendSuggestions({ friends, onSelectFriend }: FriendSuggestionsProps) {
  if (friends.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {friends.map((friend) => (
        <Pressable
          accessibilityRole="button"
          key={friend.id}
          onPress={() => onSelectFriend(friend.name)}
          style={({ pressed }) => [styles.friend, pressed ? styles.friendPressed : null]}
        >
          <Text style={styles.friendName}>{friend.name}</Text>
          <Text style={styles.gamesPlayed}>{friend.gamesPlayed}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  friend: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  friendName: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  friendPressed: {
    backgroundColor: colors.surfacePressed,
  },
  gamesPlayed: {
    color: colors.textMuted,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
