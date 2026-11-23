import { Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { KeyboardAvoidingView } from '@/components/keyboard-avoiding-view';
import { ScaledModal } from '@/components/scaled-modal';
import { Text } from '@/components/text';
import { useQuickTags } from '@/hooks/use-quick-tags';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { DEFAULT_QUICK_TAGS, normalizeQuickTags } from '@/utils/quick-tag-utils';

type EditTagsSheetProps = {
  onClose: () => void;
  visible: boolean;
};

/** Add or remove the player tags offered in the dock. The list is shared by every game. */
export function EditTagsSheet({ onClose, visible }: EditTagsSheetProps) {
  const tags = useQuickTags();
  const setQuickTags = useGameStore((state) => state.setQuickTags);
  const [draft, setDraft] = useState('');
  const canAdd = normalizeQuickTags([draft]).length > 0;
  const isDefault = tags.join('\n') === DEFAULT_QUICK_TAGS.join('\n');

  function addTag() {
    if (!canAdd) return;
    setQuickTags([...tags, draft]);
    setDraft('');
  }

  return (
    <ScaledModal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close edit tags"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdropDismiss}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text selectable style={styles.title}>
              Edit tags
            </Text>
            <Pressable
              accessibilityLabel="Done editing tags"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>
            Tags are shared by every game. Removing one keeps notes already written with it.
          </Text>
          <ScrollView contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
            {tags.map((tag) => (
              <RemovableTag
                key={tag}
                onRemove={() => setQuickTags(tags.filter((item) => item !== tag))}
                tag={tag}
              />
            ))}
            {tags.length === 0 ? <Text style={styles.hint}>No tags.</Text> : null}
          </ScrollView>
          <View style={styles.addRow}>
            <TextInput
              accessibilityLabel="New tag"
              maxLength={30}
              onChangeText={setDraft}
              onSubmitEditing={addTag}
              placeholder="New tag"
              placeholderTextColor={colors.gameTextSubtle}
              returnKeyType="done"
              style={styles.input}
              value={draft}
            />
            <Pressable
              accessibilityLabel="Add tag"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canAdd }}
              disabled={!canAdd}
              onPress={addTag}
              style={({ pressed }) => [
                styles.addButton,
                !canAdd && styles.addDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Plus color={colors.gameBackground} size={20} strokeWidth={2.8} />
            </Pressable>
          </View>
          {isDefault ? null : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setQuickTags(DEFAULT_QUICK_TAGS)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.reset}>Reset to default tags</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScaledModal>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.gameText,
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  addDisabled: { opacity: 0.4 },
  addRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  backdrop: { backgroundColor: colors.backdrop, flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1 },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingLeft: 12,
    paddingRight: 8,
  },
  chipText: { color: colors.gameTextSoft, fontSize: 13, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  doneButton: {
    backgroundColor: colors.gameSurfaceRaised,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneText: { color: colors.gameText, fontSize: 14, fontWeight: '800' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  hint: { color: colors.gameTextMuted, fontSize: 13 },
  input: {
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.gameText,
    flex: 1,
    fontSize: 15,
    height: 44,
    paddingHorizontal: 12,
  },
  pressed: { opacity: 0.65 },
  reset: { color: colors.gameTextMuted, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  sheet: {
    backgroundColor: colors.gameBackground,
    borderColor: colors.gameBorder,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    maxHeight: '80%',
    padding: 16,
  },
  title: { color: colors.gameText, flex: 1, fontSize: 18, fontWeight: '900' },
});

function RemovableTag({ onRemove, tag }: { onRemove: () => void; tag: string }) {
  return (
    <Pressable
      accessibilityLabel={`Remove ${tag} tag`}
      accessibilityRole="button"
      onPress={onRemove}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Text style={styles.chipText}>{tag}</Text>
      <X color={colors.gameTextMuted} size={14} strokeWidth={2.8} />
    </Pressable>
  );
}
