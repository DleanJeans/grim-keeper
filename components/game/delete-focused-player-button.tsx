import { Pressable } from 'react-native';
import { Text } from '@/components/text';

type DeleteFocusedPlayerButtonProps = {
  isAppUser: boolean;
  onConfirm: () => void;
  playerName: string;
};

export function DeleteFocusedPlayerButton({
  isAppUser,
  onConfirm,
  playerName,
}: DeleteFocusedPlayerButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`Delete ${playerName}`}
      accessibilityRole="button"
      disabled={isAppUser}
      onPress={onConfirm}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: isAppUser ? '#1f2937' : pressed ? '#2a1517' : '#111827',
        borderColor: isAppUser ? '#334155' : '#fca5a5',
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 6,
        opacity: isAppUser ? 0.48 : 1,
        paddingHorizontal: 10,
        paddingVertical: 7,
      })}
    >
      <Text style={{ color: isAppUser ? '#94a3b8' : '#fca5a5', fontSize: 13, fontWeight: '900' }}>
        Remove
      </Text>
    </Pressable>
  );
}
