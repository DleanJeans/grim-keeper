import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { friendNameButtonStyles } from '@/components/friends/friend-name-button-styles';
import { colors } from '@/theme/colors';

export function FriendNameSaveButton({
  canSave,
  onPress,
}: {
  canSave: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel="Save friend name"
      accessibilityRole="button"
      disabled={!canSave}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        friendNameButtonStyles.button,
        styles.button,
        pressed && friendNameButtonStyles.buttonPressed,
        !canSave && styles.buttonDisabled,
      ]}
    >
      <Check color={canSave ? colors.onPrimary : colors.onDisabled} size={18} strokeWidth={2.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
});
