import { router } from 'expo-router';
import { ChevronDown, ChevronUp, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SavedGamePlayerList } from '@/components/saved-game-player-list';
import { SavedGameRolesRow } from '@/components/saved-game-roles-row';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, GameResult } from '@/types/game';
import { getLastDayWithData } from '@/utils/game-utils';
import { requestWebFullscreen } from '@/utils/web-fullscreen';

type SavedGameRowProps = {
  game: Game;
  onDelete: (gameId: string) => void;
};

export function SavedGameRow({ game, onDelete }: SavedGameRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const resultStyles = getResultStyles(game.result);
  const gameTitle = game.script?.name ?? formatGameDate(game.createdAt);
  const gameDays = getLastDayWithData(game);
  const playerCount = game.players.filter((player) => !player.isStoryteller).length;
  const playerCountLabel = `${playerCount} ${playerCount === 1 ? 'player' : 'players'}`;
  const dayCountLabel = `${gameDays} ${gameDays === 1 ? 'day' : 'days'}`;

  return (
    <View style={[styles.container, resultStyles.container]}>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel={`Open ${gameTitle}, ${playerCountLabel}, ${dayCountLabel}${game.result ? `, ${formatResult(game.result)}` : ''}`}
          accessibilityRole="button"
          accessibilityHint="Hold to delete"
          onLongPress={() => onDelete(game.id)}
          onPress={() => {
            void requestWebFullscreen();
            router.push({ pathname: '/game/[id]', params: { id: game.id } });
          }}
          style={({ pressed }) => [
            styles.gameButton,
            resultStyles.surface,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.details}>
            <View style={styles.titleGroup}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{gameTitle}</Text>
                {game.result ? <GameResultBadge result={game.result} /> : null}
              </View>
              {game.script ? (
                <Text style={styles.date}>{formatGameDate(game.createdAt)}</Text>
              ) : null}
            </View>
            <Text style={styles.metadata}>
              {playerCountLabel} · {dayCountLabel}
            </Text>
            {game.script && !isExpanded ? <SavedGameRolesRow game={game} /> : null}
          </View>
        </Pressable>
      </View>

      {isExpanded ? (
        <>
          <SavedGamePlayerList game={game} />
          <Pressable
            accessibilityHint="Starts a new game with the same players and Storyteller"
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/create', params: { copyPlayersFrom: game.id } })
            }
            style={({ pressed }) => [
              styles.copyPlayersButton,
              resultStyles.surface,
              resultStyles.divider,
              pressed && styles.pressed,
            ]}
          >
            <Users color={colors.text} size={16} strokeWidth={2.4} />
            <Text style={styles.copyPlayersLabel}>New game with these players</Text>
          </Pressable>
        </>
      ) : null}

      <Pressable
        accessibilityLabel={`${isExpanded ? 'Hide' : 'Show'} players in ${gameTitle}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        hitSlop={4}
        onPress={() => setIsExpanded((expanded) => !expanded)}
        style={({ pressed }) => [
          styles.expandButton,
          resultStyles.surface,
          resultStyles.divider,
          pressed && styles.pressed,
        ]}
      >
        {isExpanded ? (
          <ChevronUp color={colors.textMuted} size={20} strokeWidth={2.4} />
        ) : (
          <ChevronDown color={colors.textMuted} size={20} strokeWidth={2.4} />
        )}
      </Pressable>
    </View>
  );
}

function GameResultBadge({ result }: { result: GameResult }) {
  return (
    <View
      accessibilityLabel={`Game result: ${result}`}
      style={[styles.badge, result === 'won' ? styles.wonBadge : styles.lostBadge]}
    >
      <Text
        style={[styles.badgeLabel, result === 'won' ? styles.wonBadgeLabel : styles.lostBadgeLabel]}
      >
        {formatResult(result)}
      </Text>
    </View>
  );
}

function getResultStyles(result?: GameResult) {
  if (result === 'won') {
    return {
      container: styles.wonContainer,
      divider: styles.wonDivider,
      surface: styles.wonSurface,
    };
  }

  if (result === 'lost') {
    return {
      container: styles.lostContainer,
      divider: styles.lostDivider,
      surface: styles.lostSurface,
    };
  }

  return {
    container: null,
    divider: null,
    surface: styles.surface,
  };
}

function formatResult(result: GameResult) {
  return `${result[0].toLocaleUpperCase()}${result.slice(1)}`;
}

function formatGameDate(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    weekday: 'long',
    year: 'numeric',
  }).format(new Date(createdAt));
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderCurve: 'continuous',
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    borderCurve: 'continuous',
  },
  copyPlayersButton: {
    alignItems: 'center',
    borderTopColor: colors.borderStrong,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  copyPlayersLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  date: {
    color: colors.textMuted,
    fontSize: 13,
  },
  details: {
    flex: 1,
    gap: 8,
  },
  expandButton: {
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopColor: colors.borderStrong,
    borderTopWidth: 1,
    paddingVertical: 6,
  },
  gameButton: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    padding: 16,
  },
  lostContainer: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
  },
  lostDivider: {
    borderTopColor: colors.danger,
  },
  lostSurface: {
    backgroundColor: colors.dangerSurface,
  },
  metadata: {
    color: colors.textMuted,
    fontSize: 14,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  row: {
    flexDirection: 'row',
  },
  surface: {
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  titleGroup: {
    gap: 2,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  lostBadge: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
  },
  lostBadgeLabel: {
    color: colors.danger,
  },
  wonContainer: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  wonDivider: {
    borderTopColor: colors.successBorder,
  },
  wonBadge: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  wonBadgeLabel: {
    color: colors.successText,
  },
  wonSurface: {
    backgroundColor: colors.successSurface,
  },
});
