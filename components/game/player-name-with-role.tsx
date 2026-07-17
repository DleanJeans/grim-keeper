import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { useOptionalGameRouteContext } from '@/components/game/game-route-context';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Player } from '@/types/game';
import { getRoleDisplayForDayOrPrevious } from '@/utils/role-utils';

type PlayerNameWithRoleProps = {
  bordered?: boolean;
  game?: Game;
  day?: number;
  player: Player;
  roleIconSize?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  showRoles?: boolean;
};

export function PlayerNameWithRole({
  bordered = false,
  day,
  game: providedGame,
  player,
  roleIconSize = 24,
  style,
  textStyle,
  showRoles: providedShowRoles,
}: PlayerNameWithRoleProps) {
  const gameRoute = useOptionalGameRouteContext();
  const activeDay = day ?? gameRoute?.activeDay ?? providedGame?.activeDay ?? 0;
  const game = providedGame ?? gameRoute?.game;
  const showRoles = providedShowRoles ?? gameRoute?.showRoles ?? false;
  const script = game?.script;
  const role =
    showRoles && script
      ? getRoleDisplayForDayOrPrevious(player.roleAssignments, activeDay, script.roles).roles[0]
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
