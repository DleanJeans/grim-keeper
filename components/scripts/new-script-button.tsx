import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type NewScriptButtonProps = {
  onPress: () => void;
};

export function NewScriptButton({ onPress }: NewScriptButtonProps) {
  return (
    <Pressable
      accessibilityHint="Adds an empty script and opens it for customizing."
      accessibilityLabel="New script"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Plus color={colors.text} size={18} strokeWidth={2.6} />
      <Text style={styles.label}>New script</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
