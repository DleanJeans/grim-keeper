import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

type RolePickerProps = {
  description?: string;
  roles: Role[];
  sectioned?: boolean;
  selectedRoleIds: string[];
  onToggleRole: (roleId: string) => void;
};

export function RolePicker({
  description = 'Select one or more roles. Save with no roles to clear this day’s entry.',
  onToggleRole,
  roles,
  sectioned = false,
  selectedRoleIds,
}: RolePickerProps) {
  const selectedRoleIdSet = new Set(selectedRoleIds);
  const roleSections = sectioned ? getRoleSections(roles) : [{ label: undefined, roles }];

  return (
    <View style={{ gap: 10 }}>
      <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>
        {description}
      </Text>
      {roleSections.map(({ label, roles: sectionRoles }) => (
        <View key={label ?? 'all-roles'} style={{ gap: 8 }}>
          {label ? (
            <Text
              selectable
              style={{
                color: colors.textMuted,
                fontSize: 12,
                fontWeight: '900',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {label}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {sectionRoles.map((role) => (
              <RoleChoiceButton
                key={role.id}
                role={role}
                selected={selectedRoleIdSet.has(role.id)}
                onPress={() => onToggleRole(role.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function getRoleSections(roles: Role[]) {
  const sections = [
    { label: 'Townsfolk', team: 'townsfolk' },
    { label: 'Outsider', team: 'outsider' },
    { label: 'Minion', team: 'minion' },
    { label: 'Demon', team: 'demon' },
  ]
    .map(({ label, team }) => ({
      label,
      roles: roles.filter((role) => role.team?.toLocaleLowerCase() === team),
    }))
    .filter(({ roles: sectionRoles }) => sectionRoles.length > 0);
  const knownTeams = new Set(['townsfolk', 'outsider', 'minion', 'demon']);
  const otherRoles = roles.filter((role) => !knownTeams.has(role.team?.toLocaleLowerCase() ?? ''));

  return otherRoles.length > 0 ? [...sections, { label: 'Traveler', roles: otherRoles }] : sections;
}

function RoleChoiceButton({
  onPress,
  role,
  selected,
}: {
  onPress: () => void;
  role: Role;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`${selected ? 'Remove' : 'Select'} ${role.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed
          ? colors.surfacePressed
          : selected
            ? colors.surfaceRaised
            : colors.surface,
        borderColor: selected ? colors.primary : colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 9,
      })}
    >
      {selected ? <Check color={colors.primary} size={14} strokeWidth={3} /> : null}
      <RoleIcon role={role} size={24} />
      <Text
        selectable
        style={{
          color: selected ? colors.text : colors.textMuted,
          fontSize: 13,
          fontWeight: selected ? '800' : '600',
        }}
      >
        {role.name}
      </Text>
    </Pressable>
  );
}
