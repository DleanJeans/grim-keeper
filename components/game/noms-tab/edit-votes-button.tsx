import { Pencil } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type EditVotesButtonProps = {
  onPress: () => void;
  voteCount: number;
  /** Votes needed to put the nominee on the block, shown as "3/4 votes". */
  votesNeeded?: number;
};

export function EditVotesButton({ onPress, voteCount, votesNeeded }: EditVotesButtonProps) {
  const votesLabel =
    votesNeeded === undefined
      ? `${voteCount} ${voteCount === 1 ? 'vote' : 'votes'}`
      : `${voteCount}/${votesNeeded} votes`;
  const accessibilityVotes =
    votesNeeded === undefined ? votesLabel : `${voteCount} of ${votesNeeded} votes needed`;

  return (
    <Pressable
      accessibilityLabel={`Edit votes, ${accessibilityVotes}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Pencil color={colors.text} size={15} strokeWidth={2.6} />
      <Text style={styles.label}>{votesLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
});
