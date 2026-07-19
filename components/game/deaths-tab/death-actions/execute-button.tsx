import { FlameKindling } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { onDarkTextStrong, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';

type ExecuteButtonProps = {
  compact?: boolean;
  disabled?: boolean;
  disabledLabel?: string;
  flex?: number;
  onPress: () => void;
  playerName: string;
};

export function ExecuteButton({
  compact = false,
  disabled = false,
  disabledLabel = 'Executed',
  flex = 1,
  onPress,
  playerName,
}: ExecuteButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`Mark ${playerName} dead by execution`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        ...outlinedActionStyle({
          pressed,
          disabled,
          borderColor: '#fca5a5',
          flex: compact ? undefined : flex,
          paddingVertical: compact ? 8 : 14,
        }),
        flexBasis: compact ? 'auto' : 0,
        paddingHorizontal: compact ? 8 : undefined,
      })}
    >
      <FlameKindling
        color={disabled ? '#94a3b8' : '#fca5a5'}
        size={compact ? 15 : 17}
        strokeWidth={2.7}
      />
      <Text style={onDarkTextStrong}>{disabled ? disabledLabel : 'Execute'}</Text>
    </Pressable>
  );
}
