import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { colors } from '@/theme/colors';
import type { Game, Role } from '@/types/game';
import {
  GENERIC_KILLER_ROLES,
  getEffectiveRoleForPlayer,
  getPlayerRoleBucket,
} from '@/utils/role-utils';

const ROLE_ICON_SIZE = 28;
const ROLE_ICON_HIGHLIGHT_RING = ROLE_ICON_SIZE + 6; // icon + 2px border + 2px padding each side

type Player = Game['players'][number];
type RoleEntry =
  | { kind: 'role'; player: Player; role: Role }
  | { kind: 'unknown'; players: Player[] };

export function SavedGameRolesRow({ game }: { game: Game }) {
  const roles = useMemo<Role[]>(() => game.script?.roles ?? [], [game.script]);
  const unknownRole = GENERIC_KILLER_ROLES[0];

  const orderedPlayers = useMemo(() => {
    return [...game.players].sort(
      (first, second) =>
        getPlayerRoleBucket(first, roles, game.activeDay) -
          getPlayerRoleBucket(second, roles, game.activeDay) || first.seat - second.seat,
    );
  }, [game.players, game.activeDay, roles]);

  // Collapse consecutive unknown players into a single badge showing the count.
  const entries = useMemo<RoleEntry[]>(() => {
    const result: RoleEntry[] = [];
    for (const player of orderedPlayers) {
      const { role } = getEffectiveRoleForPlayer(player, roles, game.activeDay);
      if (role) {
        result.push({ kind: 'role', player, role });
        continue;
      }
      const last = result[result.length - 1];
      if (last?.kind === 'unknown') {
        last.players.push(player);
      } else {
        result.push({ kind: 'unknown', players: [player] });
      }
    }
    return result;
  }, [orderedPlayers, roles, game.activeDay]);

  return (
    <View accessibilityLabel="Saved game roles" style={styles.row}>
      {entries.map((entry) => {
        if (entry.kind === 'unknown') {
          return (
            <View
              key={`unknown-${entry.players.map((player) => player.id).join('-')}`}
              style={styles.unknownBadge}
            >
              <RoleIcon role={unknownRole} size={ROLE_ICON_SIZE} />
              <View style={styles.unknownCount} pointerEvents="none">
                <Text style={styles.unknownCountText}>{entry.players.length}</Text>
              </View>
            </View>
          );
        }

        return (
          <View
            key={entry.player.id}
            style={entry.player.isAppUser ? styles.appUserRing : undefined}
          >
            <RoleIcon role={entry.role} size={ROLE_ICON_SIZE} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  appUserRing: {
    alignItems: 'center',
    borderColor: colors.roleConfirm,
    borderRadius: ROLE_ICON_HIGHLIGHT_RING / 2,
    borderWidth: 2,
    height: ROLE_ICON_HIGHLIGHT_RING,
    justifyContent: 'center',
    width: ROLE_ICON_HIGHLIGHT_RING,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 6,
  },
  unknownBadge: {
    alignItems: 'center',
    height: ROLE_ICON_SIZE,
    justifyContent: 'center',
    position: 'relative',
    width: ROLE_ICON_SIZE,
  },
  unknownCount: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.borderStrong,
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -6,
    top: -6,
  },
  unknownCountText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 12,
  },
});
