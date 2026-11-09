import { Check, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { confirmRowStyle, onDarkText, solidActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { GENERIC_KILLER_ROLES, getRoleNames } from '@/utils/role-utils';

/** The kill being logged, in the player dock: the picked killers and its Cancel / Confirm. */
export function DockKill() {
  const { focusedPlayer, game, handleConfirmKill, killerRoleIds, setKillAttributionOpen } =
    useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);

  if (!focusedPlayer) {
    return null;
  }

  const roles = [...GENERIC_KILLER_ROLES, ...(game.script?.roles ?? []), ...roleCatalog];
  const killers = getRoleNames(killerRoleIds, roles).join(', ');

  return (
    <View style={styles.section}>
      <Text numberOfLines={1} style={styles.title}>
        Kill {focusedPlayer.name}
      </Text>
      <Text numberOfLines={1} style={styles.hint}>
        {killers ? `By ${killers}` : 'Pick the killer on the Deaths tab, or skip it'}
      </Text>
      <View style={confirmRowStyle}>
        <Pressable
          accessibilityLabel="Cancel kill"
          accessibilityRole="button"
          onPress={() => setKillAttributionOpen(false)}
          style={solidActionStyle({ backgroundColor: colors.gameBorder, flex: 1 })}
        >
          <X color={colors.gameText} size={17} strokeWidth={2.7} />
          <Text style={onDarkText}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={handleConfirmKill}
          style={solidActionStyle({ backgroundColor: colors.gameConfirm, flex: 1 })}
        >
          <Check color={colors.gameText} size={17} strokeWidth={2.7} />
          <Text style={onDarkText}>Confirm Kill</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.gameTextMuted, fontSize: 12, fontWeight: '700', marginBottom: 3 },
  section: { gap: 1 },
  title: { color: colors.gameText, fontSize: 15, fontWeight: '900' },
});
