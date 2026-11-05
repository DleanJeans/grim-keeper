import { StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type GhostVotesNoteProps = {
  /** Dead players who still have their vote. */
  ghostVoterNames: string[];
};

/** At final 3: execute the Demon today or evil wins, and who can still vote while dead. */
export function GhostVotesNote({ ghostVoterNames }: GhostVotesNoteProps) {
  return (
    <Text selectable style={styles.text}>
      Execute the Demon today or evil wins.{' '}
      {ghostVoterNames.length === 0
        ? 'No ghost votes left.'
        : `Ghost votes left: ${ghostVoterNames.join(', ')}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.warning, fontSize: 12, fontWeight: '700' },
});
