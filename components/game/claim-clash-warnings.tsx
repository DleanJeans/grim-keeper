import { TriangleAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import type { ClaimClashes } from '@/utils/claim-clash-utils';

type ClaimClashWarningsProps = {
  clashes: ClaimClashes;
  players: Player[];
  roles: Role[];
};

/** Quiet notes above the map tools when claims can't all be true. */
export function ClaimClashWarnings({ clashes, players, roles }: ClaimClashWarningsProps) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const roleById = new Map(roles.map((role) => [role.id, role]));
  const roleName = (roleId: string) => roleById.get(roleId)?.name ?? roleId;
  const messages = clashes.doubleClaims.map(
    (clash) =>
      `${roleName(clash.roleId)} claimed by ${joinNames(
        clash.playerIds.map((playerId) => playerById.get(playerId)?.name ?? 'Unknown'),
      )}`,
  );
  const { outsiders } = clashes;
  if (outsiders) {
    const modifiers =
      outsiders.maxSetup > outsiders.setup
        ? ` (up to ${outsiders.maxSetup} with ${joinNames(outsiders.modifierRoleIds.map(roleName), 'or')})`
        : '';
    messages.push(
      `${outsiders.claimed} Outsiders claimed, setup has ${outsiders.setup}${modifiers}`,
    );
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <View accessibilityRole="summary" style={styles.list}>
      {messages.map((message) => (
        <ClashMessage key={message} message={message} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 2,
  },
  message: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  messageText: {
    color: colors.warning,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
  },
});

function ClashMessage({ message }: { message: string }) {
  return (
    <View style={styles.message}>
      <TriangleAlert color={colors.warning} size={13} strokeWidth={2.6} />
      <Text selectable style={styles.messageText}>
        {message}
      </Text>
    </View>
  );
}

function joinNames(names: string[], conjunction = 'and') {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} ${conjunction} ${names.at(-1)}`;
}
