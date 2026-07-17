import { BookmarkPlus } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getFriendByName } from '@/utils/friend-utils';

export function SaveNoteForFutureButton({
  disabled,
  onPress,
  playerName,
  roleIds,
  text,
  day,
}: {
  day: number;
  disabled: boolean;
  onPress: () => boolean;
  playerName: string;
  roleIds: string[];
  text: string;
}) {
  const { game } = useGameRouteContext();
  const friends = useGameStore((state) => state.friends);
  const savedText = text.trim();
  const friendNotes = getFriendByName(friends, playerName)?.notes;
  const savedForFriend = !!savedText && !!friendNotes?.includes(savedText);
  const savedForRole =
    !!savedText &&
    roleIds.some((roleId) =>
      game.script?.roles.find((role) => role.id === roleId)?.notes?.includes(savedText),
    );
  const saved = savedForFriend || savedForRole;
  const iconColor = saved ? '#fbbf24' : colors.textMuted;

  return (
    <Pressable
      accessibilityLabel={
        saved
          ? `Day ${day} note for ${playerName} saved for future games`
          : `Save day ${day} note for ${playerName} for future games`
      }
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: saved }}
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
      <BookmarkPlus
        color={iconColor}
        fill={saved ? iconColor : 'none'}
        size={14}
        strokeWidth={2.5}
      />
    </Pressable>
  );
}
