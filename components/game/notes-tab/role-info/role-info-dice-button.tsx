import { Dices } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';

type RoleInfoDiceButtonProps = {
  onPress: () => void;
};

/** Fills a Character info line with fake info that fits the fake evil team. */
export function RoleInfoDiceButton({ onPress }: RoleInfoDiceButtonProps) {
  return (
    <Pressable
      accessibilityHint="Fills this line with info that fits the fake evil team"
      accessibilityLabel="Roll fake info"
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Dices color={colors.randomAccent} size={18} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.randomAccentSurface,
    borderColor: colors.randomAccent,
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  buttonPressed: { opacity: 0.7 },
});
