import { Check, Search, Users, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';

type FriendPlayerPickerProps = {
  friends: FriendSummary[];
  onDone: (selectedFriendIds: string[]) => void;
  selectedFriendIds: string[];
};

export function FriendPlayerPicker({
  friends,
  onDone,
  selectedFriendIds,
}: FriendPlayerPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draftSelectedFriendIds, setDraftSelectedFriendIds] = useState<string[]>([]);
  const selectedFriendIdSet = useMemo(
    () => new Set(draftSelectedFriendIds),
    [draftSelectedFriendIds],
  );
  const selectedFriends = useMemo(
    () =>
      draftSelectedFriendIds.flatMap((friendId) => {
        const friend = friends.find((candidate) => candidate.id === friendId);
        return friend ? [friend] : [];
      }),
    [draftSelectedFriendIds, friends],
  );
  const unselectedFriends = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return friends.filter(
      (friend) =>
        !selectedFriendIdSet.has(friend.id) &&
        (!normalizedQuery || friend.name.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [friends, searchQuery, selectedFriendIdSet]);
  const visibleFriends = [...selectedFriends, ...unselectedFriends];

  function openPicker() {
    setDraftSelectedFriendIds(
      selectedFriendIds.filter((friendId) => friends.some((friend) => friend.id === friendId)),
    );
    setSearchQuery('');
    setOpen(true);
  }

  function closePicker() {
    setOpen(false);
    setSearchQuery('');
  }

  function handleDone() {
    onDone(draftSelectedFriendIds);
    closePicker();
  }

  function toggleFriend(friendId: string) {
    setDraftSelectedFriendIds((currentIds) =>
      currentIds.includes(friendId)
        ? currentIds.filter((currentId) => currentId !== friendId)
        : [...currentIds, friendId],
    );
  }

  const selectionSummary =
    selectedFriendIds.length === 0
      ? 'No friends selected'
      : `${selectedFriendIds.length} ${selectedFriendIds.length === 1 ? 'friend' : 'friends'} selected`;

  return (
    <>
      <Pressable
        accessibilityLabel={`Choose friends: ${selectionSummary}`}
        accessibilityRole="button"
        disabled={friends.length === 0}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.trigger,
          friends.length === 0 ? styles.triggerDisabled : pressed ? styles.triggerPressed : null,
        ]}
      >
        <Users
          color={friends.length === 0 ? colors.onDisabled : colors.text}
          size={18}
          strokeWidth={2.5}
        />
        <View style={styles.triggerText}>
          <Text
            selectable
            style={[styles.triggerTitle, friends.length === 0 && styles.disabledText]}
          >
            Choose friends
          </Text>
          <Text
            selectable
            style={[styles.triggerDescription, friends.length === 0 && styles.disabledText]}
          >
            {friends.length === 0 ? 'No friends yet' : selectionSummary}
          </Text>
        </View>
      </Pressable>

      <Modal animationType="slide" onRequestClose={closePicker} transparent visible={open}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Cancel choosing friends"
            accessibilityRole="button"
            onPress={closePicker}
            style={styles.dismissArea}
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.titleGroup}>
                <Text selectable style={styles.title}>
                  Choose friends
                </Text>
                <Text selectable style={styles.description}>
                  Select players in clockwise seat order. You are #1.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Cancel choosing friends"
                accessibilityRole="button"
                hitSlop={8}
                onPress={closePicker}
                style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
              <TextInput
                accessibilityLabel="Search friends"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setSearchQuery}
                placeholder="Search friends"
                placeholderTextColor={colors.textSubtle}
                returnKeyType="search"
                style={styles.searchInput}
                value={searchQuery}
              />
            </View>

            <ScrollView
              contentContainerStyle={styles.options}
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              style={styles.scroll}
            >
              {visibleFriends.length > 0 ? (
                visibleFriends.map((friend) => {
                  const selected = selectedFriendIdSet.has(friend.id);
                  const selectionNumber = selected
                    ? draftSelectedFriendIds.indexOf(friend.id) + 2
                    : undefined;

                  return (
                    <Animated.View key={friend.id} layout={LinearTransition.duration(220)}>
                      <Pressable
                        accessibilityLabel={
                          selected
                            ? `Remove ${friend.name} from player ${selectionNumber}`
                            : `Select ${friend.name} as the next player`
                        }
                        accessibilityRole="button"
                        onPress={() => toggleFriend(friend.id)}
                        style={({ pressed }) => [
                          styles.option,
                          selected && styles.optionSelected,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        {selected ? (
                          <View style={styles.selectionBadge}>
                            <Text selectable style={styles.selectionBadgeText}>
                              #{selectionNumber}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.unselectedBadge} />
                        )}
                        <View style={styles.optionText}>
                          <Text selectable style={styles.optionName}>
                            {friend.name}
                          </Text>
                          <Text selectable style={styles.optionDescription}>
                            {friend.gamesPlayed} {friend.gamesPlayed === 1 ? 'game' : 'games'}{' '}
                            played
                          </Text>
                        </View>
                        {selected ? (
                          <Check color={colors.primary} size={18} strokeWidth={3} />
                        ) : null}
                      </Pressable>
                    </Animated.View>
                  );
                })
              ) : (
                <Text selectable style={styles.emptyText}>
                  {friends.length === 0
                    ? 'Add a friend before choosing players.'
                    : 'No friends found.'}
                </Text>
              )}
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={closePicker}
                style={({ pressed }) => [styles.action, pressed && styles.buttonPressed]}
              >
                <Text selectable style={styles.actionText}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Done choosing friends"
                accessibilityRole="button"
                onPress={handleDone}
                style={({ pressed }) => [
                  styles.action,
                  styles.doneAction,
                  pressed && styles.donePressed,
                ]}
              >
                <Text selectable style={styles.doneText}>
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  actionText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10 },
  backdrop: { backgroundColor: '#00000099', flex: 1, justifyContent: 'flex-end' },
  buttonPressed: { backgroundColor: colors.surfacePressed },
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
  doneAction: { backgroundColor: colors.primary, borderColor: colors.primary },
  donePressed: { backgroundColor: colors.surfacePressed, borderColor: colors.border },
  doneText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800' },
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
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionDescription: { color: colors.textMuted, fontSize: 12 },
  optionName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  optionSelected: { borderColor: colors.primary },
  optionText: { flex: 1, gap: 3 },
  options: { gap: 8, paddingBottom: 2 },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  searchInput: { color: colors.text, flex: 1, fontSize: 16, paddingVertical: 10 },
  scroll: { flex: 1, minHeight: 120 },
  selectionBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 6,
    justifyContent: 'center',
    minWidth: 42,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  selectionBadgeText: { color: colors.onPrimary, fontSize: 13, fontWeight: '900' },
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
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  triggerDescription: { color: colors.textMuted, fontSize: 12 },
  triggerDisabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  triggerPressed: { backgroundColor: colors.surfacePressed },
  triggerText: { flex: 1, gap: 2 },
  triggerTitle: { color: colors.text, fontWeight: '800' },
  unselectedBadge: {
    borderColor: colors.borderStrong,
    borderRadius: 6,
    borderWidth: 1,
    height: 24,
    width: 42,
  },
  disabledText: { color: colors.onDisabled },
});
