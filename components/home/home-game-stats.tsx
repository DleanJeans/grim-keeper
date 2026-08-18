import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game } from '@/types/game';
import { getGameStats } from '@/utils/game-utils';

type HomeGameStatsProps = {
  games: Game[];
};

export function HomeGameStats({ games }: HomeGameStatsProps) {
  const {
    evilGames,
    evilSideRate,
    evilWins,
    evilWinRate,
    goodGames,
    goodSideRate,
    goodWins,
    goodWinRate,
    totalGames,
    winRate,
  } = getGameStats(games);

  return (
    <View style={styles.stats}>
      <StatCard label="Win rate">
        <Text selectable style={styles.value}>
          {formatRate(winRate)}
        </Text>
        <AlignmentWinRates evil={formatRate(evilWinRate)} good={formatRate(goodWinRate)} />
        <AlignmentWinCounts evil={String(evilWins)} good={String(goodWins)} />
      </StatCard>
      <StatCard label="Good / Evil">
        <AlignmentGameValues evil={String(evilGames)} good={String(goodGames)} />
        <AlignmentWinRates evil={formatRate(evilSideRate)} good={formatRate(goodSideRate)} />
      </StatCard>
      <StatCard label="Total games">
        <Text selectable style={styles.value}>
          {totalGames}
        </Text>
      </StatCard>
    </View>
  );
}

function formatRate(rate: number | undefined) {
  return rate === undefined ? '—' : `${rate}%`;
}

function AlignmentWinRates({ evil, good }: { evil: string; good: string }) {
  return (
    <View style={styles.alignmentRow}>
      <Text selectable style={[styles.rateValue, styles.goodValue]}>
        {good}
      </Text>
      <Text selectable style={styles.rateSeparator}>
        /
      </Text>
      <Text selectable style={[styles.rateValue, styles.evilValue]}>
        {evil}
      </Text>
    </View>
  );
}

function AlignmentGameValues({ evil, good }: { evil: string; good: string }) {
  return (
    <View style={styles.alignmentRow}>
      <Text selectable style={[styles.countValue, styles.goodValue]}>
        {good}
      </Text>
      <Text selectable style={styles.countSeparator}>
        /
      </Text>
      <Text selectable style={[styles.countValue, styles.evilValue]}>
        {evil}
      </Text>
    </View>
  );
}

function AlignmentWinCounts({ evil, good }: { evil: string; good: string }) {
  return (
    <View style={styles.alignmentRow}>
      <Text selectable style={[styles.winCountValue, styles.goodValue]}>
        {good}
      </Text>
      <Text selectable style={styles.winCountSeparator}>
        /
      </Text>
      <Text selectable style={[styles.winCountValue, styles.evilValue]}>
        {evil}
      </Text>
    </View>
  );
}

function StatCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={styles.card}>
      <Text selectable style={styles.label}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  alignmentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
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
  evilValue: {
    color: colors.danger,
  },
  goodValue: {
    color: colors.roleGuess,
  },
  countSeparator: {
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  countValue: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  rateSeparator: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  rateValue: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
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
  winCountSeparator: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  winCountValue: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
});
