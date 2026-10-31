import { StyleSheet, View } from 'react-native';

import { StatsCard } from '@/components/stats-card';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game } from '@/types/game';
import { getHeadToHeadStats, type HeadToHeadSide } from '@/utils/game-utils';

type HeadToHeadStatsCardProps = {
  friendName: string;
  games: Game[];
  friendId: string;
};

/** Your record with a friend on the same team and on opposite teams. */
export function HeadToHeadStatsCard({ friendId, friendName, games }: HeadToHeadStatsCardProps) {
  const { opposite, same } = getHeadToHeadStats(games, friendId);

  if (same.games + opposite.games === 0) {
    return null;
  }

  return (
    <StatsCard label={`You and ${friendName}`}>
      <View style={styles.columns}>
        <HeadToHeadColumn label="Same team" side={same} />
        <View style={styles.divider} />
        <HeadToHeadColumn label="Opposite teams" side={opposite} />
      </View>
    </StatsCard>
  );
}

const styles = StyleSheet.create({
  column: { alignItems: 'center', flex: 1, gap: 2, minWidth: 0 },
  columnLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  columns: { flexDirection: 'row', gap: 12 },
  detail: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  divider: { alignSelf: 'stretch', backgroundColor: colors.border, width: 1 },
  value: {
    color: colors.text,
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    textAlign: 'center',
  },
});

function HeadToHeadColumn({ label, side }: { label: string; side: HeadToHeadSide }) {
  const rate =
    side.completedGames === 0 ? '—' : `${Math.round((side.wins / side.completedGames) * 100)}%`;
  return (
    <View style={styles.column}>
      <Text selectable style={styles.columnLabel}>
        {label}
      </Text>
      <Text selectable style={styles.value}>
        {rate}
      </Text>
      <Text selectable style={styles.detail}>
        {`You won ${side.wins} of ${side.completedGames}`}
      </Text>
      <Text selectable style={styles.detail}>
        {`${side.games} ${side.games === 1 ? 'game' : 'games'}`}
      </Text>
    </View>
  );
}
