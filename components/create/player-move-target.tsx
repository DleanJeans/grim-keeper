import { CornerDownRight } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type PlayerMoveTargetProps = {
  label: string;
  onPress: () => void;
};

/** A gap between two seats that the picked player can move into. */
export function PlayerMoveTarget({ label, onPress }: PlayerMoveTargetProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.target, pressed && styles.targetPressed]}
    >
      <CornerDownRight color={colors.textMuted} size={15} strokeWidth={2.5} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  target: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
  },
  targetPressed: {
    backgroundColor: colors.surfacePressed,
  },
});
