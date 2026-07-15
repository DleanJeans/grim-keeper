import { View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

export function ScriptRoleList({ roleCatalog, roles }: { roleCatalog: Role[]; roles: Role[] }) {
  return (
    <View style={{ gap: 10 }}>
      {roles.map((role) => (
        <ScriptRoleDetail
          key={role.id}
          role={role}
          description={
            role.ability ?? roleCatalog.find((catalogRole) => catalogRole.id === role.id)?.ability
          }
        />
      ))}
    </View>
  );
}

function ScriptRoleDetail({ description, role }: { description?: string; role: Role }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 10,
        padding: 12,
      }}
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
      </View>
      <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
        {description ?? 'No description available.'}
      </Text>
    </View>
  );
}
