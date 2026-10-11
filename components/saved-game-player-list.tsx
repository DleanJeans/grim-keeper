import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Player, Role } from '@/types/game';
import { GENERIC_KILLER_ROLES, getEffectiveRoleForPlayer } from '@/utils/role-utils';

const ROLE_ICON_SIZE = 24;
const TEAM_ORDER = ['townsfolk', 'outsider', 'minion', 'demon'];

export function SavedGamePlayerList({ game }: { game: Game }) {
  const roles = useMemo<Role[]>(() => game.script?.roles ?? [], [game.script]);

  // Townsfolk, Outsiders, Minions, Demons, then everyone else; seat order within each team.
  const entries = useMemo(
    () =>
      game.players
        .filter((player) => !player.isStoryteller)
        .map((player) => ({
          player,
          role: getEffectiveRoleForPlayer(player, roles, game.activeDay).role,
        }))
        .sort(
          (first, second) =>
            getTeamRank(first.role) - getTeamRank(second.role) ||
            first.player.seat - second.player.seat,
        ),
    [game.players, game.activeDay, roles],
  );

  return (
    <View accessibilityLabel="Players" style={styles.list}>
      {entries.map(({ player, role }, index) => (
        <SavedGamePlayerRow key={player.id} number={index + 1} player={player} role={role} />
      ))}
    </View>
  );
}

function SavedGamePlayerRow({
  number,
  player,
  role,
}: {
  number: number;
  player: Player;
  role: Role | null;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.number}>{number}</Text>
      <RoleIcon role={role ?? GENERIC_KILLER_ROLES[0]} size={ROLE_ICON_SIZE} />
      <Text numberOfLines={1} style={styles.name}>
        {player.name}
      </Text>
      <Text numberOfLines={1} style={[styles.role, !role && styles.unknownRole]}>
        {role?.name ?? 'Unknown'}
      </Text>
    </View>
  );
}

function getTeamRank(role: Role | null) {
  const rank = TEAM_ORDER.indexOf(role?.team?.toLocaleLowerCase() ?? '');
  return rank === -1 ? TEAM_ORDER.length : rank;
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  name: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  role: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 14,
    textAlign: 'right',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  number: {
    color: colors.textMuted,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'right',
  },
  unknownRole: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
