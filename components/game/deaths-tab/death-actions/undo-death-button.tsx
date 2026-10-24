import { Undo2 } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type UndoDeathButtonProps = {
  compact?: boolean;
  disabled?: boolean;
  label?: string;
  onPress: () => void;
  playerName: string;
};

export function UndoDeathButton({
  compact = false,
  disabled = false,
  label,
  onPress,
  playerName,
}: UndoDeathButtonProps) {
  return (
    <Pressable
      accessibilityHint="Remove the death entry from the death log"
      accessibilityLabel={`Undo death for ${playerName}`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.buttonCompact : styles.buttonRegular,
        disabled && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      <Undo2
        color={disabled ? colors.gameTextMuted : colors.gameText}
        size={compact ? 15 : 17}
        strokeWidth={2.7}
      />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  buttonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  buttonDisabled: {
    borderColor: colors.gameSurfacePressed,
    opacity: 0.48,
  },
  buttonPressed: {
    backgroundColor: colors.gameSurfacePressed,
  },
  buttonRegular: {
    minWidth: 48,
    paddingVertical: 14,
  },
  label: {
    color: colors.gameText,
    fontSize: 13,
    fontWeight: '800',
  },
});
