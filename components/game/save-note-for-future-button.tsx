import { BookmarkPlus } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { colors } from '@/theme/colors';

export function SaveNoteForFutureButton({
  disabled,
  onPress,
  playerName,
  day,
}: {
  day: number;
  disabled: boolean;
  onPress: () => void;
  playerName: string;
}) {
  return (
    <Pressable
      accessibilityLabel={`Save day ${day} note for ${playerName} for future games`}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        borderRadius: 6,
        justifyContent: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
        paddingHorizontal: 6,
        paddingVertical: 4,
      })}
    >
      <BookmarkPlus color={colors.textMuted} size={14} strokeWidth={2.5} />
    </Pressable>
  );
}
