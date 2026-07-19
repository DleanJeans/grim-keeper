import { Trash2 } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

type DeleteNominationButtonProps = {
  onDelete: () => void;
};

export function DeleteNominationButton({ onDelete }: DeleteNominationButtonProps) {
  const handlePress = () => {
    Alert.alert('Delete nomination?', 'This removes the nomination and votes.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Pressable
      accessibilityLabel="Delete nomination"
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Trash2 color={colors.danger} size={15} strokeWidth={2.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
});
