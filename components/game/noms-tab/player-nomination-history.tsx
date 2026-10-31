import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import {
  getPlayerNominationHistory,
  getVotingBuddies,
  type PlayerNominationDay,
  type VotingBuddy,
} from '@/utils/nomination-utils';

/** Voting matches listed for the focused player. */
const BUDDY_COUNT = 3;

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
  const buddies = getVotingBuddies(conversations, players, focusedPlayer.id, activeDayCutoff).slice(
    0,
    BUDDY_COUNT,
  );

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{focusedPlayer.name}’s nominations and votes</Text>
      {buddies.length > 0 ? (
        <View style={styles.day}>
          <Text style={styles.dayLabel}>Votes most like {focusedPlayer.name}</Text>
          {buddies.map((buddy) => (
            <BuddyLine buddy={buddy} key={buddy.player.id} />
          ))}
        </View>
      ) : null}
      {history.map((entry) => (
        <HistoryDay entry={entry} key={entry.day} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  buddyCount: { color: colors.textMuted, fontSize: 14, fontVariant: ['tabular-nums'] },
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

function BuddyLine({ buddy }: { buddy: VotingBuddy }) {
  return (
    <View style={styles.line}>
      <Text selectable style={styles.lineValue}>
        {buddy.player.name}
      </Text>
      <Text style={styles.buddyCount}>{`same vote ${buddy.agreed} of ${buddy.total}`}</Text>
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
