import { Pressable, StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { getTravelerClaimRoles } from '@/utils/role-utils';

type TravelerRoleAlignmentButtonProps = {
  onSelect: (roleId: string) => void;
  role: Role;
  selectedRoleId?: string;
};

export function TravelerRoleAlignmentButton({
  onSelect,
  role,
  selectedRoleId,
}: TravelerRoleAlignmentButtonProps) {
  const [goodRole, evilRole] = getTravelerClaimRoles(role);

  return (
    <View accessibilityLabel={`Alignment for ${role.name}`} accessibilityRole="radiogroup">
      <View style={styles.options}>
        <TravelerRoleAlignmentOption
          label="Good"
          onPress={() => onSelect(goodRole.id)}
          role={goodRole}
          selected={selectedRoleId === goodRole.id}
        />
        <TravelerRoleAlignmentOption
          label="Evil"
          onPress={() => onSelect(evilRole.id)}
          role={evilRole}
          selected={selectedRoleId === evilRole.id}
        />
      </View>
    </View>
  );
}

function TravelerRoleAlignmentOption({
  label,
  onPress,
  role,
  selected,
}: {
  label: 'Good' | 'Evil';
  onPress: () => void;
  role: Role;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`Select ${label} ${role.name.replace(/^(Good|Evil) /, '')}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      disabled={selected}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        selected ? styles.selected : styles.idle,
        pressed && styles.pressed,
      ]}
    >
      <RoleIcon role={role} size={28} />
      <Text selectable style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  idle: {
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  selected: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.primary,
  },
  selectedLabel: {
    color: colors.text,
  },
});
