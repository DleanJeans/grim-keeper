import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TravelerRoleAlignmentButton } from '@/components/game/notes-tab/traveler-role-alignment-button';
import { TravelerRoleOption } from '@/components/game/notes-tab/traveler-role-option';
import { SearchBox } from '@/components/search-box';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { getTravelerClaimRoles } from '@/utils/role-utils';

type TravelerRolePickerProps = {
  description?: string;
  roles: Role[];
  selectedRoleIds: string[];
  scriptId?: string;
  onToggleRole: (roleId: string, keepOpen?: boolean) => void;
};

export function TravelerRolePicker({
  description = 'Choose one traveller role to confirm for this player.',
  onToggleRole,
  roles,
  selectedRoleIds,
  scriptId,
}: TravelerRolePickerProps) {
  const selectedTravelerRole = roles.find((role) =>
    selectedRoleIds.some((roleId) => isTravelerRoleSelection(role, roleId)),
  );
  const selectedTravelerRoleId = selectedTravelerRole
    ? selectedRoleIds.find((roleId) => isTravelerRoleSelection(selectedTravelerRole, roleId))
    : undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return query
      ? roles.filter(
          (role) =>
            role.name.toLocaleLowerCase().includes(query) ||
            role.id.toLocaleLowerCase().includes(query),
        )
      : roles;
  }, [roles, searchQuery]);

  return (
    <View style={styles.container}>
      {selectedTravelerRole ? (
        <TravelerRoleAlignmentButton
          key={selectedTravelerRole.id}
          onSelect={(roleId) => onToggleRole(roleId, true)}
          role={selectedTravelerRole}
          selectedRoleId={selectedTravelerRoleId}
        />
      ) : null}
      <SearchBox
        label="Search traveller characters"
        onChangeText={setSearchQuery}
        value={searchQuery}
      />
      <Text selectable style={styles.description}>
        {roles.length === 0
          ? 'Traveller characters are unavailable offline'
          : filteredRoles.length === 0
            ? 'No traveller characters found.'
            : description}
      </Text>
      <View style={styles.roleOptions}>
        {filteredRoles.map((role) => (
          <TravelerRoleOption
            key={role.id}
            onPress={() =>
              onToggleRole(
                selectedTravelerRole?.id === role.id
                  ? (selectedTravelerRoleId ?? role.id)
                  : role.id,
              )
            }
            role={role}
            scriptId={scriptId}
            selected={selectedTravelerRole?.id === role.id}
          />
        ))}
      </View>
    </View>
  );
}

function isTravelerRoleSelection(role: Role, selectedRoleId: string) {
  return (
    role.id === selectedRoleId ||
    getTravelerClaimRoles(role).some(({ id }) => id === selectedRoleId)
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  roleOptions: {
    gap: 8,
  },
});
