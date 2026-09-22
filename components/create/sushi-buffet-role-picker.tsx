import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { RoleReference } from '@/components/role-reference';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { SUSHI_BUFFET_SCRIPT_ID } from '@/utils/script-constants';

type SushiBuffetRolePickerProps = {
  onChange: (roleIds: string[]) => void;
  roles: Role[];
  selectedRoleIds: string[];
};

export function SushiBuffetRolePicker({
  onChange,
  roles,
  selectedRoleIds,
}: SushiBuffetRolePickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedRoleIdSet = useMemo(() => new Set(selectedRoleIds), [selectedRoleIds]);
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const visibleRoles = normalizedQuery
    ? roles.filter(
        (role) =>
          role.name.toLocaleLowerCase().includes(normalizedQuery) ||
          role.id.toLocaleLowerCase().includes(normalizedQuery),
      )
    : roles;
  const enabledRoleCount = roles.filter((role) => selectedRoleIdSet.has(role.id)).length;
  const summary =
    roles.length === 0
      ? 'No roles available'
      : enabledRoleCount === roles.length
        ? 'All roles enabled'
        : `${enabledRoleCount} of ${roles.length} roles enabled`;

  function closePicker() {
    setOpen(false);
    setSearchQuery('');
  }

  function toggleRole(roleId: string) {
    onChange(
      selectedRoleIdSet.has(roleId)
        ? selectedRoleIds.filter((selectedRoleId) => selectedRoleId !== roleId)
        : [...selectedRoleIds, roleId],
    );
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.label}>
        Sushi Buffet roles
      </Text>
      <Pressable
        accessibilityLabel={`Sushi Buffet roles: ${summary}`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <View style={styles.triggerText}>
          <Text selectable style={styles.triggerTitle}>
            {summary}
          </Text>
          <Text selectable style={styles.triggerDescription}>
            Choose which roles can be searched in this game
          </Text>
        </View>
        <ChevronDown color={colors.textMuted} size={18} strokeWidth={2.6} />
      </Pressable>

      <Modal animationType="slide" onRequestClose={closePicker} transparent visible={open}>
        <KeyboardAvoidingView
          behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
          style={styles.backdrop}
        >
          <Pressable
            accessibilityLabel="Close Sushi Buffet role picker"
            accessibilityRole="button"
            onPress={closePicker}
            style={styles.dismissArea}
          />
          <View style={styles.dialog}>
            <View style={styles.dialogHeader}>
              <View style={styles.dialogTitleGroup}>
                <Text selectable style={styles.dialogTitle}>
                  Sushi Buffet roles
                </Text>
                <Text selectable style={styles.dialogDescription}>
                  Toggle roles on or off. Searching during the game only shows enabled roles.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close Sushi Buffet role picker"
                accessibilityRole="button"
                hitSlop={8}
                onPress={closePicker}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            <View style={styles.searchInputContainer}>
              <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
              <TextInput
                accessibilityLabel="Search Sushi Buffet roles to enable"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setSearchQuery}
                placeholder="Search roles"
                placeholderTextColor={colors.textSubtle}
                returnKeyType="search"
                style={styles.searchInput}
                value={searchQuery}
              />
            </View>
            <ScrollView
              contentContainerStyle={styles.options}
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              style={styles.scroll}
            >
              {visibleRoles.length > 0 ? (
                visibleRoles.map((role) => {
                  const selected = selectedRoleIdSet.has(role.id);

                  return (
                    <RoleReference
                      accessibilityLabel={`${selected ? 'Disable' : 'Enable'} ${role.name}`}
                      containerStyle={({ pressed }) => [
                        styles.option,
                        selected && styles.optionSelected,
                        pressed && styles.pressed,
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
                      scriptId={SUSHI_BUFFET_SCRIPT_ID}
                      textStyle={styles.optionText}
                    >
                      <Text selectable style={styles.optionDescription}>
                        {role.ability ?? 'No description available.'}
                      </Text>
                    </RoleReference>
                  );
                })
              ) : (
                <Text selectable style={styles.noResults}>
                  {roles.length === 0 ? 'No roles are available.' : 'No matching roles.'}
                </Text>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: '#00000099',
    flex: 1,
    justifyContent: 'flex-end',
  },
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
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  container: {
    gap: 8,
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
  dialogDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  dialogHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  dialogTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  dialogTitleGroup: {
    flex: 1,
    gap: 3,
  },
  dismissArea: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  noResults: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionContent: {
    flex: 1,
  },
  optionDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  optionSelected: {
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  options: {
    gap: 8,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 2,
    paddingVertical: 9,
  },
  searchInputContainer: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
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
  triggerDescription: {
    color: colors.textMuted,
    fontSize: 12,
  },
  triggerText: {
    flex: 1,
    gap: 2,
  },
  triggerTitle: {
    color: colors.text,
    fontWeight: '800',
  },
});
