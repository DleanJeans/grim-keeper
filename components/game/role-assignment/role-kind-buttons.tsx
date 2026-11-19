import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { ROLE_KINDS, type RoleKind } from '@/components/game/role-assignment/role-kinds';
import { useRoleAssignmentHistory } from '@/components/game/role-assignment/use-role-assignment-history';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

const TOKEN_SIZE = 26;
const MAX_TOKENS = 2;

type RoleKindButtonsProps = {
  /** Writes the picked role under each label; the dock only has room for the icons. */
  showNames?: boolean;
  selectedKind: RoleKind | null;
  onPress: (kind: RoleKind) => void;
};

/** Claim / Confirm / Rumor / Guess, with the player's logged role icons while Show roles is on. */
export function RoleKindButtons({
  onPress,
  selectedKind,
  showNames = false,
}: RoleKindButtonsProps) {
  return (
    <View style={styles.row}>
      {ROLE_KINDS.map(({ icon: Icon, kind, label }) => (
        <RoleKindButton
          icon={Icon}
          key={kind}
          kind={kind}
          label={label}
          onPress={onPress}
          selected={selectedKind === kind}
          showNames={showNames}
        />
      ))}
    </View>
  );
}

function RoleKindButton({
  icon: Icon,
  kind,
  label,
  onPress,
  selected,
  showNames,
}: {
  icon: (typeof ROLE_KINDS)[number]['icon'];
  kind: RoleKind;
  label: string;
  onPress: (kind: RoleKind) => void;
  selected: boolean;
  showNames: boolean;
}) {
  const { showRoles } = useGameRouteContext();
  const { latestRoles } = useRoleAssignmentHistory(kind);
  const tokens = showRoles ? latestRoles.slice(0, MAX_TOKENS) : [];
  const extra = showRoles ? latestRoles.length - tokens.length : 0;
  const names =
    showNames && showRoles && latestRoles.length > 0
      ? `${latestRoles[0].name}${latestRoles.length > 1 ? ` +${latestRoles.length - 1}` : ''}`
      : '';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onPress(kind)}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        selected && styles.selected,
      ]}
    >
      <View style={styles.face}>
        {tokens.length > 0 ? (
          <>
            {tokens.map((role, index) => (
              <View key={role.id} style={[styles.token, index > 0 && styles.overlappedToken]}>
                <RoleIcon role={role} scale={1.25} size={TOKEN_SIZE - 2} />
              </View>
            ))}
            {extra > 0 ? (
              <Text style={[styles.extra, selected && styles.selectedLabel]}>+{extra}</Text>
            ) : null}
          </>
        ) : (
          <Icon
            color={selected ? colors.onPrimary : colors.gameTextSoft}
            size={20}
            strokeWidth={2.4}
          />
        )}
      </View>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
      {names ? (
        <Text numberOfLines={1} style={[styles.names, selected && styles.selectedNames]}>
          {names}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    flexBasis: 0,
    gap: 2,
    justifyContent: 'center',
    minHeight: 54,
    minWidth: 0,
    paddingVertical: 4,
  },
  extra: { color: colors.gameTextSoft, fontSize: 11, fontWeight: '900', marginLeft: 2 },
  face: {
    alignItems: 'center',
    flexDirection: 'row',
    height: TOKEN_SIZE,
    justifyContent: 'center',
  },
  label: { color: colors.gameTextSoft, fontSize: 12, fontWeight: '800' },
  names: { color: colors.gameTextMuted, fontSize: 10, fontWeight: '700', maxWidth: '100%' },
  overlappedToken: { marginLeft: -9 },
  pressed: { backgroundColor: colors.gameSurfacePressed },
  row: { flexDirection: 'row', gap: 4 },
  selected: { backgroundColor: colors.primary },
  selectedLabel: { color: colors.onPrimary },
  selectedNames: { color: colors.onPrimary, opacity: 0.7 },
  token: {
    alignItems: 'center',
    backgroundColor: colors.roleInfoTokenBackground,
    borderColor: colors.roleInfoTokenFilledBorder,
    borderRadius: TOKEN_SIZE / 2,
    borderWidth: 1,
    height: TOKEN_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: TOKEN_SIZE,
  },
});
