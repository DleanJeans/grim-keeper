import { Skull } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { onDarkTextStrong, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';

type KillButtonProps = {
  disabled?: boolean;
  flex?: number;
  onPress: () => void;
  playerName: string;
};

export function KillButton({ disabled = false, flex = 1, onPress, playerName }: KillButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`Mark ${playerName} dead`}
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
      <Text style={onDarkTextStrong}>{disabled ? 'Killed' : 'Kill'}</Text>
    </Pressable>
  );
}
