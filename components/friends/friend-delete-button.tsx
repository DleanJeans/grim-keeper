import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { Text } from '@/components/text';
import { useDjStore } from '@/store/dj-store';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';

type FriendDeleteButtonProps = {
  friendId: string;
  friendName: string;
  noteCount: number;
};

/** Deletes a friend who is not in any game, after a confirmation. */
export function FriendDeleteButton({ friendId, friendName, noteCount }: FriendDeleteButtonProps) {
  const router = useRouter();
  const showDialog = useAppDialog();
  const deleteFriend = useGameStore((state) => state.deleteFriend);
  const removeDjFriendTarget = useDjStore((state) => state.removeFriendTarget);

  const handleDelete = () => {
    if (deleteFriend(friendId)) {
      removeDjFriendTarget(friendId);
      router.back();
    }
  };

  const handlePress = () => {
    const notesMessage = noteCount
      ? ` Their ${noteCount === 1 ? 'saved note stays' : 'saved notes stay'} in your notes.`
      : '';
    showDialog(
      'Delete friend?',
      `${friendName} will be removed from your friends.${notesMessage}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ],
    );
  };

  return (
    <Pressable
      accessibilityLabel={`Delete ${friendName}`}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Trash2 color={colors.danger} size={18} strokeWidth={2.4} />
      <Text style={styles.label}>Delete friend</Text>
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
    gap: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  label: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '800',
  },
});
