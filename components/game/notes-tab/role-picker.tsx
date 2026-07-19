import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

type RolePickerProps = {
  description?: string;
  roles: Role[];
  roleOwnerNames?: Record<string, string[]>;
  sectioned?: boolean;
  selectedFirst?: boolean;
  selectedRoleIds: string[];
  onToggleRole: (roleId: string) => void;
};

export function RolePicker({
  description = 'Select one or more roles. Save with no roles to clear this day’s entry.',
  onToggleRole,
  roles,
  roleOwnerNames,
  sectioned = false,
  selectedFirst = false,
  selectedRoleIds,
}: RolePickerProps) {
  const selectedRoleIdSet = new Set(selectedRoleIds);
  const orderedRoles = selectedFirst
    ? [
        ...roles.filter((role) => selectedRoleIdSet.has(role.id)),
        ...roles.filter((role) => !selectedRoleIdSet.has(role.id)),
      ]
    : roles;
  const roleSections =
    sectioned && !selectedFirst
      ? getRoleSections(orderedRoles)
      : [{ label: undefined, roles: orderedRoles }];

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
                ownerNames={roleOwnerNames?.[role.id]}
                selected={selectedRoleIdSet.has(role.id)}
                animated={selectedFirst}
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
      roles: roles
        .filter((role) => role.team?.toLocaleLowerCase() === team)
        .sort(
          (left, right) =>
            Number(right.id.startsWith('generic_')) - Number(left.id.startsWith('generic_')),
        ),
    }))
    .filter(({ roles: sectionRoles }) => sectionRoles.length > 0);
  const knownTeams = new Set(['townsfolk', 'outsider', 'minion', 'demon']);
  const otherRoles = roles.filter((role) => !knownTeams.has(role.team?.toLocaleLowerCase() ?? ''));

  return otherRoles.length > 0 ? [...sections, { label: 'Traveler', roles: otherRoles }] : sections;
}

function RoleChoiceButton({
  animated,
  onPress,
  ownerNames,
  role,
  selected,
}: {
  animated: boolean;
  onPress: () => void;
  ownerNames?: string[];
  role: Role;
  selected: boolean;
}) {
  return (
    <Animated.View layout={animated ? LinearTransition.duration(220) : undefined}>
      <RoleReference
        accessibilityLabel={`${selected ? 'Remove' : 'Select'} ${role.name}${ownerNames?.length ? `. Claimed or confirmed by ${ownerNames.join(', ')}` : ''}`}
        contentStyle={{ maxWidth: 180 }}
        leading={selected ? <Check color={colors.primary} size={14} strokeWidth={3} /> : null}
        onPress={onPress}
        role={role}
        containerStyle={({ pressed }) => ({
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
        textStyle={{
          color: selected ? colors.text : colors.textMuted,
          fontSize: 13,
          fontWeight: selected ? '800' : '600',
        }}
      >
        {ownerNames?.length ? (
          <Text
            selectable
            style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', lineHeight: 14 }}
          >
            {ownerNames.join(', ')}
          </Text>
        ) : null}
      </RoleReference>
    </Animated.View>
  );
}
