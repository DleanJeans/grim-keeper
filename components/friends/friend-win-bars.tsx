import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { GameStats } from '@/utils/game-utils';

type FriendWinBarsProps = {
  stats: GameStats;
};

export function FriendWinBars({ stats }: FriendWinBarsProps) {
  return (
    <View style={styles.container}>
      <WinBar
        color={colors.winBarOverall}
        games={stats.completedGames}
        label="All"
        rate={stats.winRate}
        wins={stats.wins}
      />
      <WinBar
        color={colors.winBarGood}
        games={stats.goodCompletedGames}
        label="Good"
        rate={stats.goodWinRate}
        wins={stats.goodWins}
      />
      <WinBar
        color={colors.winBarEvil}
        games={stats.evilCompletedGames}
        label="Evil"
        rate={stats.evilWinRate}
        wins={stats.evilWins}
      />
    </View>
  );
}

type WinBarProps = {
  color: string;
  games: number;
  label: string;
  rate: number | undefined;
  wins: number;
};

function WinBar({ color, games, label, rate, wins }: WinBarProps) {
  return (
    <View
      accessibilityLabel={
        rate === undefined
          ? `${label} win rate: no games yet`
          : `${label} win rate ${rate} percent, ${wins} of ${games} games`
      }
      style={styles.bar}
    >
      <Text numberOfLines={1} style={[styles.label, { color }]}>
        {label}
      </Text>
      <View style={styles.track}>
        {rate === undefined ? null : (
          <View style={[styles.fill, { backgroundColor: color, width: `${rate}%` }]} />
        )}
        <View style={styles.tick} />
      </View>
      <Text numberOfLines={1} style={styles.value}>
        {rate === undefined ? '—' : `${rate}%`}
        <Text style={styles.count}>{rate === undefined ? '' : ` ${wins}/${games}`}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    gap: 5,
  },
  count: {
    color: colors.textMuted,
    fontSize: 11,
  },
  fill: {
    borderRadius: 4,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    width: 44,
  },
  tick: {
    backgroundColor: colors.winBarTick,
    bottom: -2,
    left: '50%',
    opacity: 0.7,
    position: 'absolute',
    top: -2,
    width: 1,
  },
  track: {
    backgroundColor: colors.winBarTrack,
    borderRadius: 4,
    flex: 1,
    height: 8,
  },
  value: {
    color: colors.text,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    textAlign: 'right',
    width: 84,
  },
});
