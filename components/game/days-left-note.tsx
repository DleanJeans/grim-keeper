import { Hourglass, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { getDaysLeft } from '@/utils/nomination-utils';

type DaysLeftNoteProps = {
  alivePlayerCount: number;
  /** Dead players who still have their vote, listed at final 3. */
  ghostVoterNames?: string[];
};

/** How many days are left with daily executions, and a warning at final 3. Day phase only. */
export function DaysLeftNote({ alivePlayerCount, ghostVoterNames = [] }: DaysLeftNoteProps) {
  const daysLeft = getDaysLeft(alivePlayerCount);
  if (daysLeft === 0) {
    return null;
  }

  const finalThree = alivePlayerCount === 3;
  const Icon = finalThree ? TriangleAlert : Hourglass;
  const message = finalThree
    ? 'Final 3: execute the Demon today or evil wins'
    : daysLeft === 1
      ? 'Last day unless today’s execution ends the game'
      : `${daysLeft} days left with an execution each day`;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Icon
          color={finalThree ? colors.warning : colors.gameTextMuted}
          size={13}
          strokeWidth={2.6}
        />
        <Text selectable style={[styles.text, finalThree && styles.warningText]}>
          {message}
        </Text>
      </View>
      {finalThree ? (
        <Text selectable style={styles.ghostVotes}>
          {ghostVoterNames.length === 0
            ? 'No ghost votes left'
            : `Ghost votes left: ${ghostVoterNames.join(', ')}`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 2 },
  ghostVotes: { color: colors.gameTextMuted, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 5, justifyContent: 'center' },
  text: { color: colors.gameTextMuted, flexShrink: 1, fontSize: 12, fontWeight: '700' },
  warningText: { color: colors.warning },
});
