import { BookOpen } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function ViewScriptButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityHint="Open the script for this game"
      accessibilityLabel="View game script"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : styles.idle]}
    >
      <BookOpen color={colors.text} size={16} strokeWidth={2.3} />
      <Text style={styles.label}>View Script</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  idle: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
    borderColor: colors.borderStrong,
  },
});
