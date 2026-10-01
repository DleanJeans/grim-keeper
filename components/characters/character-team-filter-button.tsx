import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function CharacterTeamFilterButton({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`Filter characters by ${label.toLocaleLowerCase()}`}
      accessibilityRole="togglebutton"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        selected && styles.buttonSelected,
      ]}
    >
      <Text selectable style={[styles.buttonText, selected && styles.buttonTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 4,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  buttonSelected: {
    backgroundColor: colors.inputText,
  },
  buttonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonTextSelected: {
    color: colors.onPrimary,
  },
});
