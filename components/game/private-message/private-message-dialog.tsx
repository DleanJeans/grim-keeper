import { Bookmark, Eye, Hand, Lock, Pencil, Trash2, X } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DimensionSlider } from '@/components/game/dimension-slider';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { NoteAutocompleteInput } from '@/components/game/notes-tab/note-autocomplete-input';
import { PrivateMessageText } from '@/components/game/private-message/private-message-text';
import { KeyboardAvoidingView } from '@/components/keyboard-avoiding-view';
import { ScaledModal } from '@/components/scaled-modal';
import { Text } from '@/components/text';
import {
  PRIVATE_MESSAGE_FONT_SIZE,
  type SavedPrivateMessage,
  usePrivateMessageStore,
} from '@/store/private-message-store';
import { colors } from '@/theme/colors';
import { APP_USER_ID } from '@/utils/object-id';
import { GENERIC_CHARACTER_TYPE_ROLE_REFERENCES } from '@/utils/role-utils';

type PrivateMessageDialogProps = {
  onClose: () => void;
};

/**
 * Full-screen private message: write it with role and player names (type @ or a capital letter
 * for suggestions), then hand the device over. The message only shows while the button at the
 * bottom is held, so letting go hides it again.
 */
export function PrivateMessageDialog({ onClose }: PrivateMessageDialogProps) {
  const { activeDay, activePhase, game, players } = useGameRouteContext();
  const { deleteSaved, draft, fontSize, save, saved, setDraft, setFontSize } =
    usePrivateMessageStore();
  const [handingOver, setHandingOver] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const roles = [...(game.script?.roles ?? []), ...GENERIC_CHARACTER_TYPE_ROLE_REFERENCES];
  // "You" in a message means the reader, not the app user's own token.
  const otherPlayers = players.filter((player) => player.id !== APP_USER_ID);
  const hasText = draft.trim().length > 0;
  const isSaved = saved.some((item) => item.text === draft.trim());

  function handOver() {
    Keyboard.dismiss();
    setPeeking(false);
    setHandingOver(true);
  }

  function edit() {
    setPeeking(false);
    setHandingOver(false);
  }

  return (
    <ScaledModal animationType="fade" onRequestClose={onClose} visible>
      <GestureHandlerRootView style={styles.root}>
        <KeyboardAvoidingView
          behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
          style={styles.screen}
        >
          {handingOver ? (
            <>
              <View style={styles.header}>
                <IconButton label="Close" onPress={onClose}>
                  <X color={colors.textMuted} size={20} strokeWidth={2.5} />
                </IconButton>
                <Text style={styles.headerHint}>Private message</Text>
                <IconButton label="Edit message" onPress={edit}>
                  <Pencil color={colors.textMuted} size={18} strokeWidth={2.5} />
                </IconButton>
              </View>
              <ScrollView contentContainerStyle={styles.messageArea} style={styles.messageScroll}>
                {peeking ? (
                  <PrivateMessageText
                    fontSize={fontSize}
                    players={otherPlayers}
                    roles={roles}
                    text={draft.trim()}
                  />
                ) : (
                  <View style={styles.hidden}>
                    <View style={styles.lock}>
                      <Lock color={colors.textMuted} size={34} strokeWidth={2} />
                    </View>
                    <Text style={styles.hiddenTitle}>Message hidden</Text>
                    <Text style={styles.hint}>
                      Hand the phone over.{'\n'}Hold the button below to read.
                    </Text>
                  </View>
                )}
              </ScrollView>
              <View style={styles.sizeCard}>
                <DimensionSlider
                  accessibilityLabel="Message text size"
                  label="Size"
                  max={PRIVATE_MESSAGE_FONT_SIZE.max}
                  min={PRIVATE_MESSAGE_FONT_SIZE.min}
                  onChange={setFontSize}
                  step={PRIVATE_MESSAGE_FONT_SIZE.step}
                  value={fontSize}
                />
              </View>
              <Pressable
                accessibilityHint="Shows the message while held"
                accessibilityLabel="Hold to reveal"
                accessibilityRole="button"
                onPressIn={() => setPeeking(true)}
                onPressOut={() => setPeeking(false)}
                style={[styles.hold, peeking && styles.holdDown]}
              >
                {peeking ? (
                  <Eye color={colors.text} size={26} strokeWidth={2.4} />
                ) : (
                  <Hand color={colors.onPrimary} size={26} strokeWidth={2.4} />
                )}
                <View>
                  <Text style={[styles.holdTitle, peeking && styles.holdTitleDown]}>
                    {peeking ? 'Showing' : 'Hold to reveal'}
                  </Text>
                  <Text style={[styles.holdHint, peeking && styles.holdHintDown]}>
                    {peeking ? 'Let go to hide' : 'Release to hide'}
                  </Text>
                </View>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Private message</Text>
                <IconButton label="Close" onPress={onClose}>
                  <X color={colors.textMuted} size={20} strokeWidth={2.5} />
                </IconButton>
              </View>
              <View style={styles.inputBox}>
                <NoteAutocompleteInput
                  accessibilityLabel="Private message"
                  day={activeDay}
                  dropdownBelow
                  game={game}
                  onChangeText={setDraft}
                  phase={activePhase}
                  placeholder="Type a message. Use @ or a capital letter to add a role or player."
                  placeholderTextColor={colors.inputPlaceholder}
                  style={styles.input}
                  value={draft}
                />
              </View>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={!hasText || isSaved}
                  onPress={() => save(draft)}
                  style={({ pressed }) => [
                    styles.tool,
                    (!hasText || isSaved) && styles.toolDisabled,
                    pressed && styles.toolPressed,
                  ]}
                >
                  <Bookmark color={colors.text} size={15} strokeWidth={2.5} />
                  <Text style={styles.toolText}>{isSaved ? 'Saved' : 'Save'}</Text>
                </Pressable>
                {hasText ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setDraft('')}
                    style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]}
                  >
                    <Text style={styles.toolText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
              {saved.length > 0 ? <Text style={styles.label}>SAVED</Text> : null}
              <ScrollView
                contentContainerStyle={styles.savedList}
                keyboardShouldPersistTaps="handled"
                style={styles.savedScroll}
              >
                {saved.map((item) => (
                  <SavedMessageRow
                    item={item}
                    key={item.id}
                    onDelete={() => deleteSaved(item.id)}
                    onUse={() => setDraft(item.text)}
                    selected={item.text === draft.trim()}
                  />
                ))}
              </ScrollView>
              <Pressable
                accessibilityRole="button"
                disabled={!hasText}
                onPress={handOver}
                style={({ pressed }) => [
                  styles.primary,
                  !hasText && styles.primaryDisabled,
                  pressed && styles.primaryPressed,
                ]}
              >
                <Hand
                  color={hasText ? colors.onPrimary : colors.onDisabled}
                  size={20}
                  strokeWidth={2.4}
                />
                <Text style={[styles.primaryText, !hasText && styles.primaryTextDisabled]}>
                  Hand to player
                </Text>
              </Pressable>
            </>
          )}
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </ScaledModal>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  screen: { flex: 1, gap: 10, paddingBottom: 18, paddingHorizontal: 16, paddingTop: 14 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  headerHint: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  iconButton: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconButtonPressed: { backgroundColor: colors.surfacePressed },
  inputBox: { height: 160, zIndex: 20 },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    borderWidth: 1.5,
    color: colors.inputText,
    flex: 1,
    fontSize: 16,
    lineHeight: 23,
    paddingHorizontal: 13,
    paddingVertical: 11,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  tool: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  toolDisabled: { opacity: 0.45 },
  toolPressed: { backgroundColor: colors.surfacePressed },
  toolText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  savedScroll: { flex: 1 },
  savedList: { gap: 6 },
  savedRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingLeft: 11,
  },
  savedRowSelected: { borderColor: colors.primary },
  savedRowPressed: { backgroundColor: colors.surfacePressed },
  savedUse: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 9, paddingVertical: 10 },
  savedText: { color: colors.text, flex: 1, fontSize: 13 },
  savedDelete: { padding: 10 },
  primary: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryDisabled: { backgroundColor: colors.disabled },
  primaryPressed: { opacity: 0.85 },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: '900' },
  primaryTextDisabled: { color: colors.onDisabled },
  messageScroll: { flex: 1 },
  messageArea: { flexGrow: 1, justifyContent: 'center', paddingVertical: 12 },
  hidden: { alignItems: 'center', gap: 12 },
  lock: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 42,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  hiddenTitle: { color: colors.text, fontSize: 21, fontWeight: '900' },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  sizeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  hold: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: 24,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 86,
    userSelect: 'none',
  },
  holdDown: { backgroundColor: colors.surfaceRaised, transform: [{ scale: 0.97 }] },
  holdTitle: { color: colors.onPrimary, fontSize: 18, fontWeight: '900' },
  holdTitleDown: { color: colors.text },
  holdHint: { color: colors.onPrimary, fontSize: 12, fontWeight: '700', opacity: 0.65 },
  holdHintDown: { color: colors.text },
});

function IconButton({
  children,
  label,
  onPress,
}: {
  children: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
    >
      {children}
    </Pressable>
  );
}

function SavedMessageRow({
  item,
  onDelete,
  onUse,
  selected,
}: {
  item: SavedPrivateMessage;
  onDelete: () => void;
  onUse: () => void;
  selected: boolean;
}) {
  return (
    <View style={[styles.savedRow, selected && styles.savedRowSelected]}>
      <Pressable
        accessibilityHint="Puts this message in the box"
        accessibilityRole="button"
        onPress={onUse}
        style={({ pressed }) => [styles.savedUse, pressed && styles.savedRowPressed]}
      >
        <Bookmark color={colors.textMuted} size={14} strokeWidth={2.5} />
        <Text numberOfLines={2} style={styles.savedText}>
          {item.text}
        </Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Delete saved message"
        accessibilityRole="button"
        hitSlop={6}
        onPress={onDelete}
        style={styles.savedDelete}
      >
        <Trash2 color={colors.textMuted} size={16} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
