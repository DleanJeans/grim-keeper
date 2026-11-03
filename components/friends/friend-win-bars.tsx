import { StyleSheet, View } from 'react-native';

import { RateBar } from '@/components/rate-bar';
import { colors } from '@/theme/colors';
import type { GameStats } from '@/utils/game-utils';

type FriendWinBarsProps = {
  stats: GameStats;
};

export function FriendWinBars({ stats }: FriendWinBarsProps) {
  return (
    <View style={styles.container}>
      <RateBar
        color={colors.winBarOverall}
        detail={`${stats.wins}/${stats.completedGames}`}
        label="All"
        rate={stats.winRate}
      />
      <RateBar
        color={colors.winBarGood}
        detail={`${stats.goodWins}/${stats.goodCompletedGames}`}
        label="Good"
        rate={stats.goodWinRate}
      />
      <RateBar
        color={colors.winBarEvil}
        detail={`${stats.evilWins}/${stats.evilCompletedGames}`}
        label="Evil"
        rate={stats.evilWinRate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 5,
  },
});
