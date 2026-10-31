import { StyleSheet, View } from 'react-native';

import { StatsCard } from '@/components/stats-card';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Role } from '@/types/game';
import { getFriendClaimStats } from '@/utils/game-utils';

/** Most-claimed characters shown on a friend's page. */
const TOP_CLAIM_COUNT = 5;

type FriendClaimsCardProps = {
  friendId: string;
  games: Game[];
  roles: Role[];
};

/** What a friend tends to claim and how often their claims were true. */
export function FriendClaimsCard({ friendId, games, roles }: FriendClaimsCardProps) {
  const { checkedClaims, topClaims, trueClaims } = getFriendClaimStats(games, friendId);

  if (topClaims.length === 0) {
    return null;
  }

  // Homebrew characters only live in the games' scripts.
  const roleById = new Map(
    [...games.flatMap((game) => game.script?.roles ?? []), ...roles].map((role) => [role.id, role]),
  );
  const claims = topClaims
    .slice(0, TOP_CLAIM_COUNT)
    .map(({ count, roleId }) => `${roleById.get(roleId)?.name ?? roleId} ×${count}`)
    .join(', ');
  const truth =
    checkedClaims === 0
      ? 'No confirmed characters to check claims against yet'
      : `${Math.round((trueClaims / checkedClaims) * 100)}% of checked claims were true (${trueClaims} of ${checkedClaims})`;

  return (
    <StatsCard label="Claims">
      <View style={styles.body}>
        <Text selectable style={styles.claims}>
          {claims}
        </Text>
        <Text selectable style={styles.truth}>
          {truth}
        </Text>
      </View>
    </StatsCard>
  );
}

const styles = StyleSheet.create({
  body: { gap: 6 },
  claims: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    textAlign: 'center',
  },
  truth: { color: colors.textMuted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
