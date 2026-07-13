import { Pressable } from 'react-native';

import { NomIcon } from '@/components/game/nom-icon';
import { Text } from '@/components/text';
import { onDarkTextStrong, outlinedActionStyle } from '@/components/game/styles';

type NominateButtonProps = {
  disabled?: boolean;
  flex?: number;
  onPress: () => void;
  playerName: string;
};

export function NominateButton({ disabled = false, flex = 1, onPress, playerName }: NominateButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`Track nomination from ${playerName}`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => outlinedActionStyle({ pressed, disabled, flex })}
    >
      <NomIcon color={disabled ? '#94a3b8' : '#f8fafc'} size={17} strokeWidth={2.7} />
      <Text
        style={{
          ...onDarkTextStrong,
          color: disabled ? '#94a3b8' : '#f8fafc',
        }}
      >
        {disabled ? 'Nominated' : 'Nominate'}
      </Text>
    </Pressable>
  );
}
