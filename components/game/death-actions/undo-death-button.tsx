import { Undo2 } from 'lucide-react-native';
import { Pressable } from 'react-native';

type UndoDeathButtonProps = {
  compact?: boolean;
  disabled?: boolean;
  onPress: () => void;
  playerName: string;
};

export function UndoDeathButton({
  compact = false,
  disabled = false,
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
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? '#1f2937' : '#111827',
        borderColor: disabled ? '#1f2937' : '#334155',
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        minWidth: compact ? undefined : 48,
        opacity: disabled ? 0.48 : 1,
        paddingHorizontal: compact ? 8 : undefined,
        paddingVertical: compact ? 8 : 14,
      })}
    >
      <Undo2 color={disabled ? '#94a3b8' : '#f8fafc'} size={compact ? 15 : 17} strokeWidth={2.7} />
    </Pressable>
  );
}
