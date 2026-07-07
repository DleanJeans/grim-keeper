import { Pressable, View } from 'react-native';

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
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
      }}
    >
      {friends.map((friend) => (
        <Pressable
          accessibilityRole="button"
          key={friend.id}
          onPress={() => onSelectFriend(friend.name)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.surfacePressed : colors.surface,
            flexDirection: 'row',
            gap: 12,
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            paddingVertical: 12,
          })}
        >
          <Text selectable style={{ color: colors.text, flex: 1, fontSize: 16, fontWeight: '700' }}>
            {friend.name}
          </Text>
          <Text
            selectable
            style={{ color: colors.textMuted, fontSize: 13, fontVariant: ['tabular-nums'] }}
          >
            {friend.gamesPlayed}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
