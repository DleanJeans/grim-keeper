import { CircleCheck, CircleX, Trophy } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { GameResult } from '@/types/game';

type GameResultButtonProps = {
  onChange: (result?: GameResult) => void;
  result?: GameResult;
};

export function GameResultButton({ onChange, result }: GameResultButtonProps) {
  const showDialog = useAppDialog();
  const Icon = result === 'won' ? CircleCheck : result === 'lost' ? CircleX : Trophy;
  const label = result === undefined ? 'Result' : capitalize(result);

  function handlePress() {
    showDialog('Game result', 'Choose how this game ended.', [
      { text: 'Won', onPress: () => onChange('won') },
      { text: 'Lost', onPress: () => onChange('lost'), style: 'destructive' },
      { text: 'Clear', onPress: () => onChange(undefined) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <Pressable
      accessibilityHint="Choose won, lost, or clear the game result"
      accessibilityLabel={result ? `Game result: ${result}` : 'Set game result'}
      accessibilityRole="button"
      hitSlop={8}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        result === 'won' ? styles.won : result === 'lost' ? styles.lost : styles.idle,
        pressed && styles.pressed,
      ]}
    >
      <Icon
        color={
          result === 'won' ? colors.successText : result === 'lost' ? colors.danger : colors.text
        }
        size={16}
        strokeWidth={2.3}
      />
      <Text
        style={[
          styles.label,
          result === 'won' ? styles.wonLabel : null,
          result === 'lost' ? styles.lostLabel : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function capitalize(value: GameResult) {
  return value[0].toLocaleUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  idle: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  lost: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
  },
  lostLabel: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.65,
  },
  won: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  wonLabel: {
    color: colors.successText,
  },
});
