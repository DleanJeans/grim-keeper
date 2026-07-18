import { CircleHelp } from 'lucide-react-native';
import { Image } from 'react-native';

import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { getRoleIconUrl } from '@/utils/role-utils';

export function RoleIcon({
  role,
  size = 24,
  scale = 1.35,
}: {
  role: Role;
  size?: number;
  scale?: number;
}) {
  if (role.id === 'generic_unknown') {
    return <CircleHelp color={colors.textMuted} size={size} strokeWidth={2.4} />;
  }

  return (
    <Image
      accessible={false}
      resizeMode="cover"
      source={{ uri: getRoleIconUrl(role) }}
      style={{ borderRadius: size / 2, height: size, transform: [{ scale }], width: size }}
    />
  );
}
