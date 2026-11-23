import { StyleSheet, View } from 'react-native';
import { TravelerRoleAlignmentButton } from '@/components/game/notes-tab/traveler-role-alignment-button';
import { TravelerRoleOption } from '@/components/game/notes-tab/traveler-role-option';
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
      <Text selectable style={styles.description}>
        {roles.length === 0 ? 'Traveller characters are unavailable offline' : description}
      </Text>
      <View style={styles.roleOptions}>
        {roles.map((role) => (
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
