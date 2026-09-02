import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { getNotesForPlayer, useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';
import { getGameStats } from '@/utils/game-utils';

type FriendRowProps = {
  friend: FriendSummary;
};

export function FriendRow({ friend }: FriendRowProps) {
  const games = useGameStore((state) => state.games);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const gamesLabel = `${friend.gamesPlayed} ${friend.gamesPlayed === 1 ? 'game' : 'games'}`;
  const notesCount = getNotesForPlayer(savedNotes, friend.name).length;
  const notesLabel = notesCount > 0 ? `${notesCount} ${notesCount === 1 ? 'note' : 'notes'}` : null;
  const metadata = notesLabel ? `${gamesLabel} · ${notesLabel}` : gamesLabel;
  const gameStats = getGameStats(games, friend.id);
  const stats = formatFriendStats(gameStats.winRate, gameStats.goodWinRate, gameStats.evilWinRate);

  return (
    <Pressable
      accessibilityHint="Opens this friend's details"
      accessibilityLabel={`${friend.name}, ${metadata}, ${stats}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/friends/[id]', params: { id: friend.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text selectable style={styles.name}>
            {friend.name}
          </Text>
          <Text selectable style={styles.metadata}>
            {metadata}
          </Text>
          <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
        </View>
        <Text numberOfLines={1} selectable style={styles.stats}>
          {stats}
        </Text>
      </View>
    </Pressable>
  );
}

function formatFriendStats(
  winRate: number | undefined,
  goodWinRate: number | undefined,
  evilWinRate: number | undefined,
) {
  return `Win Rate ${formatRate(winRate)} · Good ${formatRate(goodWinRate)} · Evil ${formatRate(evilWinRate)}`;
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
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  stats: {
    color: colors.textMuted,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
