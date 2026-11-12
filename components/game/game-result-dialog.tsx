import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NoteAutocompleteInput } from '@/components/game/notes-tab/note-autocomplete-input';
import { KeyboardAvoidingView } from '@/components/keyboard-avoiding-view';
import { ScaledModal } from '@/components/scaled-modal';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, GameResult } from '@/types/game';
import { detectRoleIdsInNote } from '@/utils/saved-note-utils';

type GameResultDialogProps = {
  game: Game;
  onClose: () => void;
  onLessonChange: (lesson: string) => void;
  onResultChange: (result?: GameResult) => void;
  /** Opens the win rates on the game's script. Leave out when the game has no script. */
  onShowWinRates?: () => void;
  result?: GameResult;
};

/**
 * Won / Lost / Clear plus a free-text lesson with the Notes tab's player and character suggestions.
 * The lesson saves whenever the dialog closes.
 */
export function GameResultDialog({
  game,
  onClose,
  onLessonChange,
  onResultChange,
  onShowWinRates,
  result,
}: GameResultDialogProps) {
  const [draft, setDraft] = useState(game.lesson ?? '');
  const roles = game.script?.roles;
  const namedRoles = useMemo(() => {
    const roleIds = detectRoleIdsInNote(draft, roles ?? []);
    return (roles ?? []).filter((role) => roleIds.includes(role.id));
  }, [draft, roles]);

  function close(after?: () => void) {
    onLessonChange(draft);
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
            <Text style={styles.message}>Choose how this game ended.</Text>
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
              <Text style={[styles.actionText, styles.successActionText]}>Won</Text>
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
              <Text style={[styles.actionText, styles.destructiveActionText]}>Lost</Text>
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
            <Text style={styles.lessonLabel}>Lesson</Text>
            <View style={styles.inputRow}>
              <NoteAutocompleteInput
                accessibilityLabel="Lesson from this game"
                day={game.activeDay}
                game={game}
                onChangeText={setDraft}
                phase={game.activePhase ?? 'day'}
                placeholder="What will you take away from this game?"
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.input}
                value={draft}
              />
            </View>
            {namedRoles.length > 0 ? (
              <Text style={styles.savedFor}>
                {`Also saved as a note about ${namedRoles.map((role) => role.name).join(', ')}`}
              </Text>
            ) : null}
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
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.inputText,
    fontSize: 15,
    maxHeight: 160,
    minHeight: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  lesson: {
    gap: 6,
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
  savedFor: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
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
