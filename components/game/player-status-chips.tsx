import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { hasPlayerStatus, PLAYER_STATUS_KINDS } from '@/utils/player-status-utils';

/** Storyteller reminders for the focused player; tapping a chip adds it or takes it off. */
export function PlayerStatusChips() {
  const { activeDay, focusedPlayer, game } = useGameRouteContext();
  const togglePlayerStatus = useGameStore((state) => state.togglePlayerStatus);

  if (!focusedPlayer || focusedPlayer.isStoryteller) {
    return null;
  }

  return (
    <View style={styles.row}>
      {PLAYER_STATUS_KINDS.map((kind) => {
        const selected = hasPlayerStatus(focusedPlayer, kind.id);
        return (
          <Pressable
            accessibilityLabel={`${kind.label} reminder for ${focusedPlayer.name}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={kind.id}
            onPress={() =>
              togglePlayerStatus(game.id, focusedPlayer.id, { day: activeDay, kind: kind.id })
            }
            style={[
              styles.chip,
              selected && { backgroundColor: kind.color, borderColor: kind.color },
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{kind.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderColor: colors.gameBorder,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: { color: colors.gameTextSoft, fontSize: 12, fontWeight: '800' },
  labelSelected: { color: colors.playerStatus.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
