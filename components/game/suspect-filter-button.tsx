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
      <Icon color={active ? colors.gameBackground : colors.gameText} size={18} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  active: { backgroundColor: colors.gameText, borderColor: colors.gameText },
  button: {
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pressed: { opacity: 0.75 },
});
