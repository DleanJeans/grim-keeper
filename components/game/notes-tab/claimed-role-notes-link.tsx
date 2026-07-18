import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

type ClaimedRoleNotesLinkProps = {
  count: number;
  role: Role;
  scriptId?: string;
};

export function ClaimedRoleNotesLink({ count, role, scriptId }: ClaimedRoleNotesLinkProps) {
  return (
    <Pressable
      accessibilityHint="Opens notes for this role"
      accessibilityLabel={`${role.name}, ${count} ${count === 1 ? 'note' : 'notes'}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/role-notes',
          params: scriptId ? { roleId: role.id, scriptId } : { roleId: role.id },
        })
      }
      style={({ pressed }) => [styles.link, { opacity: pressed ? 0.65 : 1 }]}
    >
      <RoleIcon role={role} size={32} />
      <Text selectable style={styles.label}>
        {count} {count === 1 ? 'note' : 'notes'} for {role.name}
      </Text>
      <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '700' },
  link: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
