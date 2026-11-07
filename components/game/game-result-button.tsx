import { CircleCheck, CircleX, NotebookPen, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { GameResultDialog } from '@/components/game/game-result-dialog';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { GameResult } from '@/types/game';

type GameResultButtonProps = {
  lesson?: string;
  onChange: (result?: GameResult) => void;
  onLessonChange: (lesson: string) => void;
  /** Opens the win rates on the game's script. Leave out when the game has no script. */
  onShowWinRates?: () => void;
  result?: GameResult;
};

export function GameResultButton({
  lesson,
  onChange,
  onLessonChange,
  onShowWinRates,
  result,
}: GameResultButtonProps) {
  const [open, setOpen] = useState(false);
  const Icon = result === 'won' ? CircleCheck : result === 'lost' ? CircleX : Trophy;
  const label = result === undefined ? 'Result' : capitalize(result);

  return (
    <>
      <Pressable
        accessibilityHint="Choose won, lost, or clear the game result, and note a lesson"
        accessibilityLabel={result ? `Game result: ${result}` : 'Set game result'}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => setOpen(true)}
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
        {lesson ? (
          <NotebookPen
            accessibilityLabel="Has a lesson"
            color={colors.textMuted}
            size={12}
            strokeWidth={2.3}
          />
        ) : null}
      </Pressable>
      {open ? (
        <GameResultDialog
          lesson={lesson}
          onClose={() => setOpen(false)}
          onLessonChange={onLessonChange}
          onResultChange={onChange}
          onShowWinRates={onShowWinRates}
          result={result}
        />
      ) : null}
    </>
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
    minHeight: 48,
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
