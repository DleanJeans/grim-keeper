import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { useOptionalGameRouteContext } from '@/components/game/game-route-context';
import {
  NOTE_REFERENCE_ICON_SCALE,
  NOTE_REFERENCE_ICON_SIZE,
  noteReferenceStyles,
} from '@/components/note-reference-styles';
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
  roleIconScale?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  showRoles?: boolean;
  variant?: 'default' | 'note';
};

export function PlayerNameWithRole({
  bordered = false,
  day,
  game: providedGame,
  player,
  roleIconSize,
  roleIconScale,
  style,
  textStyle,
  showRoles: providedShowRoles,
  variant = 'default',
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
  const resolvedRoleIconSize = roleIconSize ?? (variant === 'note' ? NOTE_REFERENCE_ICON_SIZE : 20);
  const resolvedRoleIconScale =
    roleIconScale ?? (variant === 'note' ? NOTE_REFERENCE_ICON_SCALE : 1.75);

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
          gap: 4,
          minWidth: 0,
          paddingHorizontal: bordered ? 8 : undefined,
          paddingVertical: bordered ? 3 : undefined,
        },
        variant === 'note' && noteReferenceStyles.container,
        style,
      ]}
    >
      {role ? (
        <RoleIcon role={role} scale={resolvedRoleIconScale} size={resolvedRoleIconSize} />
      ) : null}
      <Text selectable style={[textStyle, variant === 'note' && noteReferenceStyles.text]}>
        {player.name}
      </Text>
    </View>
  );
}
