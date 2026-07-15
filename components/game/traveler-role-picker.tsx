import { ChevronDown, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { RolePicker } from '@/components/game/role-picker';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

type TravelerRolePickerProps = {
  roles: Role[];
  selectedRoleIds: string[];
  selectedScriptName?: string;
  onToggleRole: (roleId: string) => void;
};

export function TravelerRolePicker({
  onToggleRole,
  roles,
  selectedRoleIds,
  selectedScriptName,
}: TravelerRolePickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const disabled = !selectedScriptName || roles.length === 0;
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
  const summary = !selectedScriptName
    ? 'Select a game script first'
    : roles.length === 0
      ? 'Traveler characters are unavailable offline'
      : selectedRoleIds.length > 0
        ? `${selectedRoleIds.length} selected`
        : 'None selected';

  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
        Traveler characters
      </Text>
      <Pressable
        accessibilityLabel={`Traveler characters: ${summary}`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setPickerOpen(true)}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: disabled
            ? colors.disabled
            : pressed
              ? colors.surfacePressed
              : colors.surface,
          borderColor: colors.border,
          borderRadius: 8,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 10,
          opacity: disabled ? 0.72 : 1,
          paddingHorizontal: 12,
          paddingVertical: 11,
        })}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            selectable
            style={{ color: disabled ? colors.onDisabled : colors.text, fontWeight: '800' }}
          >
            {summary}
          </Text>
          <Text
            selectable
            style={{ color: disabled ? colors.onDisabled : colors.textMuted, fontSize: 12 }}
          >
            {selectedScriptName
              ? `Add travelers to ${selectedScriptName}`
              : 'Choose a script first'}
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
        <View style={{ backgroundColor: '#00000099', flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            accessibilityLabel="Close traveler character picker"
            accessibilityRole="button"
            onPress={() => setPickerOpen(false)}
            style={{ flex: 1 }}
          />
          <View
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderRadius: 16,
              borderWidth: 1,
              gap: 12,
              maxHeight: '82%',
              padding: 16,
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
              <Text
                selectable
                style={{ color: colors.text, flex: 1, fontSize: 18, fontWeight: '900' }}
              >
                Traveler characters
              </Text>
              <Pressable
                accessibilityLabel="Close traveler character picker"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  setPickerOpen(false);
                  setSearchQuery('');
                }}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: pressed ? colors.surfacePressed : colors.surfaceRaised,
                  borderRadius: 8,
                  height: 32,
                  justifyContent: 'center',
                  width: 32,
                })}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: 8,
                borderWidth: 1,
                flexDirection: 'row',
                gap: 8,
                paddingHorizontal: 12,
              }}
            >
              <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
              <TextInput
                accessibilityLabel="Search traveler characters"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setSearchQuery}
                placeholder="Search traveler characters"
                placeholderTextColor={colors.textSubtle}
                returnKeyType="search"
                style={{
                  color: colors.text,
                  flex: 1,
                  minHeight: 46,
                  paddingVertical: 10,
                }}
                value={searchQuery}
              />
            </View>
            <ScrollView
              contentContainerStyle={{ paddingBottom: 4 }}
              contentInsetAdjustmentBehavior="automatic"
              showsVerticalScrollIndicator
              style={{ flexGrow: 0, flexShrink: 1 }}
            >
              {filteredRoles.length > 0 ? (
                <RolePicker
                  description="Choose traveler characters to include in this game's script."
                  onToggleRole={onToggleRole}
                  roles={filteredRoles}
                  selectedRoleIds={selectedRoleIds}
                />
              ) : (
                <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
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
