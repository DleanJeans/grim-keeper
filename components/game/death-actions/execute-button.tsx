import { FlameKindling } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Text } from '@/components/text';
import { onDarkTextStrong, outlinedActionStyle } from '@/components/game/styles';

type ExecuteButtonProps = {
  disabled?: boolean;
  flex?: number;
  onPress: () => void;
  playerName: string;
};

export function ExecuteButton({ disabled = false, flex = 1, onPress, playerName }: ExecuteButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`Mark ${playerName} dead by execution`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) =>
        outlinedActionStyle({
          pressed,
          disabled,
          borderColor: '#fca5a5',
          flex,
        })
      }
    >
      <FlameKindling color={disabled ? '#94a3b8' : '#fca5a5'} size={17} strokeWidth={2.7} />
      <Text style={onDarkTextStrong}>{disabled ? 'Executed' : 'Execute'}</Text>
    </Pressable>
  );
}
