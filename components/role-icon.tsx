import { Image, View } from 'react-native';

import type { Role } from '@/types/game';
import { getRoleIconUrl } from '@/utils/role-utils';

export function RoleIcon({ role, size = 24 }: { role: Role; size?: number }) {
  if (role.iconColor) {
    return (
      <View
        style={{
          backgroundColor: role.iconColor,
          borderRadius: size / 2,
          height: size,
          width: size,
        }}
      />
    );
  }

  return (
    <Image
      accessible={false}
      resizeMode="cover"
      source={{ uri: getRoleIconUrl(role) }}
      style={{ borderRadius: size / 2, height: size, width: size }}
    />
  );
}
