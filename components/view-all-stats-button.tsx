import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type ViewAllStatsButtonProps = {
  friendId?: string;
};

export function ViewAllStatsButton({ friendId }: ViewAllStatsButtonProps) {
  return (
    <Pressable
      accessibilityHint="Opens full character stats"
      accessibilityLabel="View all stats"
      accessibilityRole="button"
      hitSlop={8}
      onPress={() =>
        router.push(friendId ? { pathname: '/stats', params: { friendId } } : '/stats')
      }
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>View all</Text>
      <ChevronRight color={colors.textMuted} size={16} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.65,
  },
});
