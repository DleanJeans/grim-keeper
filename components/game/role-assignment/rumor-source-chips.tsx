import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';

type RumorSourceChipsProps = {
  players: Player[];
  selectedPlayerId: string | null;
  onSelect: (playerId: string) => void;
};

/** Who told the rumor, optional; tap the picked player again to clear it. */
export function RumorSourceChips({ onSelect, players, selectedPlayerId }: RumorSourceChipsProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>From</Text>
      <ScrollView
        contentContainerStyle={styles.chips}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        {players.map((player) => (
          <Pressable
            accessibilityLabel={`Rumor from ${player.name}`}
            accessibilityRole="button"
            accessibilityState={{ selected: player.id === selectedPlayerId }}
            key={player.id}
            onPress={() => onSelect(player.id)}
            style={[styles.chip, player.id === selectedPlayerId && styles.chipSelected]}
          >
            <Text
              style={[styles.chipText, player.id === selectedPlayerId && styles.chipTextSelected]}
            >
              {player.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderColor: colors.gameBorder,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  chipSelected: { backgroundColor: colors.gameSurfaceRaised, borderColor: colors.roleRumor },
  chipText: { color: colors.gameText, fontSize: 13, fontWeight: '800' },
  chipTextSelected: { color: colors.roleRumor },
  chips: { gap: 6 },
  label: { color: colors.gameTextMuted, fontSize: 12, fontWeight: '800' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 40 },
});
