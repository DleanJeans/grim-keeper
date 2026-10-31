import { StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { colors } from '@/theme/colors';
import type { PlayerPosition, Role } from '@/types/game';

const BORDER_WIDTH = 1.5;

/** Small character token on the map for a character named in the focused player's info. */
export function RoleInfoMapToken({
  position,
  role,
  size,
}: {
  /** Center of the token on the map. */
  position: PlayerPosition;
  role: Role;
  size: number;
}) {
  return (
    <View
      accessibilityLabel={role.name}
      style={[
        styles.token,
        {
          borderRadius: size / 2,
          height: size,
          left: position.x - size / 2,
          top: position.y - size / 2,
          width: size,
        },
      ]}
    >
      <RoleIcon role={role} scale={1.25} size={size - BORDER_WIDTH * 2} />
    </View>
  );
}

const styles = StyleSheet.create({
  token: {
    alignItems: 'center',
    backgroundColor: colors.roleInfoTokenBackground,
    borderColor: colors.roleInfoTokenFilledBorder,
    borderWidth: BORDER_WIDTH,
    justifyContent: 'center',
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    // Above the player tokens, which sit at zIndex 2.
    zIndex: 3,
  },
});
