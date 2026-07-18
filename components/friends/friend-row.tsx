import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';

type FriendRowProps = {
  friend: FriendSummary;
};

export function FriendRow({ friend }: FriendRowProps) {
  const gamesLabel = `${friend.gamesPlayed} ${friend.gamesPlayed === 1 ? 'game' : 'games'}`;
  const notesCount = friend.notes?.length ?? 0;
  const notesLabel = notesCount > 0 ? `${notesCount} ${notesCount === 1 ? 'note' : 'notes'}` : null;
  const stats = notesLabel ? `${gamesLabel} · ${notesLabel}` : gamesLabel;
  const summary = stats.replace('·', ',');

  return (
    <Pressable
      accessibilityHint="Opens this friend's details"
      accessibilityLabel={`${friend.name}, ${summary}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/friends/[id]', params: { id: friend.id } })}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 12,
        minHeight: 58,
        opacity: pressed ? 0.65 : 1,
        padding: 16,
      })}
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
            {stats}
          </Text>
          <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
}
