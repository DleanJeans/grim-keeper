import { Filter, FilterX } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';

type SuspectFilterButtonProps = {
  active: boolean;
  onToggle: () => void;
};

/** Fades trusted and confirmed-good players on the map so the open suspects stand out. */
export function SuspectFilterButton({ active, onToggle }: SuspectFilterButtonProps) {
  const Icon = active ? FilterX : Filter;
  return (
    <Pressable
      accessibilityHint="Fades trusted and confirmed good players on the map"
      accessibilityLabel={active ? 'Show all players' : 'Show suspects only'}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={8}
      onPress={onToggle}
      style={({ pressed }) => [styles.button, active && styles.active, pressed && styles.pressed]}
    >
      <Icon color={active ? colors.background : colors.text} size={20} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  active: { backgroundColor: colors.text, borderColor: colors.text },
  button: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  pressed: { opacity: 0.75 },
});
