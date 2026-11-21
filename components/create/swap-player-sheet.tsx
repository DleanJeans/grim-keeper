import { UserPlus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { KeyboardAvoidingView } from '@/components/keyboard-avoiding-view';
import { ScaledModal } from '@/components/scaled-modal';
import { SearchBox } from '@/components/search-box';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { hasFriendName } from '@/utils/friend-utils';

type SwapPlayerSheetProps = {
  /** Friends who can take the seat: everyone not already in the game. */
  friends: FriendSummary[];
  /** Creates the friend and returns it, or undefined when it can't be added. */
  onAddFriend: (name: string) => FriendSummary | undefined;
  onClose: () => void;
  onSwap: (friend: FriendSummary) => void;
  /** Name of the player being replaced; the sheet is closed while unset. */
  playerName?: string;
};

/** Picks the friend who replaces a player; they keep the seat and everything logged for it. */
export function SwapPlayerSheet({
  friends,
  onAddFriend,
  onClose,
  onSwap,
  playerName,
}: SwapPlayerSheetProps) {
  const [query, setQuery] = useState('');
  const visibleFriends = useMemo(() => {
    const key = query.trim().toLocaleLowerCase();
    return friends.filter((friend) => !key || friend.name.toLocaleLowerCase().includes(key));
  }, [friends, query]);
  const newName = normalizePlayerName(query);
  const canAdd = newName.length > 0 && !hasFriendName(friends, newName);

  function close() {
    setQuery('');
    onClose();
  }

  function handleSwap(friend: FriendSummary) {
    setQuery('');
    onSwap(friend);
  }

  function handleAdd() {
    const friend = canAdd ? onAddFriend(newName) : undefined;
    if (friend) {
      handleSwap(friend);
    }
  }

  return (
    <ScaledModal animationType="slide" onRequestClose={close} transparent visible={!!playerName}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityLabel="Cancel swapping player"
          accessibilityRole="button"
          onPress={close}
          style={styles.dismissArea}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <Text selectable style={styles.title}>
                Swap {playerName}
              </Text>
              <Text selectable style={styles.description}>
                The friend you pick takes over this seat with its role, claims, deaths, votes and
                notes.
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Cancel swapping player"
              accessibilityRole="button"
              hitSlop={8}
              onPress={close}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <X color={colors.textMuted} size={18} strokeWidth={2.5} />
            </Pressable>
          </View>
          <SearchBox label="Search or add friends" onChangeText={setQuery} value={query} />
          <ScrollView
            contentContainerStyle={styles.options}
            keyboardShouldPersistTaps="handled"
            style={styles.scroll}
          >
            {visibleFriends.map((friend) => (
              <Pressable
                accessibilityLabel={`Swap in ${friend.name}`}
                accessibilityRole="button"
                key={friend.id}
                onPress={() => handleSwap(friend)}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}
              >
                <Text selectable style={styles.optionName}>
                  {friend.name}
                </Text>
                <Text selectable style={styles.optionDescription}>
                  {friend.gamesPlayed} {friend.gamesPlayed === 1 ? 'game' : 'games'} played
                </Text>
              </Pressable>
            ))}
            {canAdd ? (
              <Pressable
                accessibilityLabel={`Add ${newName} as a new friend and swap them in`}
                accessibilityRole="button"
                onPress={handleAdd}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}
              >
                <UserPlus color={colors.primary} size={16} strokeWidth={2.5} />
                <Text selectable style={styles.optionName}>
                  Add "{newName}"
                </Text>
              </Pressable>
            ) : visibleFriends.length === 0 ? (
              <Text selectable style={styles.emptyText}>
                No friends found.
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScaledModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.backdrop, flex: 1, justifyContent: 'flex-end' },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  dismissArea: { flex: 1 },
  emptyText: { color: colors.textMuted, fontSize: 14, lineHeight: 20, paddingVertical: 12 },
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  option: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionDescription: { color: colors.textMuted, fontSize: 12 },
  optionName: { color: colors.text, flexShrink: 1, fontSize: 15, fontWeight: '800' },
  options: { gap: 8, paddingBottom: 2 },
  pressed: { backgroundColor: colors.surfacePressed },
  scroll: { flex: 1 },
  sheet: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    height: '100%',
    padding: 16,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  titleGroup: { flex: 1, gap: 3 },
});
