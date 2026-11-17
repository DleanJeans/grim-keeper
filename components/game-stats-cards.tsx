import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CharacterTypeBars } from '@/components/character-type-bars';
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
  const [showTypes, setShowTypes] = useState(false);
  const toggleTypes = () => setShowTypes((value) => !value);
  const stats = getGameStats(games, playerId);
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
  } = stats;

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
          {showTypes && <CharacterTypeBars kind="winRate" stats={stats} />}
          <TypesToggle expanded={showTypes} onPress={toggleTypes} />
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
          {showTypes && (
            <CharacterTypeBars kind={showAllGames ? 'allGames' : 'completedGames'} stats={stats} />
          )}
          <TypesToggle expanded={showTypes} onPress={toggleTypes} />
        </View>
      </StatsCard>
    </View>
  );
}

function TypesToggle({ expanded, onPress }: { expanded: boolean; onPress: () => void }) {
  const Icon = expanded ? ChevronUp : ChevronDown;
  return (
    <Pressable
      accessibilityLabel={expanded ? 'Hide character types' : 'Show character types'}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={styles.toggle}
    >
      <Icon color={colors.textMuted} size={20} />
    </Pressable>
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
  toggle: {
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  value: {
    color: colors.text,
    fontSize: 24,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    textAlign: 'center',
  },
});
