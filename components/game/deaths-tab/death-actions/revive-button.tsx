import { HeartPulse } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

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
      style={({ pressed }) =>
        outlinedActionStyle({ pressed, disabled, borderColor: colors.reviveBorder, flex })
      }
    >
      <HeartPulse
        color={disabled ? colors.gameTextMuted : colors.revive}
        size={17}
        strokeWidth={2.7}
      />
      <Text style={[styles.label, disabled && styles.labelDisabled]}>Revive</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.gameText,
    fontWeight: '900',
  },
  labelDisabled: {
    color: colors.gameTextMuted,
  },
});
