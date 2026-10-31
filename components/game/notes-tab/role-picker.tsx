import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

type RolePickerProps = {
  description?: string;
  roles: Role[];
  roleOwnerNames?: Record<string, string[]>;
  sections?: Array<{ label: string; roles: Role[] }>;
  sectioned?: boolean;
  selectedFirst?: boolean;
  selectedRoleIds: string[];
  scriptId?: string;
  onToggleRole: (roleId: string) => void;
};

export function RolePicker({
  description = 'Select one or more roles. Save with no roles to clear this day’s entry.',
  onToggleRole,
  roles,
  roleOwnerNames,
  sections,
  sectioned = false,
  selectedFirst = false,
  selectedRoleIds,
  scriptId,
}: RolePickerProps) {
  const selectedRoleIdSet = new Set(selectedRoleIds);
  const orderedRoles = selectedFirst
    ? [
        ...roles.filter((role) => selectedRoleIdSet.has(role.id)),
        ...roles.filter((role) => !selectedRoleIdSet.has(role.id)),
      ]
    : roles;
  const roleSections = sections
    ? sections.filter(({ roles: sectionRoles }) => sectionRoles.length > 0)
    : sectioned && !selectedFirst
      ? getRoleSections(orderedRoles)
      : [{ label: undefined, roles: orderedRoles }];

  return (
    <View style={styles.container}>
      <Text selectable style={styles.description}>
        {description}
      </Text>
      {roleSections.map(({ label, roles: sectionRoles }) => (
        <View key={label ?? 'all-roles'} style={styles.section}>
          {label ? (
            <Text selectable style={styles.sectionLabel}>
              {label}
            </Text>
          ) : null}
          <View style={styles.roles}>
            {sectionRoles.map((role) => (
              <RoleChoiceButton
                key={role.id}
                role={role}
                ownerNames={roleOwnerNames?.[role.id]}
                selected={selectedRoleIdSet.has(role.id)}
                animated={selectedFirst}
                onPress={() => onToggleRole(role.id)}
                scriptId={scriptId}
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

  return otherRoles.length > 0
    ? [...sections, { label: 'Traveller', roles: otherRoles }]
    : sections;
}

function RoleChoiceButton({
  animated,
  onPress,
  ownerNames,
  role,
  selected,
  scriptId,
}: {
  animated: boolean;
  onPress: () => void;
  ownerNames?: string[];
  role: Role;
  selected: boolean;
  scriptId?: string;
}) {
  return (
    <Animated.View layout={animated ? LinearTransition.duration(220) : undefined}>
      <RoleReference
        accessibilityLabel={`${selected ? 'Remove' : 'Select'} ${role.name}${ownerNames?.length ? `. Claimed or confirmed by ${ownerNames.join(', ')}` : ''}`}
        contentStyle={styles.choiceContent}
        leading={selected ? <Check color={colors.primary} size={14} strokeWidth={3} /> : null}
        onPress={onPress}
        role={role}
        scriptId={scriptId}
        containerStyle={({ pressed }) => [
          styles.choice,
          selected && styles.choiceSelected,
          pressed && styles.choicePressed,
        ]}
        textStyle={[styles.choiceText, selected && styles.choiceTextSelected]}
      >
        {ownerNames?.length ? (
          <Text selectable style={styles.ownerNames}>
            {ownerNames.join(', ')}
          </Text>
        ) : null}
      </RoleReference>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  choice: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    paddingHorizontal: 10,
  },
  choiceContent: {
    maxWidth: 180,
  },
  choicePressed: {
    backgroundColor: colors.surfacePressed,
  },
  choiceSelected: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.primary,
  },
  choiceText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  choiceTextSelected: {
    color: colors.text,
    fontWeight: '800',
  },
  container: {
    gap: 10,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  ownerNames: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  roles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
