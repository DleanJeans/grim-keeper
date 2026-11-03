import { StyleSheet, View } from 'react-native';

import { RateBar } from '@/components/rate-bar';
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
      <View style={styles.bars}>
        <HeadToHeadBar label="Same team" side={same} />
        <HeadToHeadBar label="Opposite teams" side={opposite} />
      </View>
      <Text selectable style={styles.hint}>
        Your win rate when you and {friendName} were on the same side or on opposite sides.
      </Text>
    </StatsCard>
  );
}

const styles = StyleSheet.create({
  bars: { gap: 12, marginTop: 4 },
  hint: { color: colors.textMuted, fontSize: 12 },
});

function HeadToHeadBar({ label, side }: { label: string; side: HeadToHeadSide }) {
  const rate =
    side.completedGames === 0 ? undefined : Math.round((side.wins / side.completedGames) * 100);
  return (
    <RateBar
      color={colors.winBarOverall}
      detail={`${side.wins}/${side.completedGames}`}
      label={`${label} · ${side.games} ${side.games === 1 ? 'game' : 'games'}`}
      rate={rate}
      stacked
    />
  );
}
