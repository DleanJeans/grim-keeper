import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { useOptionalGameRouteContext } from '@/components/game/game-route-context';
import {
  NOTE_REFERENCE_ICON_SCALE,
  NOTE_REFERENCE_ICON_SIZE,
  noteReferenceStyles,
} from '@/components/note-reference-styles';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, GamePhase, Player } from '@/types/game';
import { getRoleDisplayForDayOrPrevious } from '@/utils/role-utils';

type PlayerNameWithRoleProps = {
  bordered?: boolean;
  game?: Game;
  day?: number;
  phase?: GamePhase;
  player: Player;
  iconSize?: number;
  iconScale?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  showRoles?: boolean;
  variant?: 'default' | 'note';
};

export function PlayerNameWithRole({
  bordered = false,
  day,
  phase,
  game: providedGame,
  player,
  iconSize,
  iconScale,
  style,
  textStyle,
  showRoles: providedShowRoles,
  variant = 'default',
}: PlayerNameWithRoleProps) {
  const gameRoute = useOptionalGameRouteContext();
  const game = providedGame ?? gameRoute?.game;
  const activeDay = day ?? gameRoute?.activeDay ?? providedGame?.activeDay ?? 0;
  const activePhase =
    phase ??
    (day !== undefined ? 'day' : undefined) ??
    gameRoute?.activePhase ??
    providedGame?.activePhase ??
    'day';
  const showRoles = providedShowRoles ?? gameRoute?.showRoles ?? false;
  const script = game?.script;
  const role =
    showRoles && script
      ? getRoleDisplayForDayOrPrevious(player.roleAssignments, activeDay, script.roles, activePhase)
          .roles[0]
      : undefined;
  const resolvedRoleIconSize = iconSize ?? (variant === 'note' ? NOTE_REFERENCE_ICON_SIZE : 20);
  const resolvedRoleIconScale =
    iconScale ?? (variant === 'note' ? NOTE_REFERENCE_ICON_SCALE : 1.75);

  return (
    <View
      style={[
        styles.container,
        bordered && styles.bordered,
        style,
        variant === 'note' && noteReferenceStyles.container,
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

const styles = StyleSheet.create({
  bordered: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 4,
    minWidth: 0,
  },
});
