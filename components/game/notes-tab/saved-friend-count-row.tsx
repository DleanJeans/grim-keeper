import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type SavedFriendCountRowProps = {
  count: number;
  friendId: string;
  playerName: string;
};

export function SavedFriendCountRow({ count, friendId, playerName }: SavedFriendCountRowProps) {
  return (
    <Pressable
      accessibilityHint="Opens this friend's details"
      accessibilityLabel={`${count} saved ${count === 1 ? 'note' : 'notes'} for ${playerName}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/friends/[id]', params: { id: friendId } })}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.65 : 1 }]}
    >
      <Text selectable style={styles.label}>
        {count} {count === 1 ? 'note' : 'notes'} for {playerName}
      </Text>
      <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '700' },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
