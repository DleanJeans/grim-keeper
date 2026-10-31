import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { getPlayerNominationHistory, type PlayerNominationDay } from '@/utils/nomination-utils';

/** The focused player's nominations and votes on every day so far. */
export function PlayerNominationHistory() {
  const { activeDayCutoff, conversations, focusedPlayer, players } = useGameRouteContext();

  if (!focusedPlayer) {
    return null;
  }

  const history = getPlayerNominationHistory(
    conversations,
    players,
    focusedPlayer.id,
    activeDayCutoff,
  );
  if (history.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{focusedPlayer.name}’s nominations and votes</Text>
      {history.map((entry) => (
        <HistoryDay entry={entry} key={entry.day} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  day: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  dayLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  line: { flexDirection: 'row', gap: 6 },
  lineLabel: { color: colors.textMuted, fontSize: 14, width: 118 },
  lineValue: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '700' },
  section: { gap: 8 },
  title: {
    color: colors.noteDayHeader,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

function HistoryDay({ entry }: { entry: PlayerNominationDay }) {
  const lines: Array<[string, string[]]> = [
    ['Nominated', entry.nominated],
    ['Nominated by', entry.nominatedBy],
    ['Voted for', entry.votedFor],
    ['Didn’t vote for', entry.didNotVoteFor],
  ];
  return (
    <View style={styles.day}>
      <Text style={styles.dayLabel}>Day {entry.day}</Text>
      {lines
        .filter(([, names]) => names.length > 0)
        .map(([label, names]) => (
          <HistoryLine key={label} label={label} names={names} />
        ))}
    </View>
  );
}

function HistoryLine({ label, names }: { label: string; names: string[] }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text selectable style={styles.lineValue}>
        {names.join(', ')}
      </Text>
    </View>
  );
}
