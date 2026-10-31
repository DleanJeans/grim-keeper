import { Plus, Trash2, TriangleAlert } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getAutomaticCharacterTypeCounts } from '@/utils/evil-in-play-utils';
import { getActiveTheoryEvilIds, getTheoryLabel, getTheoryWarnings } from '@/utils/theory-utils';

/**
 * Saved "worlds" of who might be evil. The selected one rings its evil players on the map; mark
 * players from their Roles tab. Shown only while Show roles is on.
 */
export function TheoriesSection() {
  const { activeDay, activePhase, game, showRoles } = useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const addTheory = useGameStore((state) => state.addTheory);
  const deleteTheory = useGameStore((state) => state.deleteTheory);
  const setActiveTheory = useGameStore((state) => state.setActiveTheory);

  if (!showRoles) {
    return null;
  }

  const theories = game.theories ?? [];
  const activeId = game.activeTheoryId;
  const playingPlayers = game.players.filter((player) => !player.isStoryteller);
  const counts = game.characterTypeCounts ?? getAutomaticCharacterTypeCounts(playingPlayers.length);
  const warnings = activeId
    ? getTheoryWarnings(
        getActiveTheoryEvilIds(game),
        playingPlayers,
        [...(game.script?.roles ?? []), ...roleCatalog],
        activeDay,
        activePhase,
        counts.minions + counts.demons,
      )
    : [];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Theories</Text>
      <View style={styles.chips}>
        {theories.map((theory) => (
          <TheoryChip
            active={theory.id === activeId}
            key={theory.id}
            label={getTheoryLabel(theory.evilPlayerIds, playingPlayers)}
            onPress={() => setActiveTheory(game.id, theory.id === activeId ? undefined : theory.id)}
          />
        ))}
        <Pressable
          accessibilityLabel="New theory"
          accessibilityRole="button"
          onPress={() => addTheory(game.id)}
          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
        >
          <Plus color={colors.gameTextSoft} size={14} strokeWidth={2.6} />
          <Text style={styles.chipText}>New</Text>
        </Pressable>
        {activeId ? (
          <Pressable
            accessibilityLabel="Delete selected theory"
            accessibilityRole="button"
            onPress={() => deleteTheory(game.id, activeId)}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          >
            <Trash2 color={colors.danger} size={14} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>
      {activeId ? (
        <Text style={styles.hint}>
          Tap a player to mark them evil in this theory. Evil players get a red ring on the map.
        </Text>
      ) : null}
      {warnings.map((warning) => (
        <View key={warning} style={styles.warning}>
          <TriangleAlert color={colors.warning} size={13} strokeWidth={2.6} />
          <Text selectable style={styles.warningText}>
            {warning}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: colors.gameText, borderColor: colors.gameText },
  chipPressed: { opacity: 0.7 },
  chipText: { color: colors.gameTextSoft, fontSize: 13, fontWeight: '800' },
  chipTextActive: { color: colors.gameBackground },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { color: colors.gameTextMuted, fontSize: 12, lineHeight: 17 },
  section: { gap: 8 },
  warning: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  warningText: { color: colors.warning, flexShrink: 1, fontSize: 12, fontWeight: '700' },
  title: {
    color: colors.noteDayHeader,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

function TheoryChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`Theory: ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}
