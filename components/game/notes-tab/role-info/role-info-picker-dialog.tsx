import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { GamePhase, Player, Role } from '@/types/game';
import { getNumberChoices, getRolesForInfoSlot, type RoleInfoSlot } from '@/utils/role-info-utils';
import { getRoleDisplayForMode } from '@/utils/role-utils';

export type RoleInfoPickerDialogProps = {
  day: number;
  onClose: () => void;
  onSelect: (value: string | undefined) => void;
  phase: GamePhase;
  players: Player[];
  role?: Role;
  roles: Role[];
  /** Show each player's confirmed, claimed, rumored or guessed character before their name. */
  showRoles: boolean;
  slot?: RoleInfoSlot;
  value?: string;
};

/**
 * Modal picker for one info slot: players, filtered characters, numbers, choices or text.
 * Remount (via `key`) per slot so the text draft starts from the slot's value.
 */
export function RoleInfoPickerDialog({
  day,
  onClose,
  onSelect,
  phase,
  players,
  role,
  roles,
  showRoles,
  slot,
  value,
}: RoleInfoPickerDialogProps) {
  const [draft, setDraft] = useState(value ?? '');

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={slot !== undefined}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View accessibilityRole="alert" style={styles.dialog}>
          <View style={styles.header}>
            {role ? <RoleIcon role={role} size={28} /> : null}
            <Text selectable style={styles.title}>
              {role ? `${role.name}: ` : ''}
              {slot?.label}
            </Text>
          </View>
          <ScrollView contentContainerStyle={styles.options} style={styles.scroll}>
            {slot ? (
              <SlotOptions
                day={day}
                draft={draft}
                onChangeDraft={setDraft}
                onSelect={onSelect}
                phase={phase}
                players={players}
                roles={roles}
                showRoles={showRoles}
                slot={slot}
                value={value}
              />
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            {value !== undefined ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => onSelect(undefined)}
                style={({ pressed }) => [
                  styles.action,
                  styles.destructiveAction,
                  pressed && styles.actionPressed,
                ]}
              >
                <Text style={[styles.actionText, styles.destructiveActionText]}>Clear</Text>
              </Pressable>
            ) : null}
            {slot?.kind === 'text' ? (
              <Pressable
                accessibilityRole="button"
                disabled={draft.trim() === ''}
                onPress={() => onSelect(draft.trim())}
                style={({ pressed }) => [
                  styles.action,
                  styles.successAction,
                  pressed && styles.actionPressed,
                ]}
              >
                <Text style={[styles.actionText, styles.successActionText]}>Save</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    fontSize: 15,
    fontWeight: '800',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  destructiveAction: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
  },
  destructiveActionText: {
    color: colors.danger,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    boxShadow: '0 18px 48px rgba(0, 0, 0, 0.45)',
    gap: 16,
    maxHeight: '85%',
    maxWidth: 460,
    padding: 18,
    width: '100%',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.inputText,
    flexBasis: '100%',
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  numberOption: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 0,
    width: 48,
  },
  numberOptionText: {
    fontSize: 18,
    fontWeight: '900',
  },
  option: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  optionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  optionSelected: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: colors.text,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scroll: {
    flexGrow: 0,
  },
  successAction: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  successActionText: {
    color: colors.successText,
  },
  title: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 19,
    fontWeight: '900',
  },
});

function SlotOptions({
  day,
  draft,
  onChangeDraft,
  onSelect,
  phase,
  players,
  roles,
  showRoles,
  slot,
  value,
}: {
  day: number;
  draft: string;
  onChangeDraft: (text: string) => void;
  onSelect: (value: string) => void;
  phase: GamePhase;
  players: Player[];
  roles: Role[];
  showRoles: boolean;
  slot: RoleInfoSlot;
  value?: string;
}) {
  switch (slot.kind) {
    case 'player':
      return players.map((option) => (
        <PickerOption
          key={option.id}
          label={option.name}
          onPress={() => onSelect(option.id)}
          role={
            showRoles
              ? getRoleDisplayForMode(option, players, day, roles, 'all', phase).roles[0]
              : undefined
          }
          selected={value === option.id}
        />
      ));
    case 'role': {
      const options = getRolesForInfoSlot(roles, slot.filter);
      if (options.length === 0) {
        return <Text style={styles.empty}>No matching characters on this script.</Text>;
      }
      return options.map((option) => (
        <PickerOption
          key={option.id}
          label={option.name}
          onPress={() => onSelect(option.id)}
          role={option}
          selected={value === option.id}
        />
      ));
    }
    case 'number':
      return getNumberChoices(slot).map((option) => (
        <PickerOption
          key={option}
          label={option}
          number
          onPress={() => onSelect(option)}
          selected={value === option}
        />
      ));
    case 'choice':
      return slot.choices.map((option) => (
        <PickerOption
          key={option}
          label={option}
          onPress={() => onSelect(option)}
          selected={value === option}
        />
      ));
    case 'text':
      return (
        <TextInput
          autoFocus
          multiline
          onChangeText={onChangeDraft}
          placeholder={slot.label}
          placeholderTextColor={colors.inputPlaceholder}
          style={styles.input}
          value={draft}
        />
      );
  }
}

function PickerOption({
  label,
  number = false,
  onPress,
  role,
  selected,
}: {
  label: string;
  number?: boolean;
  onPress: () => void;
  role?: Role;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`Select ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        number && styles.numberOption,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
    >
      {role ? <RoleIcon role={role} size={22} /> : null}
      <Text
        style={[
          styles.optionText,
          number && styles.numberOptionText,
          selected && styles.optionTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
