import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game } from '@/types/game';
import { getGameStats } from '@/utils/game-utils';

type HomeGameStatsProps = {
  games: Game[];
};

export function HomeGameStats({ games }: HomeGameStatsProps) {
  const { evilWinRate, goodWinRate, totalGames, winRate } = getGameStats(games);

  return (
    <View style={styles.stats}>
      <StatCard label="Win rate" value={winRate === undefined ? '—' : `${winRate}%`} />
      <StatCard
        label="Good / Evil"
        value={`${formatRate(goodWinRate)} / ${formatRate(evilWinRate)}`}
      />
      <StatCard label="Total games" value={String(totalGames)} />
    </View>
  );
}

function formatRate(rate: number | undefined) {
  return rate === undefined ? '—' : `${rate}%`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text selectable style={styles.label}>
        {label}
      </Text>
      <Text selectable style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 14,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  value: {
    color: colors.text,
    fontSize: 24,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
});
