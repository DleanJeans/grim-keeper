import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RandomChip } from '@/components/game/random-drawer/random-chip';
import { RollButton } from '@/components/game/random-drawer/roll-button';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { pickRandomPlayers } from '@/utils/player-utils';
import { getRandomPlayerCandidates } from '@/utils/random-pick-utils';

const PICK_COUNTS = [1, 2, 3, 4];

/**
 * Picks 1 to 4 random players (not you or a Storyteller), such as the players a bluffed info
 * character learned about. The picks light up on the map.
 */
export function RandomPlayersTab() {
  const { activeDay, activePhase, handleHighlightPlayers, players } = useGameRouteContext();
  const [aliveOnly, setAliveOnly] = useState(true);
  const [count, setCount] = useState<number | null>(null);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const candidates = useMemo(
    () => getRandomPlayerCandidates(players, aliveOnly, activeDay, activePhase),
    [activeDay, activePhase, aliveOnly, players],
  );
  const counts = PICK_COUNTS.filter((option) => option <= candidates.length);
  const namesById = new Map(players.map((player) => [player.id, player.name]));
  const pickedNames = pickedIds
    .map((id) => namesById.get(id))
    .filter((name): name is string => !!name);

  function roll(nextCount: number) {
    const ids = pickRandomPlayers(candidates, nextCount).map((player) => player.id);
    setCount(nextCount);
    setPickedIds(ids);
    handleHighlightPlayers(ids);
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.counts}>
          {counts.map((option) => (
            <PickCountButton
              count={option}
              key={option}
              onPress={() => roll(option)}
              selected={option === count}
            />
          ))}
        </View>
        <View style={styles.spacer} />
        <RandomChip label="Alive only" on={aliveOnly} onPress={() => setAliveOnly(!aliveOnly)} />
      </View>
      {counts.length === 0 ? (
        <Text style={styles.empty}>No players to pick from.</Text>
      ) : pickedNames.length > 0 && count !== null ? (
        <View style={styles.result}>
          <Text selectable style={styles.resultText}>
            {pickedNames.join(', ')}
          </Text>
          <RollButton onPress={() => roll(Math.min(count, candidates.length))} />
        </View>
      ) : (
        <Text style={styles.empty}>Tap how many players to pick.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  count: {
    alignItems: 'center',
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 38,
  },
  countLabel: { color: colors.gameText, fontSize: 14, fontWeight: '900' },
  countLabelSelected: { color: colors.randomOnAccent },
  countPressed: { backgroundColor: colors.gameSurfacePressed },
  countSelected: { backgroundColor: colors.randomAccent, borderColor: colors.randomAccent },
  counts: { flexDirection: 'row', gap: 6 },
  empty: { color: colors.gameTextMuted, fontSize: 12.5, fontWeight: '700' },
  result: {
    alignItems: 'center',
    backgroundColor: colors.gameBackground,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resultText: { color: colors.gameText, flex: 1, fontSize: 14, fontWeight: '800' },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spacer: { flex: 1 },
});

function PickCountButton({
  count,
  onPress,
  selected,
}: {
  count: number;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`Pick ${count} random ${count === 1 ? 'player' : 'players'}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.count,
        selected && styles.countSelected,
        pressed && styles.countPressed,
      ]}
    >
      <Text style={[styles.countLabel, selected && styles.countLabelSelected]}>{count}</Text>
    </Pressable>
  );
}
