import { router } from 'expo-router';
import { ChevronRight, Play } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getLastDayWithData, getResumeGame } from '@/utils/game-utils';
import { requestWebFullscreen } from '@/utils/web-fullscreen';

/** Jumps back into the most recent game that has no result yet. */
export function ResumeGameButton() {
  const games = useGameStore((state) => state.games);
  const game = getResumeGame(games);
  if (!game) {
    return null;
  }

  const title = game.script?.name ?? 'last game';
  const playerCount = game.players.filter((player) => !player.isStoryteller).length;
  const days = getLastDayWithData(game);
  const detail = `${playerCount} ${playerCount === 1 ? 'player' : 'players'} · ${days} ${days === 1 ? 'day' : 'days'}`;

  return (
    <Pressable
      accessibilityHint="Opens your most recent unfinished game"
      accessibilityLabel={`Resume ${title}, ${detail}`}
      accessibilityRole="button"
      onPress={() => {
        void requestWebFullscreen();
        router.push({ pathname: '/game/[id]', params: { id: game.id } });
      }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Play color={colors.text} size={20} strokeWidth={2.5} />
      <View style={styles.body}>
        <Text style={styles.label}>Resume {title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 2, minWidth: 0 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  detail: { color: colors.textMuted, fontSize: 13 },
  label: { color: colors.text, fontSize: 16, fontWeight: '800' },
  pressed: { backgroundColor: colors.surfacePressed },
});
