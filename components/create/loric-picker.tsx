import { Check, ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

const PICKER_TRIGGER_CHROME_HEIGHT = 24;

type LoricPickerProps = {
  lorics: Role[];
  onChange: (roleIds: string[]) => void;
  selectedRoleIds: string[];
  onTriggerHeightChange?: (height: number) => void;
  triggerHeight?: number;
};

export function LoricPicker({
  lorics,
  onChange,
  onTriggerHeightChange,
  selectedRoleIds,
  triggerHeight,
}: LoricPickerProps) {
  const [open, setOpen] = useState(false);

  if (lorics.length === 0) {
    return null;
  }

  const selectedLorics = lorics.filter((role) => selectedRoleIds.includes(role.id));

  function toggleRole(roleId: string) {
    onChange(
      selectedRoleIds.includes(roleId)
        ? selectedRoleIds.filter((selectedRoleId) => selectedRoleId !== roleId)
        : [...selectedRoleIds, roleId],
    );
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.label}>
        Lorics
      </Text>
      <Pressable
        accessibilityLabel={`Lorics: ${selectedLorics.map((role) => role.name).join(', ') || 'None'}`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          triggerHeight ? { height: triggerHeight } : null,
          pressed && styles.optionPressed,
        ]}
      >
        <View
          onLayout={(event) =>
            onTriggerHeightChange?.(
              Math.ceil(event.nativeEvent.layout.height + PICKER_TRIGGER_CHROME_HEIGHT),
            )
          }
          style={styles.triggerText}
        >
          <Text selectable style={styles.triggerTitle}>
            {selectedLorics.length === 0
              ? 'No Lorics'
              : selectedLorics.map((role) => role.name).join(', ')}
          </Text>
          <Text selectable style={styles.triggerDescription}>
            {selectedLorics.length === 0
              ? 'Optional game rules'
              : `${selectedLorics.length} enabled`}
          </Text>
        </View>
        <ChevronDown color={colors.textMuted} size={18} strokeWidth={2.6} />
      </Pressable>

      <Modal animationType="slide" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Close Loric picker"
            accessibilityRole="button"
            onPress={() => setOpen(false)}
            style={styles.dismissArea}
          />
          <View style={styles.dialog}>
            <View style={styles.dialogHeader}>
              <View style={styles.dialogTitleGroup}>
                <Text selectable style={styles.dialogTitle}>
                  Select Lorics
                </Text>
                <Text selectable style={styles.dialogDescription}>
                  Enable optional Loric rules for this game.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close Loric picker"
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.optionPressed]}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.options}
              contentInsetAdjustmentBehavior="automatic"
            >
              {lorics.map((role) => {
                const selected = selectedRoleIds.includes(role.id);
                return (
                  <RoleReference
                    accessibilityLabel={`${selected ? 'Disable' : 'Enable'} ${role.name}`}
                    containerStyle={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                    contentStyle={styles.optionContent}
                    key={role.id}
                    leading={
                      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                        {selected ? (
                          <Check color={colors.onPrimary} size={14} strokeWidth={3} />
                        ) : null}
                      </View>
                    }
                    onPress={() => toggleRole(role.id)}
                    role={role}
                    textStyle={styles.optionText}
                  >
                    <Text selectable style={styles.optionDescription}>
                      {role.ability ?? 'No description available.'}
                    </Text>
                  </RoleReference>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: '#00000099', flex: 1, justifyContent: 'flex-end' },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 6,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  container: { gap: 8 },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  dialog: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    maxHeight: '82%',
    padding: 16,
  },
  dialogDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  dialogHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  dialogTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  dialogTitleGroup: { flex: 1, gap: 3 },
  dismissArea: { flex: 1 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionContent: { flex: 1 },
  optionDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  optionPressed: { backgroundColor: colors.surfacePressed },
  optionSelected: { borderColor: colors.primary },
  optionText: { color: colors.text, fontSize: 15, fontWeight: '800' },
  options: { gap: 8 },
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  triggerDescription: { color: colors.textMuted, fontSize: 12 },
  triggerText: { flex: 1, gap: 2 },
  triggerTitle: { color: colors.text, fontWeight: '800' },
});
