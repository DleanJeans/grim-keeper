import { Undo2 } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/text';

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
      <Undo2 color={disabled ? '#94a3b8' : '#f8fafc'} size={compact ? 15 : 17} strokeWidth={2.7} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#334155',
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
    borderColor: '#1f2937',
    opacity: 0.48,
  },
  buttonPressed: {
    backgroundColor: '#1f2937',
  },
  buttonRegular: {
    minWidth: 48,
    paddingVertical: 14,
  },
  label: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
});
