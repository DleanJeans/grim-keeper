import { Check } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

export function TravelerRoleOption({
  onPress,
  role,
  scriptId,
  selected,
}: {
  onPress: () => void;
  role: Role;
  scriptId?: string;
  selected: boolean;
}) {
  return (
    <RoleReference
      accessibilityLabel={`${selected ? 'Remove' : 'Select'} ${role.name}`}
      containerStyle={({ pressed }) => [
        styles.container,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
      contentStyle={styles.content}
      iconSize={32}
      leading={selected ? <Check color={colors.primary} size={16} strokeWidth={3} /> : null}
      onPress={onPress}
      role={role}
      scriptId={scriptId}
      textStyle={[styles.name, selected && styles.selectedName]}
    >
      <Text selectable style={styles.description}>
        {role.ability ?? 'No description available.'}
      </Text>
    </RoleReference>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: '100%',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
    opacity: 0.65,
  },
  selected: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.primary,
  },
  selectedName: {
    color: colors.primary,
  },
});
