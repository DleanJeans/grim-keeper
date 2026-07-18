import { router } from 'expo-router';
import { BookmarkPlus } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getFriendByName } from '@/utils/friend-utils';
import { getSavedNote } from '@/utils/saved-note-utils';

export function SaveNoteForFutureButton({
  disabled,
  playerId,
  playerName,
  text,
  day,
}: {
  day: number;
  disabled: boolean;
  playerId: string;
  playerName: string;
  text: string;
}) {
  const { game } = useGameRouteContext();
  const friends = useGameStore((state) => state.friends);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const savedText = text.trim();
  const savedNote = getSavedNote(savedNotes, playerName, savedText);
  const friendNotes = getFriendByName(friends, playerName)?.notes;
  const savedForFriend = !!savedText && !!friendNotes?.some((note) => note.text === savedText);
  const savedForRole =
    !!savedText && !!game.script?.roles.some((role) => role.notes?.includes(savedText));
  const saved = !!savedNote || savedForFriend || savedForRole;
  const iconColor = saved ? '#fbbf24' : colors.textMuted;

  function handlePress() {
    router.push({
      pathname: '/save-note-for-future',
      params: { day: String(day), gameId: game.id, playerId, text },
    });
  }

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
      onPress={handlePress}
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
