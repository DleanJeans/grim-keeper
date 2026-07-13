import { View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';

type FriendRowProps = {
  friend: FriendSummary;
};

export function FriendRow({ friend }: FriendRowProps) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'space-between',
        minHeight: 58,
        padding: 16,
      }}
    >
      <Text selectable style={{ color: colors.text, flex: 1, fontSize: 17, fontWeight: '800' }}>
        {friend.name}
      </Text>
      <Text
        selectable
        style={{ color: colors.textMuted, fontSize: 14, fontVariant: ['tabular-nums'] }}
      >
        {friend.gamesPlayed} {friend.gamesPlayed === 1 ? 'game' : 'games'}
      </Text>
    </View>
  );
}
