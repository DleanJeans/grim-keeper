import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

type RolePickerProps = {
  roles: Role[];
  selectedRoleIds: string[];
  onToggleRole: (roleId: string) => void;
};

export function RolePicker({ onToggleRole, roles, selectedRoleIds }: RolePickerProps) {
  const selectedRoleIdSet = new Set(selectedRoleIds);

  return (
    <View style={{ gap: 10 }}>
      <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>
        Select one or more roles. Save with no roles to clear this day’s entry.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {roles.map((role) => (
          <RoleChoiceButton
            key={role.id}
            role={role}
            selected={selectedRoleIdSet.has(role.id)}
            onPress={() => onToggleRole(role.id)}
          />
        ))}
      </View>
    </View>
  );
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
