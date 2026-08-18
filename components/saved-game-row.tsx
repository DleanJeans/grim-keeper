import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { SavedGameRolesRow } from '@/components/saved-game-roles-row';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, GameResult } from '@/types/game';
import { getLastDayWithData } from '@/utils/game-utils';

type SavedGameRowProps = {
  game: Game;
  onDelete: (gameId: string) => void;
};

export function SavedGameRow({ game, onDelete }: SavedGameRowProps) {
  const resultStyles = getResultStyles(game.result);

  return (
    <View style={[styles.container, resultStyles.container]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/game/[id]', params: { id: game.id } })}
          style={({ pressed }) => [
            styles.gameButton,
            resultStyles.surface,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.details}>
            <View style={styles.titleGroup}>
              <Text selectable style={styles.title}>
                {game.script?.name ?? formatGameDate(game.createdAt)}
              </Text>
              {game.script ? (
                <Text selectable style={styles.date}>
                  {formatGameDate(game.createdAt)}
                </Text>
              ) : null}
            </View>
            <Text selectable style={styles.metadata}>
              {game.players.length} players - {getLastDayWithData(game)} days
            </Text>
            {game.result ? (
              <Text selectable style={[styles.resultLabel, resultStyles.label]}>
                {formatResult(game.result)}
              </Text>
            ) : null}
            {game.script ? <SavedGameRolesRow game={game} /> : null}
          </View>
        </Pressable>

        <Pressable
          accessibilityLabel="Delete saved game"
          accessibilityRole="button"
          onPress={() => onDelete(game.id)}
          style={({ pressed }) => [
            styles.deleteButton,
            resultStyles.surface,
            resultStyles.divider,
            pressed && styles.deletePressed,
          ]}
        >
          <Trash2 color={colors.danger} size={18} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}

function getResultStyles(result?: GameResult) {
  if (result === 'won') {
    return {
      container: styles.wonContainer,
      divider: styles.wonDivider,
      label: styles.wonLabel,
      surface: styles.wonSurface,
    };
  }

  if (result === 'lost') {
    return {
      container: styles.lostContainer,
      divider: styles.lostDivider,
      label: styles.lostLabel,
      surface: styles.lostSurface,
    };
  }

  return {
    container: null,
    divider: null,
    label: null,
    surface: styles.surface,
  };
}

function formatResult(result: GameResult) {
  return `Result: ${result[0].toLocaleUpperCase()}${result.slice(1)}`;
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
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    borderCurve: 'continuous',
  },
  date: {
    color: colors.textMuted,
    fontSize: 13,
  },
  deleteButton: {
    alignItems: 'center',
    borderBottomRightRadius: 8,
    borderLeftColor: colors.borderStrong,
    borderLeftWidth: 1,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  deletePressed: {
    backgroundColor: colors.dangerSurface,
  },
  details: {
    flex: 1,
    gap: 8,
  },
  gameButton: {
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
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
    borderLeftColor: colors.danger,
  },
  lostLabel: {
    color: colors.danger,
    fontWeight: '800',
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
  resultLabel: {
    fontSize: 13,
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
  },
  titleGroup: {
    gap: 2,
  },
  wonContainer: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  wonDivider: {
    borderLeftColor: colors.successBorder,
  },
  wonLabel: {
    color: colors.successText,
    fontWeight: '800',
  },
  wonSurface: {
    backgroundColor: colors.successSurface,
  },
});
