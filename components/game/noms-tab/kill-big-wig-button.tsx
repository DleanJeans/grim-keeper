import { Skull } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type KillBigWigButtonProps = {
  disabled: boolean;
  onPress: () => void;
  playerName: string;
};

export function KillBigWigButton({ disabled, onPress, playerName }: KillBigWigButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`Kill ${playerName} with Big Wig`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      <Skull color={disabled ? colors.onDisabled : colors.danger} size={15} strokeWidth={2.7} />
      <Text style={[styles.label, disabled && styles.labelDisabled]}>
        {disabled ? 'Big Wig Killed' : 'Kill Big Wig'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.border,
  },
  buttonPressed: { backgroundColor: colors.surfacePressed },
  label: { color: colors.danger, fontSize: 13, fontWeight: '800' },
  labelDisabled: { color: colors.onDisabled },
});
