import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import type { Player } from '@/types/game';
import { getRoleDisplayForDayOrPrevious } from '@/utils/role-utils';

type PlayerNameWithRoleProps = {
  player: Player;
  roleIconSize?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function PlayerNameWithRole({
  player,
  roleIconSize = 16,
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
          flexDirection: 'row',
          flexShrink: 1,
          gap: 4,
          minWidth: 0,
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
