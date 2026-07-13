import { HeartPulse } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Text } from '@/components/text';

type ReviveButtonProps = {
  disabled?: boolean;
  flex?: number;
  onPress: () => void;
  playerName: string;
  subtitle?: string;
};

export function ReviveButton({
  disabled = false,
  flex = 1,
  onPress,
  playerName,
  subtitle = 'Mark player as alive and add a revive to the death log',
}: ReviveButtonProps) {
  return (
    <Pressable
      accessibilityHint={disabled ? 'Player is already alive' : subtitle}
      accessibilityLabel={`Revive ${playerName}`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? '#1f2937' : '#111827',
        borderColor: disabled ? '#1f2937' : '#22c55e',
        borderRadius: 8,
        borderWidth: 1,
        flex,
        flexBasis: 0,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        minWidth: 0,
        opacity: disabled ? 0.48 : 1,
        paddingVertical: 14,
      })}
    >
      <HeartPulse color={disabled ? '#94a3b8' : '#86efac'} size={17} strokeWidth={2.7} />
      <Text
        style={{
          color: disabled ? '#94a3b8' : '#f8fafc',
          fontWeight: '900',
        }}
      >
        Revive
      </Text>
    </Pressable>
  );
}
