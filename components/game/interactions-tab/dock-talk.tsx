import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { TrackingConfirmActions } from '@/components/game/interactions-tab/tracking-confirm-actions';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';

/** The talk being tracked, in the player dock: who is talking and its Cancel / Confirm. */
export function DockTalk() {
  const { players, selectedPlayerIds } = useGameRouteContext();

  return (
    <View style={styles.section}>
      <Text numberOfLines={1} style={styles.title}>
        {getTalkTitle(players, selectedPlayerIds)}
      </Text>
      <Text numberOfLines={1} style={styles.hint}>
        Tap who they talked with on the map
      </Text>
      <TrackingConfirmActions />
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.gameTextMuted, fontSize: 12, fontWeight: '700', marginBottom: 3 },
  section: { gap: 1 },
  title: { color: colors.gameText, fontSize: 15, fontWeight: '900' },
});

/** "Alice talks with Bob, Cara", from the players picked so far. */
function getTalkTitle(players: Player[], selectedPlayerIds: string[]) {
  const names = selectedPlayerIds.map(
    (playerId) => players.find((player) => player.id === playerId)?.name ?? 'Someone',
  );
  const [initiator = 'Someone', ...others] = names;
  return others.length > 0
    ? `${initiator} talks with ${others.join(', ')}`
    : `${initiator} talks with…`;
}
