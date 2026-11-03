import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { FriendWinBars } from '@/components/friends/friend-win-bars';
import { Text } from '@/components/text';
import { getNotesForPlayer, useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';
import { type GameStats, getFriendStats, type TeamFilter } from '@/utils/game-utils';

type FriendRowProps = {
  friend: FriendSummary;
  /** Marks the app user's own row, which shows where you stand and opens nothing. */
  isYou?: boolean;
  /** Position in the current sort, starting at 1. */
  rank?: number;
  team?: TeamFilter;
};

const TEAM_SUFFIX: Record<TeamFilter, string> = {
  all: '',
  opposite: ' against you',
  same: ' with you',
};

export function FriendRow({ friend, isYou = false, rank, team = 'all' }: FriendRowProps) {
  const games = useGameStore((state) => state.games);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const gamesLabel = `${friend.gamesPlayed} ${friend.gamesPlayed === 1 ? 'game' : 'games'}${TEAM_SUFFIX[team]}`;
  const notesCount = isYou ? 0 : getNotesForPlayer(savedNotes, friend.name).length;
  const notesLabel = notesCount > 0 ? `${notesCount} ${notesCount === 1 ? 'note' : 'notes'}` : null;
  const metadata = notesLabel ? `${gamesLabel} · ${notesLabel}` : gamesLabel;
  const gameStats = getFriendStats(games, friend.id, team);
  const stats = formatFriendStats(gameStats);

  return (
    <Pressable
      accessibilityHint={isYou ? undefined : "Opens this friend's details"}
      accessibilityLabel={`${rank ? `Number ${rank}, ` : ''}${isYou ? 'You, ' : ''}${friend.name}, ${metadata}, ${stats}`}
      accessibilityRole={isYou ? 'summary' : 'button'}
      disabled={isYou}
      onPress={() => router.push({ pathname: '/friends/[id]', params: { id: friend.id } })}
      style={({ pressed }) => [styles.card, isYou && styles.cardYou, pressed && styles.cardPressed]}
    >
      <View style={styles.content}>
        <View style={styles.nameRow}>
          {rank ? <Text style={styles.rank}>{`#${rank}`}</Text> : null}
          <Text selectable style={styles.name}>
            {friend.name}
          </Text>
          {isYou ? (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>You</Text>
            </View>
          ) : null}
          <Text selectable style={styles.metadata}>
            {metadata}
          </Text>
          {isYou ? null : <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />}
        </View>
        <FriendWinBars stats={gameStats} />
      </View>
    </Pressable>
  );
}

function formatFriendStats({
  completedGames,
  evilCompletedGames,
  evilWinRate,
  evilWins,
  goodCompletedGames,
  goodWinRate,
  goodWins,
  winRate,
  wins,
}: GameStats) {
  return `Win rate ${formatRate(winRate)} (${wins}/${completedGames}) · Good ${formatRate(goodWinRate)} (${goodWins}/${goodCompletedGames}) · Evil ${formatRate(evilWinRate)} (${evilWins}/${evilCompletedGames})`;
}

function formatRate(rate: number | undefined) {
  return rate === undefined ? '—' : `${rate}%`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    minHeight: 58,
    padding: 16,
  },
  cardYou: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
  cardPressed: {
    opacity: 0.65,
  },
  content: {
    gap: 8,
  },
  metadata: {
    color: colors.textMuted,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  name: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
  rank: {
    color: colors.textMuted,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    minWidth: 28,
  },
  youBadge: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  youBadgeText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
});
