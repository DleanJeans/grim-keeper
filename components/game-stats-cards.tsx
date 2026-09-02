import { useState } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { StatsCard } from '@/components/stats-card';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game } from '@/types/game';
import { getGameStats } from '@/utils/game-utils';

type GameStatsCardsProps = {
  games: Game[];
  playerId?: string;
};

export function GameStatsCards({ games, playerId }: GameStatsCardsProps) {
  const [showWinRateDetails, setShowWinRateDetails] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);
  const {
    completedGames,
    evilCompletedGames,
    evilCompletedSideRate,
    evilGames,
    evilSideRate,
    evilWins,
    evilWinRate,
    goodCompletedGames,
    goodCompletedSideRate,
    goodGames,
    goodSideRate,
    goodWins,
    goodWinRate,
    totalGames,
    winRate,
    wins,
  } = getGameStats(games, playerId);

  return (
    <View style={styles.stats}>
      <StatsCard
        accessibilityHint={
          showWinRateDetails
            ? 'Press to show only the total win rate.'
            : 'Press to show total wins and games with results.'
        }
        label="Win Rate"
        onPress={() => setShowWinRateDetails((value) => !value)}
      >
        <Text selectable style={styles.value}>
          {showWinRateDetails ? `${wins} / ${completedGames}` : formatRate(winRate)}
        </Text>
        <AlignmentLabels />
        <AlignmentWinRates evil={formatRate(evilWinRate)} good={formatRate(goodWinRate)} />
        <AlignmentGameValues
          evil={showWinRateDetails ? `${evilWins} / ${evilCompletedGames}` : String(evilWins)}
          good={showWinRateDetails ? `${goodWins} / ${goodCompletedGames}` : String(goodWins)}
        />
      </StatsCard>
      <StatsCard
        accessibilityHint={
          showAllGames
            ? 'Press to show only games with results.'
            : 'Press to include games without results.'
        }
        label={showAllGames ? 'Total Games' : 'Total Games with Results'}
        onPress={() => setShowAllGames((value) => !value)}
      >
        <Text selectable style={styles.value}>
          {showAllGames ? totalGames : completedGames}
        </Text>
        <AlignmentLabels />
        <AlignmentWinRates
          evil={formatRate(showAllGames ? evilSideRate : evilCompletedSideRate)}
          good={formatRate(showAllGames ? goodSideRate : goodCompletedSideRate)}
        />
        <AlignmentGameValues
          evil={String(showAllGames ? evilGames : evilCompletedGames)}
          good={String(showAllGames ? goodGames : goodCompletedGames)}
        />
      </StatsCard>
    </View>
  );
}

function formatRate(rate: number | undefined) {
  return rate === undefined ? '—' : `${rate}%`;
}

function AlignmentLabels() {
  return (
    <View style={styles.alignmentRow}>
      <Text selectable style={[styles.alignmentLabel, styles.goodValue]}>
        Good
      </Text>
      <Text selectable style={[styles.alignmentLabel, styles.evilValue]}>
        Evil
      </Text>
    </View>
  );
}

type AlignmentRowProps = {
  evil: string;
  good: string;
  valueStyle: StyleProp<TextStyle>;
};

function AlignmentRow({ evil, good, valueStyle }: AlignmentRowProps) {
  return (
    <View style={styles.alignmentRow}>
      <Text selectable style={[valueStyle, styles.goodValue]}>
        {good}
      </Text>
      <Text selectable style={[valueStyle, styles.evilValue]}>
        {evil}
      </Text>
    </View>
  );
}

function AlignmentWinRates({ evil, good }: { evil: string; good: string }) {
  return <AlignmentRow evil={evil} good={good} valueStyle={styles.rateValue} />;
}

function AlignmentGameValues({ evil, good }: { evil: string; good: string }) {
  return <AlignmentRow evil={evil} good={good} valueStyle={styles.countValue} />;
}

const styles = StyleSheet.create({
  alignmentLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  alignmentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  countValue: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  evilValue: {
    color: colors.danger,
  },
  goodValue: {
    color: colors.roleGuess,
  },
  rateValue: {
    fontSize: 14,
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
    textAlign: 'center',
  },
});
