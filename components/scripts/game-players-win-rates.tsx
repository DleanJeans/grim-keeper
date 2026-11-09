import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { FriendWinBars } from '@/components/friends/friend-win-bars';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game } from '@/types/game';
import { type GameStats, getCombinedGameStats } from '@/utils/game-utils';

type GamePlayersWinRatesProps = {
  /** Every saved game, for the rate across all scripts. */
  allGames: Game[];
  /** The players (and you) sitting in this game, Storytellers left out. */
  playerIds: Set<string>;
  /** The games on this script. */
  scriptGames: Game[];
};

/** The win rates of everyone in one game counted together, on this script and on every script. */
export function GamePlayersWinRates({
  allGames,
  playerIds,
  scriptGames,
}: GamePlayersWinRatesProps) {
  const scriptStats = useMemo(
    () => getCombinedGameStats(scriptGames, playerIds),
    [playerIds, scriptGames],
  );
  const allStats = useMemo(() => getCombinedGameStats(allGames, playerIds), [allGames, playerIds]);

  return (
    <View accessibilityLabel="Combined win rates of everyone in this game" style={styles.card}>
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Everyone in this game
        </Text>
        <Text selectable style={styles.metadata}>
          {playerIds.size} {playerIds.size === 1 ? 'player' : 'players'}
        </Text>
      </View>
      <WinRateSection label="This script" stats={scriptStats} />
      <WinRateSection label="All scripts" stats={allStats} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  header: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  metadata: {
    color: colors.textMuted,
    fontSize: 14,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
  },
});

function WinRateSection({ label, stats }: { label: string; stats: GameStats }) {
  return (
    <View style={styles.section}>
      <Text selectable style={styles.sectionLabel}>
        {label}
      </Text>
      <FriendWinBars stats={stats} />
    </View>
  );
}
