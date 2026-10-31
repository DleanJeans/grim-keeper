import { CheckCheck } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getClaimsToConfirm } from '@/utils/claim-note-utils';

/** Turns every single, unconfirmed claim into a confirm for the phase on screen. */
export function ConfirmClaimsButton() {
  const { activeDay, activePhase, game, runDayEdit } = useGameRouteContext();
  const setPlayerRoleAssignment = useGameStore((state) => state.setPlayerRoleAssignment);
  const claims = getClaimsToConfirm(game, activeDay, activePhase);

  if (claims.length === 0) {
    return null;
  }

  function handlePress() {
    runDayEdit(() => {
      for (const claim of claims) {
        setPlayerRoleAssignment(
          game.id,
          claim.playerId,
          activeDay,
          'confirm',
          [claim.roleId],
          undefined,
          activePhase,
        );
      }
    });
  }

  const label = `Confirm ${claims.length} unconfirmed ${claims.length === 1 ? 'claim' : 'claims'}`;

  return (
    <Pressable
      accessibilityHint="Sets each player's claimed character as confirmed. Multi-claims are skipped."
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <CheckCheck color={colors.gameText} size={16} strokeWidth={2.4} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.gameSurfaceRaised,
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  buttonPressed: { backgroundColor: colors.gameSurfacePressed },
  label: { color: colors.gameText, fontSize: 14, fontWeight: '800' },
});
