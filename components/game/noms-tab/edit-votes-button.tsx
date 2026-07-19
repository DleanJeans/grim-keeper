import { Pencil } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type EditVotesButtonProps = {
  onPress: () => void;
  voteCount: number;
};

export function EditVotesButton({ onPress, voteCount }: EditVotesButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`Edit ${voteCount} votes`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Pencil color={colors.text} size={15} strokeWidth={2.6} />
      <Text style={styles.label}>{voteCount} votes</Text>
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
