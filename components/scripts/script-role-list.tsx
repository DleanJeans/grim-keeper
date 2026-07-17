import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

export function ScriptRoleList({
  roleCatalog,
  roles,
  scriptId,
}: {
  roleCatalog: Role[];
  roles: Role[];
  scriptId: string;
}) {
  return (
    <View style={{ gap: 10 }}>
      {roles.map((role) => {
        const catalogRole = roleCatalog.find((candidate) => candidate.id === role.id);
        const displayRole = {
          ...role,
          notes: [...new Set([...(role.notes ?? []), ...(catalogRole?.notes ?? [])])],
        };

        return (
          <ScriptRoleDetail
            key={role.id}
            role={displayRole}
            description={role.ability ?? catalogRole?.ability}
            onPress={() =>
              router.push({ pathname: '/role-notes', params: { roleId: role.id, scriptId } })
            }
          />
        );
      })}
    </View>
  );
}

function ScriptRoleDetail({
  description,
  onPress,
  role,
}: {
  description?: string;
  onPress: () => void;
  role: Role;
}) {
  return (
    <Pressable
      accessibilityHint="Opens notes for this role"
      accessibilityLabel={`${role.name} notes`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 10,
        opacity: pressed ? 0.65 : 1,
        padding: 12,
      })}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
        <RoleIcon role={role} size={42} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
            {role.name}
          </Text>
          {role.team ? (
            <Text
              selectable
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {role.team}
            </Text>
          ) : null}
        </View>
        <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
      </View>
      <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
        {description ?? 'No description available.'}
      </Text>
    </Pressable>
  );
}
