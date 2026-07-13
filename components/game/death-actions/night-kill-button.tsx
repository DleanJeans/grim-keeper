import { Skull } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Text } from '@/components/text';
import { onDarkTextStrong, outlinedActionStyle } from '@/components/game/styles';

type NightKillButtonProps = {
  disabled?: boolean;
  flex?: number;
  onPress: () => void;
  playerName: string;
};

export function NightKillButton({ disabled = false, flex = 1, onPress, playerName }: NightKillButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`Mark ${playerName} dead at night`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) =>
        outlinedActionStyle({
          pressed,
          disabled,
          borderColor: '#93c5fd',
          flex,
        })
      }
    >
      <Skull color={disabled ? '#94a3b8' : '#93c5fd'} size={17} strokeWidth={2.7} />
      <Text style={onDarkTextStrong}>{disabled ? 'Killed' : 'Night Kill'}</Text>
    </Pressable>
  );
}
