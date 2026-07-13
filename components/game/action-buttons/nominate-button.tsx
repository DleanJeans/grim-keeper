import { Pressable } from 'react-native';

import { NomIcon } from '@/components/game/nom-icon';
import { onDarkTextStrong, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';

type NominateButtonProps = {
  alreadyNominatedName?: string;
  dead?: boolean;
  disabled?: boolean;
  flex?: number;
  onPress: () => void;
  playerName: string;
};

export function NominateButton({
  alreadyNominatedName,
  dead = false,
  disabled = false,
  flex = 1,
  onPress,
  playerName,
}: NominateButtonProps) {
  const label = dead
    ? 'Dead player cannot nominate'
    : disabled && alreadyNominatedName
      ? `Already Nominated ${alreadyNominatedName}`
      : disabled
        ? 'Already Nominated'
        : 'Nominate';
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
        {label}
      </Text>
    </Pressable>
  );
}
