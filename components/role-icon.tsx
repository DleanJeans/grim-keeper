import Svg, { Defs, FeColorMatrix, Filter, Image } from 'react-native-svg';

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
  const scaledSize = size * scale;

  return (
    <Svg height={scaledSize} viewBox={`0 0 ${scaledSize} ${scaledSize}`} width={scaledSize}>
      <Defs>
        <Filter id="removeNearWhite">
          <FeColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1 -1 -1 2.7 0" />
        </Filter>
      </Defs>
      <Image
        filter="url(#removeNearWhite)"
        height={scaledSize}
        href={{ uri: getRoleIconUrl(role) }}
        preserveAspectRatio="xMidYMid slice"
        width={scaledSize}
      />
    </Svg>
  );
}
