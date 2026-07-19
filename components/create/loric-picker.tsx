import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

type LoricPickerProps = {
  lorics: Role[];
  onChange: (roleIds: string[]) => void;
  selectedRoleIds: string[];
};

export function LoricPicker({ lorics, onChange, selectedRoleIds }: LoricPickerProps) {
  if (lorics.length === 0) {
    return null;
  }

  function toggleRole(roleId: string) {
    onChange(
      selectedRoleIds.includes(roleId)
        ? selectedRoleIds.filter((selectedRoleId) => selectedRoleId !== roleId)
        : [...selectedRoleIds, roleId],
    );
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.label}>
        Lorics
      </Text>
      <View style={styles.options}>
        {lorics.map((role) => {
          const selected = selectedRoleIds.includes(role.id);
          return (
            <RoleReference
              accessibilityLabel={`${selected ? 'Disable' : 'Enable'} ${role.name}`}
              containerStyle={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
              contentStyle={styles.optionContent}
              key={role.id}
              leading={
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected ? <Check color={colors.onPrimary} size={14} strokeWidth={3} /> : null}
                </View>
              }
              onPress={() => toggleRole(role.id)}
              role={role}
              textStyle={styles.optionText}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  container: { gap: 8 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionContent: { flex: 1 },
  optionPressed: { backgroundColor: colors.surfacePressed },
  optionSelected: { borderColor: colors.primary },
  optionText: { color: colors.text, fontSize: 15, fontWeight: '800' },
  options: { gap: 8 },
});
