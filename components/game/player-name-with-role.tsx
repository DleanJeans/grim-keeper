import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';
import { getRoleDisplayForDayOrPrevious } from '@/utils/role-utils';

type PlayerNameWithRoleProps = {
  bordered?: boolean;
  player: Player;
  roleIconSize?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function PlayerNameWithRole({
  bordered = false,
  player,
  roleIconSize = 24,
  style,
  textStyle,
}: PlayerNameWithRoleProps) {
  const { activeDay, game, showRoles } = useGameRouteContext();
  const role =
    showRoles && game.script
      ? getRoleDisplayForDayOrPrevious(player.roleAssignments, activeDay, game.script.roles)
          .roles[0]
      : undefined;

  return (
    <View
      style={[
        {
          alignItems: 'center',
          backgroundColor: bordered ? colors.surfaceRaised : undefined,
          borderColor: bordered ? colors.borderStrong : undefined,
          borderRadius: bordered ? 999 : undefined,
          borderWidth: bordered ? 1 : undefined,
          flexDirection: 'row',
          flexShrink: 1,
          gap: 0,
          minWidth: 0,
          paddingHorizontal: bordered ? 8 : undefined,
          paddingVertical: bordered ? 3 : undefined,
        },
        style,
      ]}
    >
      {role ? <RoleIcon role={role} size={roleIconSize} /> : null}
      <Text selectable style={textStyle}>
        {player.name}
      </Text>
    </View>
  );
}
