import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { getNeverTalkedRows, type NeverTalkedRow } from '@/utils/conversation-utils';

/**
 * Who each player has never talked with on any day so far, so evil players keeping apart stand
 * out. With a player focused, only their row shows.
 */
export function NeverTalked() {
  const { activeDayCutoff, conversations, focusedPlayerId, players } = useGameRouteContext();
  if (activeDayCutoff < 1) {
    return null;
  }

  const { rows, silent } = getNeverTalkedRows(conversations, players, activeDayCutoff);
  const visibleRows = focusedPlayerId
    ? rows.filter((row) => row.player.id === focusedPlayerId)
    : rows;
  const visibleSilent = focusedPlayerId
    ? silent.filter((player) => player.id === focusedPlayerId)
    : silent;
  if (visibleRows.length === 0 && visibleSilent.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Never talked{activeDayCutoff > 1 ? ` (Day 1 to ${activeDayCutoff})` : ''}
      </Text>
      {visibleRows.map((row) => (
        <NeverTalkedLine key={row.player.id} row={row} />
      ))}
      {visibleSilent.length > 0 ? (
        <Text selectable style={styles.line}>
          <Text style={styles.silentLabel}>No talks yet: </Text>
          {visibleSilent.map((player) => player.name).join(', ')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  line: { color: colors.gameTextSoft, fontSize: 13, lineHeight: 18 },
  name: { color: colors.gameText, fontWeight: '800' },
  silentLabel: { color: colors.gameTextMuted, fontWeight: '800' },
  title: {
    color: colors.gameTextMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

function NeverTalkedLine({ row }: { row: NeverTalkedRow }) {
  return (
    <Text selectable style={styles.line}>
      <Text style={styles.name}>{row.player.name}: </Text>
      {row.notTalkedWith.map((player) => player.name).join(', ')}
    </Text>
  );
}
