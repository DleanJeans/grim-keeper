import { CircleCheck, CircleX, Handshake, NotebookPen, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { GameResultDialog } from '@/components/game/game-result-dialog';
import { Text } from '@/components/text';
import type { GameLessonInput } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Game, GameResult } from '@/types/game';
import { getResultLabel } from '@/utils/game-utils';
import { getGameLessons } from '@/utils/lesson-utils';

type GameResultButtonProps = {
  game: Game;
  onChange: (result?: GameResult) => void;
  onLessonChange: (lessons: GameLessonInput[]) => void;
  /** Opens the win rates on the game's script. Leave out when the game has no script. */
  onShowWinRates?: () => void;
  result?: GameResult;
};

export function GameResultButton({
  game,
  onChange,
  onLessonChange,
  onShowWinRates,
  result,
}: GameResultButtonProps) {
  const [open, setOpen] = useState(false);
  const Icon =
    result === 'won'
      ? CircleCheck
      : result === 'lost'
        ? CircleX
        : result === 'draw'
          ? Handshake
          : Trophy;
  const label = result === undefined ? 'Result' : getResultLabel(game, result);

  return (
    <>
      <Pressable
        accessibilityHint="Choose won, lost, draw, or clear the game result, and note a lesson"
        accessibilityLabel={
          result ? `Game result: ${getResultLabel(game, result)}` : 'Set game result'
        }
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
        {getGameLessons(game).length > 0 ? (
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
          game={game}
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
