import { Minus, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { CharacterTypeCounts } from '@/types/game';
import { GENERIC_CHARACTER_TYPE_ROLES } from '@/utils/role-utils';

type CharacterTypeCountsProps = {
  counts?: CharacterTypeCounts;
  onChange: (counts?: CharacterTypeCounts) => void;
  playerCount: number;
};

type CharacterType = keyof CharacterTypeCounts;

const characterTypes: Array<{ key: CharacterType; label: string }> = [
  { key: 'townsfolk', label: 'Townsfolk' },
  { key: 'outsiders', label: 'Outsider' },
  { key: 'minions', label: 'Minion' },
  { key: 'demons', label: 'Demon' },
];

export function CharacterTypeCountEditor({
  counts,
  onChange,
  playerCount,
}: CharacterTypeCountsProps) {
  const automaticCounts = getAutomaticCounts(playerCount);
  const displayedCounts = counts ?? automaticCounts;
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(displayedCounts);
  const draftTotal = Object.values(draft).reduce((total, count) => total + count, 0);
  const canSave = draftTotal === playerCount;

  function openEditor() {
    setDraft(displayedCounts);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
  }

  function updateCount(type: CharacterType, value: number) {
    setDraft((current) => ({ ...current, [type]: Math.max(0, value) }));
  }

  return (
    <>
      <Pressable
        accessibilityLabel={`Starting characters: ${formatCounts(displayedCounts)}. Edit counts`}
        accessibilityRole="button"
        onPress={openEditor}
        style={({ pressed }) => [styles.summary, pressed && styles.summaryPressed]}
      >
        {characterTypes.map(({ key, label }) => (
          <View key={key} style={styles.summaryCount}>
            <RoleIcon role={getCharacterTypeRole(label)} size={16} scale={1.15} />
            <Text selectable style={styles.summaryText}>
              {displayedCounts[key]}
            </Text>
          </View>
        ))}
      </Pressable>

      <Modal animationType="slide" onRequestClose={closeEditor} transparent visible={editorOpen}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Close starting character editor"
            accessibilityRole="button"
            onPress={closeEditor}
            style={styles.backdropDismiss}
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.titleGroup}>
                <Text selectable style={styles.title}>
                  Starting characters
                </Text>
                <Text selectable style={styles.subtitle}>
                  {counts ? 'Custom setup' : `Automatic for ${playerCount} players`}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close starting character editor"
                accessibilityRole="button"
                hitSlop={8}
                onPress={closeEditor}
                style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>

            <View style={styles.fields}>
              {characterTypes.map(({ key, label }) => (
                <View key={key} style={styles.fieldRow}>
                  <RoleIcon role={getCharacterTypeRole(label)} size={26} />
                  <Text selectable style={styles.fieldLabel}>
                    {label}
                  </Text>
                  <Pressable
                    accessibilityLabel={`Decrease ${label}`}
                    accessibilityRole="button"
                    onPress={() => updateCount(key, draft[key] - 1)}
                    style={({ pressed }) => [styles.stepButton, pressed && styles.buttonPressed]}
                  >
                    <Minus color={colors.text} size={17} strokeWidth={2.6} />
                  </Pressable>
                  <TextInput
                    accessibilityLabel={`${label} count`}
                    inputMode="numeric"
                    onChangeText={(value) => updateCount(key, Number.parseInt(value, 10) || 0)}
                    selectTextOnFocus
                    style={styles.countInput}
                    value={String(draft[key])}
                  />
                  <Pressable
                    accessibilityLabel={`Increase ${label}`}
                    accessibilityRole="button"
                    onPress={() => updateCount(key, draft[key] + 1)}
                    style={({ pressed }) => [styles.stepButton, pressed && styles.buttonPressed]}
                  >
                    <Plus color={colors.text} size={17} strokeWidth={2.6} />
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onChange(undefined);
                  closeEditor();
                }}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.secondaryButtonText}>Use automatic</Text>
              </Pressable>
              <Pressable
                accessibilityHint={
                  canSave
                    ? undefined
                    : `Character counts total ${draftTotal}; they must total ${playerCount}`
                }
                accessibilityRole="button"
                disabled={!canSave}
                onPress={() => {
                  onChange(draft);
                  closeEditor();
                }}
                style={({ pressed }) => [
                  styles.saveButton,
                  !canSave && styles.saveButtonDisabled,
                  pressed && styles.saveButtonPressed,
                ]}
              >
                <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  backdrop: { backgroundColor: '#00000099', flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1 },
  buttonPressed: { backgroundColor: colors.surfacePressed },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  countInput: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.inputText,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    height: 40,
    paddingVertical: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    width: 50,
  },
  fieldLabel: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '800' },
  fieldRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  fields: { gap: 10 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  saveButtonDisabled: { backgroundColor: colors.disabled },
  saveButtonPressed: { opacity: 0.82 },
  saveButtonText: { color: colors.onPrimary, fontWeight: '900' },
  saveButtonTextDisabled: { color: colors.onDisabled },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryButtonText: { color: colors.text, fontWeight: '800' },
  sheet: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 18,
    padding: 16,
  },
  stepButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  subtitle: { color: colors.textMuted, fontSize: 12 },
  summary: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  summaryCount: { alignItems: 'center', flexDirection: 'row', gap: 1 },
  summaryPressed: { opacity: 0.65 },
  summaryText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  titleGroup: { flex: 1, gap: 2 },
});

function getAutomaticCounts(playerCount: number): CharacterTypeCounts {
  if (playerCount <= 5) return { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
  if (playerCount === 6) return { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
  if (playerCount === 7) return { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 };
  if (playerCount === 8) return { townsfolk: 5, outsiders: 1, minions: 1, demons: 1 };
  if (playerCount === 9) return { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 };
  if (playerCount === 10) return { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 };
  if (playerCount === 11) return { townsfolk: 7, outsiders: 1, minions: 2, demons: 1 };
  if (playerCount === 12) return { townsfolk: 7, outsiders: 2, minions: 2, demons: 1 };
  if (playerCount === 13) return { townsfolk: 9, outsiders: 0, minions: 3, demons: 1 };
  if (playerCount === 14) return { townsfolk: 9, outsiders: 1, minions: 3, demons: 1 };
  return { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 };
}

function formatCounts(counts: CharacterTypeCounts) {
  return characterTypes.map(({ key, label }) => `${counts[key]} ${label}`).join(', ');
}

function getCharacterTypeRole(label: string) {
  const role = GENERIC_CHARACTER_TYPE_ROLES.find((candidate) => candidate.name === label);
  if (!role) {
    throw new Error(`Missing generic ${label} role`);
  }
  return role;
}
