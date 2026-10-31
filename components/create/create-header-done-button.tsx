import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function CreateHeaderDoneButton({
  canStart,
  onPress,
}: {
  canStart: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel="Done editing players"
      accessibilityRole="button"
      disabled={!canStart}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        !canStart && styles.buttonDisabled,
      ]}
    >
      <Check color={canStart ? colors.onPrimary : colors.onDisabled} size={15} strokeWidth={2.7} />
      <Text style={[styles.label, !canStart && styles.labelDisabled]}>Done</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
    opacity: 0.75,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  label: {
    color: colors.onPrimary,
    fontWeight: '800',
  },
  labelDisabled: {
    color: colors.onDisabled,
  },
});
