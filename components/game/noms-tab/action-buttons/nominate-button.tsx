import { Pressable, View } from 'react-native';
import { NomIcon } from '@/components/game/noms-tab/nom-icon';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { onDarkTextStrong, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';
import type { Player } from '@/types/game';

type NominateButtonProps = {
  alreadyNominatedName?: string;
  alreadyNominatedPlayer?: Player;
  dead?: boolean;
  disabled?: boolean;
  flex?: number;
  onPress: () => void;
  playerName: string;
};

export function NominateButton({
  alreadyNominatedName,
  alreadyNominatedPlayer,
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
      {disabled && alreadyNominatedPlayer ? (
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 4, minWidth: 0 }}>
          <Text style={{ ...onDarkTextStrong, color: '#94a3b8' }}>Already Nominated</Text>
          <PlayerNameWithRole
            player={alreadyNominatedPlayer}
            iconSize={14}
            textStyle={{ ...onDarkTextStrong, color: '#94a3b8' }}
          />
        </View>
      ) : (
        <Text
          style={{
            ...onDarkTextStrong,
            color: disabled ? '#94a3b8' : '#f8fafc',
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
