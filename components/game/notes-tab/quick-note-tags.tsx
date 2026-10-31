import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';

/** One-tap notes about how a player is acting; tapping a used tag again removes it. */
const QUICK_TAGS = ['Quiet', 'Pushy', 'Confident', 'Nervous', 'Talkative', 'Defensive'];

export function QuickNoteTags() {
  const { activeDay, activePhase, focusedPlayer, game, interactionMode, runDayEdit } =
    useGameRouteContext();
  const addPlayerDayNote = useGameStore((state) => state.addPlayerDayNote);
  const removePlayerDayNote = useGameStore((state) => state.removePlayerDayNote);

  if (!focusedPlayer || interactionMode || focusedPlayer.isStoryteller) {
    return null;
  }

  const phaseNotes =
    game.playerDayNotes?.find(
      (entry) =>
        entry.playerId === focusedPlayer.id &&
        entry.day === activeDay &&
        (entry.phase ?? 'day') === activePhase,
    )?.notes ?? [];

  function toggleTag(tag: string) {
    if (!focusedPlayer) return;
    const existing = phaseNotes.find((note) => note.text === tag);
    runDayEdit(() => {
      if (existing) {
        removePlayerDayNote(game.id, focusedPlayer.id, activeDay, existing.id, activePhase);
      } else {
        addPlayerDayNote(game.id, focusedPlayer.id, activeDay, tag, activePhase);
      }
    });
  }

  return (
    <View style={styles.row}>
      {QUICK_TAGS.map((tag) => (
        <TagChip
          active={phaseNotes.some((note) => note.text === tag)}
          key={tag}
          onPress={() => toggleTag(tag)}
          playerName={focusedPlayer.name}
          tag={tag}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: colors.gameText, borderColor: colors.gameText },
  chipPressed: { backgroundColor: colors.gameSurfacePressed },
  chipText: { color: colors.gameTextSoft, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: colors.gameBackground },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});

function TagChip({
  active,
  onPress,
  playerName,
  tag,
}: {
  active: boolean;
  onPress: () => void;
  playerName: string;
  tag: string;
}) {
  return (
    <Pressable
      accessibilityHint={active ? 'Removes this note' : 'Adds this as a note for now'}
      accessibilityLabel={`${tag} note for ${playerName}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && !active && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
    </Pressable>
  );
}
