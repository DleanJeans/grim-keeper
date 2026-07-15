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
        gap: 12,
        minHeight: 58,
        padding: 16,
      }}
    >
      <View style={{ gap: 8 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
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
        {friend.notes?.length ? (
          <View style={{ gap: 3 }}>
            <Text
              selectable
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: '900',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Notes
            </Text>
            {friend.notes.map((note) => (
              <Text
                key={`${friend.id}-note-${note}`}
                selectable
                style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}
              >
                {note}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
