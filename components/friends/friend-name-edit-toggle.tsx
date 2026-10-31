import { PenLine, X } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { friendNameButtonStyles } from '@/components/friends/friend-name-button-styles';
import { colors } from '@/theme/colors';

export function FriendNameEditToggle({
  editing,
  friendName,
  onToggleEditing,
}: {
  editing: boolean;
  friendName: string;
  onToggleEditing: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={
        editing ? `Cancel editing ${friendName}'s name` : `Edit ${friendName}'s name`
      }
      accessibilityRole="button"
      hitSlop={8}
      onPress={onToggleEditing}
      style={({ pressed }) => [
        friendNameButtonStyles.button,
        pressed && friendNameButtonStyles.buttonPressed,
      ]}
    >
      {editing ? (
        <X color={colors.text} size={18} strokeWidth={2.6} />
      ) : (
        <PenLine color={colors.text} size={18} strokeWidth={2.6} />
      )}
    </Pressable>
  );
}
