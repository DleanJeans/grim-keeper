import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RateBar } from '@/components/rate-bar';
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
      <StatsCard label="Win Rate">
        <Text selectable style={styles.value}>
          {formatRate(winRate)}
        </Text>
        <Text selectable style={styles.detail}>
          {`${wins} of ${completedGames}`}
        </Text>
        <View style={styles.bars}>
          <RateBar
            color={colors.winBarGood}
            detail={`${goodWins}/${goodCompletedGames}`}
            label="Good"
            rate={goodWinRate}
            stacked
          />
          <RateBar
            color={colors.winBarEvil}
            detail={`${evilWins}/${evilCompletedGames}`}
            label="Evil"
            rate={evilWinRate}
            stacked
          />
        </View>
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
        <Text selectable style={styles.detail}>
          {showAllGames ? 'including games without a result' : 'games with a result'}
        </Text>
        <View style={styles.bars}>
          <RateBar
            color={colors.winBarGood}
            detail={String(showAllGames ? goodGames : goodCompletedGames)}
            label="Good"
            rate={showAllGames ? goodSideRate : goodCompletedSideRate}
            stacked
            tick={false}
          />
          <RateBar
            color={colors.winBarEvil}
            detail={String(showAllGames ? evilGames : evilCompletedGames)}
            label="Evil"
            rate={showAllGames ? evilSideRate : evilCompletedSideRate}
            stacked
            tick={false}
          />
        </View>
      </StatsCard>
    </View>
  );
}

function formatRate(rate: number | undefined) {
  return rate === undefined ? '—' : `${rate}%`;
}

const styles = StyleSheet.create({
  bars: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 6,
  },
  detail: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
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
