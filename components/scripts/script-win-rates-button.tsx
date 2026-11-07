import { Trophy } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';

type ScriptWinRatesButtonProps = {
  onPress: () => void;
};

export function ScriptWinRatesButton({ onPress }: ScriptWinRatesButtonProps) {
  return (
    <Pressable
      accessibilityHint="Shows your and your friends' win rates on this script"
      accessibilityLabel="Win rates"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Trophy color={colors.text} size={18} strokeWidth={2.3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
});
