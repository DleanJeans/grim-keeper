import { Lock, Unlock } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';

type DayEditLockButtonProps = {
  phaseLabel: string;
  locked: boolean;
  onToggle: () => void;
};

export function DayEditLockButton({ phaseLabel, locked, onToggle }: DayEditLockButtonProps) {
  const Icon = locked ? Lock : Unlock;
  const action = locked ? 'Unlock' : 'Lock';

  return (
    <Pressable
      accessibilityLabel={`${action} editing for ${phaseLabel}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: !locked }}
      hitSlop={8}
      onPress={onToggle}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon color={locked ? colors.warning : colors.textMuted} size={16} strokeWidth={2.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 7,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
});
