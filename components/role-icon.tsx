import { StyleSheet, View } from 'react-native';
import Svg, { Defs, FeColorMatrix, Filter, Image } from 'react-native-svg';

import { useRoleIconSource } from '@/hooks/use-role-icon-source';
import type { Role } from '@/types/game';

// Drops near-white pixels; the red variant also hue-rotates by 150deg so blue icons read as evil.
const REMOVE_NEAR_WHITE = '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1 -1 -1 2.7 0';
const REMOVE_NEAR_WHITE_RED =
  '-0.575 0.977 0.598 0 0 0.469 0.538 -0.007 0 0 0.004 1.692 -0.696 0 0 -1 -1 -1 2.7 0';

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
  // Separate ids: on web every icon's filter shares one document namespace.
  const filterId = role.redTint ? 'removeNearWhiteRed' : 'removeNearWhite';

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
          <Filter id={filterId}>
            <FeColorMatrix
              type="matrix"
              values={role.redTint ? REMOVE_NEAR_WHITE_RED : REMOVE_NEAR_WHITE}
            />
          </Filter>
        </Defs>
        <Image
          filter={`url(#${filterId})`}
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
