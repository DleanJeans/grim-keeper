import { ChevronDown, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TravelerRoleOption } from '@/components/game/notes-tab/traveler-role-option';
import { RoleIcon } from '@/components/role-icon';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

type TravelerRolePickerProps = {
  description?: string;
  roles: Role[];
  selectedRoleIds: string[];
  scriptId?: string;
  onToggleRole: (roleId: string) => void;
};

export function TravelerRolePicker({
  description = 'Choose one traveler role to confirm for this player.',
  onToggleRole,
  roles,
  selectedRoleIds,
  scriptId,
}: TravelerRolePickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedTravelerRoleIds = selectedRoleIds.filter((roleId) =>
    roles.some((role) => role.id === roleId),
  );
  const selectedTravelerRole = roles.find((role) => selectedTravelerRoleIds.includes(role.id));
  const disabled = roles.length === 0;
  const filteredRoles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return roles;
    }

    return roles.filter(
      (role) =>
        role.name.toLocaleLowerCase().includes(normalizedQuery) ||
        role.id.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [roles, searchQuery]);
  const summary =
    roles.length === 0
      ? 'Traveler characters are unavailable offline'
      : selectedTravelerRole
        ? `${selectedTravelerRole.name} selected`
        : 'None selected';

  return (
    <View style={styles.container}>
      <Text selectable style={styles.label}>
        Traveler characters
      </Text>
      <Pressable
        accessibilityLabel={`Traveler characters: ${summary}`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setPickerOpen(true)}
        style={({ pressed }) => [
          styles.selector,
          disabled
            ? styles.selectorDisabled
            : pressed
              ? styles.selectorPressed
              : styles.selectorEnabled,
        ]}
      >
        <View style={styles.selectorContent}>
          <View style={styles.summaryRow}>
            {selectedTravelerRole ? <RoleIcon role={selectedTravelerRole} size={20} /> : null}
            <Text selectable style={[styles.summary, disabled && styles.disabledText]}>
              {summary}
            </Text>
          </View>
          <Text selectable style={[styles.selectorHint, disabled && styles.disabledText]}>
            Choose a traveler role for this player
          </Text>
        </View>
        <ChevronDown
          color={disabled ? colors.onDisabled : colors.textMuted}
          size={18}
          strokeWidth={2.6}
        />
      </Pressable>
      <Modal
        animationType="slide"
        onRequestClose={() => {
          setPickerOpen(false);
          setSearchQuery('');
        }}
        transparent
        visible={pickerOpen}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel="Close traveler character picker"
            accessibilityRole="button"
            onPress={() => setPickerOpen(false)}
            style={styles.backdropClose}
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text selectable style={styles.title}>
                Traveler roles
              </Text>
              <Pressable
                accessibilityLabel="Close traveler character picker"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  setPickerOpen(false);
                  setSearchQuery('');
                }}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            <View style={styles.search}>
              <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
              <TextInput
                accessibilityLabel="Search traveler characters"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setSearchQuery}
                placeholder="Search traveler characters"
                placeholderTextColor={colors.textSubtle}
                returnKeyType="search"
                style={styles.searchInput}
                value={searchQuery}
              />
            </View>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              contentInsetAdjustmentBehavior="automatic"
              showsVerticalScrollIndicator
              style={styles.scroll}
            >
              {filteredRoles.length > 0 ? (
                <>
                  <Text selectable style={styles.description}>
                    {description}
                  </Text>
                  <View style={styles.roleOptions}>
                    {filteredRoles.map((role) => (
                      <TravelerRoleOption
                        key={role.id}
                        onPress={() => onToggleRole(role.id)}
                        role={role}
                        scriptId={scriptId}
                        selected={selectedRoleIds.includes(role.id)}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <Text selectable style={styles.noResults}>
                  No traveler characters found.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdropClose: {
    flex: 1,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closeButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  container: {
    gap: 8,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  disabledText: {
    color: colors.onDisabled,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  noResults: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  overlay: {
    backgroundColor: '#00000099',
    flex: 1,
    justifyContent: 'flex-end',
  },
  roleOptions: {
    gap: 8,
  },
  search: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    minHeight: 46,
    paddingVertical: 10,
  },
  selector: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  selectorContent: {
    flex: 1,
    gap: 2,
  },
  selectorDisabled: {
    backgroundColor: colors.disabled,
    opacity: 0.72,
  },
  selectorEnabled: {
    backgroundColor: colors.surface,
  },
  selectorHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
  selectorPressed: {
    backgroundColor: colors.surfacePressed,
  },
  sheet: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    maxHeight: '82%',
    padding: 16,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 4,
  },
  summary: {
    color: colors.text,
    fontWeight: '800',
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
});
