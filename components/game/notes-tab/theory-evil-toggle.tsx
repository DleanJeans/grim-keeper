import { Skull } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';
import { getActiveTheoryEvilIds } from '@/utils/theory-utils';

type TheoryEvilToggleProps = {
  player: Player;
};

/** Marks the focused player evil (or not) in the selected theory. Hidden with no theory selected. */
export function TheoryEvilToggle({ player }: TheoryEvilToggleProps) {
  const { game, showRoles } = useGameRouteContext();
  const toggleTheoryEvil = useGameStore((state) => state.toggleTheoryEvil);
  const activeId = game.activeTheoryId;

  if (!showRoles || !activeId) {
    return null;
  }

  const evil = getActiveTheoryEvilIds(game).includes(player.id);

  return (
    <Pressable
      accessibilityLabel={`Evil in this theory: ${player.name}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: evil }}
      onPress={() => toggleTheoryEvil(game.id, activeId, player.id)}
      style={({ pressed }) => [styles.button, evil && styles.buttonOn, pressed && styles.pressed]}
    >
      <Skull color={evil ? colors.theoryEvil : colors.gameTextMuted} size={16} strokeWidth={2.4} />
      <Text style={[styles.label, evil && styles.labelOn]}>
        {evil ? 'Evil in this theory' : 'Mark evil in this theory'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  buttonOn: { borderColor: colors.theoryEvil },
  label: { color: colors.gameTextSoft, fontSize: 14, fontWeight: '800' },
  labelOn: { color: colors.theoryEvil },
  pressed: { opacity: 0.7 },
});
