import { Dices } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type RollButtonProps = {
  disabled?: boolean;
  label?: string;
  onPress: () => void;
};

/** Gold dice button that rolls (or rolls again) in the dice drawer. */
export function RollButton({ disabled = false, label = 'Roll', onPress }: RollButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      <Dices color={colors.randomOnAccent} size={16} strokeWidth={2.4} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.randomAccent,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 5,
    height: 32,
    paddingHorizontal: 10,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: { opacity: 0.75 },
  label: { color: colors.randomOnAccent, fontSize: 12.5, fontWeight: '900' },
});
