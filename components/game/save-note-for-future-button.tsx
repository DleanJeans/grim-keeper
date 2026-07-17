import { BookmarkPlus } from 'lucide-react-native';
import { Alert, Pressable } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getFriendByName } from '@/utils/friend-utils';
import { getRolesByIds } from '@/utils/role-utils';
import { getSavedNote } from '@/utils/saved-note-utils';

export function SaveNoteForFutureButton({
  claimedRoleIds,
  confirmedRoleIds,
  disabled,
  onRemove,
  onPress,
  playerName,
  roleIds,
  text,
  day,
}: {
  claimedRoleIds: string[];
  confirmedRoleIds: string[];
  day: number;
  disabled: boolean;
  onRemove: () => boolean;
  onPress: () => boolean;
  playerName: string;
  roleIds: string[];
  text: string;
}) {
  const { game } = useGameRouteContext();
  const friends = useGameStore((state) => state.friends);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const savedText = text.trim();
  const savedNote = getSavedNote(savedNotes, playerName, savedText);
  const friendNotes = getFriendByName(friends, playerName)?.notes;
  const savedForFriend = !!savedText && !!friendNotes?.includes(savedText);
  const savedForRole =
    !!savedText &&
    roleIds.some((roleId) =>
      game.script?.roles.find((role) => role.id === roleId)?.notes?.includes(savedText),
    );
  const savedForCurrentRoles =
    !!savedNote &&
    savedNote.roleIds.length === roleIds.length &&
    roleIds.every((roleId) => savedNote.roleIds.includes(roleId));
  const saved = savedForCurrentRoles || (!savedNote && (savedForFriend || savedForRole));
  const iconColor = saved ? '#fbbf24' : colors.textMuted;

  function handlePress() {
    if (saved) {
      Alert.alert('Remove saved note?', `Remove this note for ${playerName} from future games?`, [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: onRemove, style: 'destructive' },
      ]);
      return;
    }

    const scriptRoles = game.script?.roles ?? [];
    const claimedRoleNames = getRolesByIds(claimedRoleIds, scriptRoles).map((role) => role.name);
    const confirmedRoleNames = getRolesByIds(confirmedRoleIds, scriptRoles).map(
      (role) => role.name,
    );

    Alert.alert(
      'Save note for future games?',
      [
        `Bluffed: ${claimedRoleNames.join(', ') || 'None'}`,
        `Confirmed: ${confirmedRoleNames.join(', ') || 'None'}`,
        '',
        'This note will appear for the roles listed above.',
      ].join('\n'),
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress },
      ],
    );
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
