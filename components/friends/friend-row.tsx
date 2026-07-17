import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';

type FriendRowProps = {
  friend: FriendSummary;
};

export function FriendRow({ friend }: FriendRowProps) {
  return (
    <Pressable
      accessibilityHint="Opens this friend's details"
      accessibilityLabel={`${friend.name}, ${friend.gamesPlayed} ${friend.gamesPlayed === 1 ? 'game' : 'games'}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/friends/[id]', params: { id: friend.id } })}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 12,
        minHeight: 58,
        opacity: pressed ? 0.65 : 1,
        padding: 16,
      })}
    >
      <View style={{ gap: 8 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
          <Text selectable style={{ color: colors.text, flex: 1, fontSize: 17, fontWeight: '800' }}>
            {friend.name}
          </Text>
          <Text
            selectable
            style={{ color: colors.textMuted, fontSize: 14, fontVariant: ['tabular-nums'] }}
          >
            {friend.gamesPlayed} {friend.gamesPlayed === 1 ? 'game' : 'games'}
          </Text>
          <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
        </View>
        <FriendNotes friendId={friend.id} notes={friend.notes} />
      </View>
    </Pressable>
  );
}

export function FriendNotes({ friendId, notes }: { friendId: string; notes?: string[] }) {
  if (!notes?.length) {
    return null;
  }

  return (
    <View style={{ gap: 3 }}>
      <Text
        selectable
        style={{
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '900',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        Notes
      </Text>
      {notes.map((note) => (
        <Text
          key={`${friendId}-note-${note}`}
          selectable
          style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}
        >
          {note}
        </Text>
      ))}
    </View>
  );
}
