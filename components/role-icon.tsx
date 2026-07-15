import { Image } from 'react-native';

import type { Role } from '@/types/game';
import { getRoleIconUrl } from '@/utils/role-utils';

export function RoleIcon({ role, size = 24 }: { role: Role; size?: number }) {
  return (
    <Image
      accessible={false}
      resizeMode="cover"
      source={{ uri: getRoleIconUrl(role) }}
      style={{ borderRadius: size / 2, height: size, width: size }}
    />
  );
}
