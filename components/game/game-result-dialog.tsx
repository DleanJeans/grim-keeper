import { Plus } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LessonBox } from '@/components/game/lesson-box';
import { KeyboardAvoidingView } from '@/components/keyboard-avoiding-view';
import { ScaledModal } from '@/components/scaled-modal';
import { Text } from '@/components/text';
import type { GameLessonInput } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Game, GameResult } from '@/types/game';
import { getResultLabel } from '@/utils/game-utils';
import { getGameLessons } from '@/utils/lesson-utils';

type LessonDraft = GameLessonInput & { key: number };

type GameResultDialogProps = {
  game: Game;
  onClose: () => void;
  onLessonChange: (lessons: GameLessonInput[]) => void;
  onResultChange: (result?: GameResult) => void;
  /** Opens the win rates on the game's script. Leave out when the game has no script. */
  onShowWinRates?: () => void;
  result?: GameResult;
};

/**
 * Won / Lost / Clear plus free-text lessons (one box each) with the Notes tab's player and character suggestions.
 * The lessons save whenever the dialog closes.
 */
export function GameResultDialog({
  game,
  onClose,
  onLessonChange,
  onResultChange,
  onShowWinRates,
  result,
}: GameResultDialogProps) {
  const nextKey = useRef(0);
  const [drafts, setDrafts] = useState<LessonDraft[]>(() => {
    const lessons = getGameLessons(game);
    return (lessons.length > 0 ? lessons : ['']).map((text) => ({
      key: nextKey.current++,
      tagPlayer: !game.untaggedLessons?.includes(text),
      text,
    }));
  });

  function updateDraft(key: number, changes: Partial<GameLessonInput>) {
    setDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...changes } : draft)),
    );
  }

  function removeDraft(key: number) {
    setDrafts((current) => {
      const rest = current.filter((draft) => draft.key !== key);
      return rest.length > 0 ? rest : [{ key: nextKey.current++, tagPlayer: true, text: '' }];
    });
  }

  function addDraft() {
    setDrafts((current) => [...current, { key: nextKey.current++, tagPlayer: true, text: '' }]);
  }

  function close(after?: () => void) {
    onLessonChange(drafts.map(({ tagPlayer, text }) => ({ tagPlayer, text })));
    onClose();
    after?.();
  }

  return (
    <ScaledModal animationType="fade" onRequestClose={() => close()} transparent visible>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityLabel="Close game result"
          onPress={() => close()}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityRole="alert" style={styles.dialog}>
          <View style={styles.content}>
            <Text style={styles.title}>Game result</Text>
            <Text style={styles.message}>
              Choose how this game ended. A draw (storyteller mistake, experiment) is left out of
              win rates.
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: result === 'won' }}
              onPress={() => close(() => onResultChange('won'))}
              style={({ pressed }) => [
                styles.action,
                styles.successAction,
                result === 'won' && styles.successSelected,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={[styles.actionText, styles.successActionText]}>
                {getResultLabel(game, 'won')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: result === 'lost' }}
              onPress={() => close(() => onResultChange('lost'))}
              style={({ pressed }) => [
                styles.action,
                styles.destructiveAction,
                result === 'lost' && styles.destructiveSelected,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={[styles.actionText, styles.destructiveActionText]}>
                {getResultLabel(game, 'lost')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: result === 'draw' }}
              onPress={() => close(() => onResultChange('draw'))}
              style={({ pressed }) => [
                styles.action,
                result === 'draw' && styles.drawSelected,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={styles.actionText}>Draw</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => close(() => onResultChange(undefined))}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionText}>Clear</Text>
            </Pressable>
          </View>
          <View style={styles.lesson}>
            <Text style={styles.lessonLabel}>Lessons</Text>
            {drafts.map((draft) => (
              <LessonBox
                game={game}
                key={draft.key}
                onChangeText={(text) => updateDraft(draft.key, { text })}
                onRemove={() => removeDraft(draft.key)}
                onTagPlayerChange={(tagPlayer) => updateDraft(draft.key, { tagPlayer })}
                tagPlayer={draft.tagPlayer}
                value={draft.text}
              />
            ))}
            <Pressable
              accessibilityLabel="Add another lesson"
              accessibilityRole="button"
              onPress={addDraft}
              style={({ pressed }) => [styles.add, pressed && styles.actionPressed]}
            >
              <Plus color={colors.textMuted} size={20} strokeWidth={2.5} />
            </Pressable>
          </View>
          <View style={styles.actions}>
            {onShowWinRates ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => close(onShowWinRates)}
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              >
                <Text style={styles.actionText}>Win rates</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => close()}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScaledModal>
  );
}

const styles = StyleSheet.create({
  add: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  action: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  actionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.dialogBackdrop,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    gap: 10,
  },
  destructiveAction: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
  },
  destructiveActionText: {
    color: colors.danger,
  },
  drawSelected: {
    borderColor: colors.textMuted,
    borderWidth: 3,
  },
  destructiveSelected: {
    borderWidth: 3,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    boxShadow: `0 18px 48px ${colors.dialogShadow}`,
    gap: 20,
    maxWidth: 420,
    padding: 20,
    width: '100%',
  },
  lesson: {
    gap: 8,
    zIndex: 1,
  },
  lessonLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  successAction: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  successActionText: {
    color: colors.successText,
  },
  successSelected: {
    borderWidth: 3,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
});
