import { Dices } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';
import { getBluffTargetPlayers, pickRandomPlayers } from '@/utils/player-utils';

const PICK_COUNTS = [1, 2, 3];

type RandomPlayersPickerProps = {
  players: Player[];
};

/**
 * Picks 1 to 3 random players (not you or a Storyteller) to name in a bluff, such as the players
 * a fake info character learned about. Tapping a count again picks again.
 */
export function RandomPlayersPicker({ players }: RandomPlayersPickerProps) {
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const candidates = useMemo(() => getBluffTargetPlayers(players), [players]);
  const counts = PICK_COUNTS.filter((count) => count <= candidates.length);
  if (counts.length === 0) return null;

  const playersById = new Map(candidates.map((player) => [player.id, player]));
  const pickedNames = pickedIds
    .map((id) => playersById.get(id)?.name)
    .filter((name): name is string => !!name);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Dices color={colors.textMuted} size={16} strokeWidth={2.4} />
        <Text style={styles.label}>Random players</Text>
        {counts.map((count) => (
          <PickCountButton
            count={count}
            key={count}
            onPress={() =>
              setPickedIds(pickRandomPlayers(candidates, count).map((player) => player.id))
            }
          />
        ))}
      </View>
      {pickedNames.length > 0 ? (
        <Text selectable style={styles.picked}>
          {pickedNames.join(', ')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  label: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 2,
  },
  countButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 7,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    minWidth: 34,
    paddingHorizontal: 8,
  },
  countButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  countText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  picked: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});

function PickCountButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`Pick ${count} random ${count === 1 ? 'player' : 'players'}`}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.countButton, pressed && styles.countButtonPressed]}
    >
      <Text style={styles.countText}>{count}</Text>
    </Pressable>
  );
}
