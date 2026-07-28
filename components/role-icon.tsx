import { StyleSheet, View } from 'react-native';
import Svg, { Defs, FeColorMatrix, Filter, Image } from 'react-native-svg';

import { useRoleIconSource } from '@/hooks/use-role-icon-source';
import type { Role } from '@/types/game';

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
  const overflow = (scaledSize - size) / 2;
  const source = useRoleIconSource(role);

  return (
    <View style={{ height: size, width: size }}>
      <Svg
        height={scaledSize}
        style={[
          styles.svg,
          { height: scaledSize, left: -overflow, top: -overflow, width: scaledSize },
        ]}
        viewBox={`0 0 ${scaledSize} ${scaledSize}`}
        width={scaledSize}
      >
        <Defs>
          <Filter id="removeNearWhite">
            <FeColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1 -1 -1 2.7 0" />
          </Filter>
        </Defs>
        <Image
          filter="url(#removeNearWhite)"
          height={scaledSize}
          href={source}
          preserveAspectRatio="xMidYMid slice"
          width={scaledSize}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
  },
});
