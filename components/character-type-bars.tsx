import { StyleSheet, View } from 'react-native';

import { RateBar } from '@/components/rate-bar';
import { colors } from '@/theme/colors';
import type { GameStats } from '@/utils/game-utils';
import { CHARACTER_TYPES, type CharacterType } from '@/utils/role-utils';

const TYPE_BARS: Record<CharacterType, { color: string; label: string }> = {
  demon: { color: colors.winBarDemon, label: 'Demon' },
  minion: { color: colors.winBarMinion, label: 'Minion' },
  outsider: { color: colors.winBarOutsider, label: 'Outsider' },
  townsfolk: { color: colors.winBarTownsfolk, label: 'Townsfolk' },
};

type CharacterTypeBarsProps = {
  /** Two columns of bars, for wide rows such as the Friends list. Otherwise one column. */
  grid?: boolean;
  /**
   * `winRate`: win rate as each type. `allGames` / `completedGames`: share of games played as each
   * type, counting every game or only games with a result.
   */
  kind: 'allGames' | 'completedGames' | 'winRate';
  stats: GameStats;
};

/** Townsfolk, Outsider, Minion and Demon bars under the Good and Evil ones. */
export function CharacterTypeBars({ grid, kind, stats }: CharacterTypeBarsProps) {
  return (
    <View style={grid ? styles.grid : styles.column}>
      {CHARACTER_TYPES.map((type) => {
        const typeStats = stats.characterTypes[type];
        const { color, label } = TYPE_BARS[type];
        return (
          <View key={type} style={grid ? styles.gridCell : undefined}>
            <RateBar
              color={color}
              detail={
                kind === 'winRate'
                  ? `${typeStats.wins}/${typeStats.completedGames}`
                  : String(kind === 'allGames' ? typeStats.games : typeStats.completedGames)
              }
              label={label}
              rate={
                kind === 'winRate'
                  ? typeStats.winRate
                  : kind === 'allGames'
                    ? typeStats.sideRate
                    : typeStats.completedSideRate
              }
              stacked
              tick={kind === 'winRate'}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  grid: {
    columnGap: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 5,
  },
  gridCell: {
    flexBasis: '45%',
    flexGrow: 1,
  },
});
