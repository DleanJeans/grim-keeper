import { Check, ChevronDown, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SearchBox } from '@/components/search-box';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';

type StorytellerPickerProps = {
  friends: FriendSummary[];
  onChange: (friendIds: string[]) => void;
  selectedFriendIds: string[];
};

export function StorytellerPicker({
  friends,
  onChange,
  selectedFriendIds,
}: StorytellerPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedFriends = selectedFriendIds.flatMap((friendId) => {
    const friend = friends.find((candidate) => candidate.id === friendId);
    return friend ? [friend] : [];
  });
  const selectedNames = selectedFriends.map((friend) => friend.name).join(', ');
  const disabled = friends.length === 0;
  const visibleFriends = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return normalizedQuery
      ? friends.filter((friend) => friend.name.toLocaleLowerCase().includes(normalizedQuery))
      : friends;
  }, [friends, searchQuery]);

  function closePicker() {
    setOpen(false);
    setSearchQuery('');
  }

  function handleToggle(friendId: string) {
    onChange(
      selectedFriendIds.includes(friendId)
        ? selectedFriendIds.filter((selectedId) => selectedId !== friendId)
        : [...selectedFriendIds, friendId],
    );
  }

  function handleClear() {
    onChange([]);
    closePicker();
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.label}>
        Storyteller
      </Text>
      <Pressable
        accessibilityLabel={`Storyteller: ${selectedNames || (disabled ? 'No friends yet' : 'None')}`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          disabled && styles.triggerDisabled,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.triggerText}>
          <Text selectable style={styles.triggerTitle}>
            {selectedNames || (disabled ? 'No friends yet' : 'Select friends')}
          </Text>
          <Text selectable style={styles.triggerDescription}>
            {selectedFriends.length > 1
              ? `${selectedFriends.length} selected friends`
              : selectedFriends.length === 1
                ? 'Selected friend'
                : 'Optional game role'}
          </Text>
        </View>
        <ChevronDown
          color={disabled ? colors.onDisabled : colors.textMuted}
          size={18}
          strokeWidth={2.6}
        />
      </Pressable>

      <Modal animationType="slide" onRequestClose={closePicker} transparent visible={open}>
        <KeyboardAvoidingView
          behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
          style={styles.backdrop}
        >
          <Pressable
            accessibilityLabel="Close Storyteller picker"
            accessibilityRole="button"
            onPress={closePicker}
            style={styles.dismissArea}
          />
          <View style={styles.dialog}>
            <View style={styles.dialogHeader}>
              <View style={styles.dialogTitleGroup}>
                <Text selectable style={styles.dialogTitle}>
                  Select Storyteller
                </Text>
                <Text selectable style={styles.dialogDescription}>
                  Choose one or more friends to place in the middle of the game map.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close Storyteller picker"
                accessibilityRole="button"
                onPress={closePicker}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            {friends.length > 0 ? (
              <SearchBox label="Search friends" onChangeText={setSearchQuery} value={searchQuery} />
            ) : null}
            <ScrollView
              contentContainerStyle={styles.options}
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
              style={styles.scroll}
            >
              {visibleFriends.length > 0 ? (
                visibleFriends.map((friend) => {
                  const selected = selectedFriendIds.includes(friend.id);
                  return (
                    <Pressable
                      accessibilityLabel={`${selected ? 'Selected' : 'Select'} ${friend.name} as storyteller`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      key={friend.id}
                      onPress={() => handleToggle(friend.id)}
                      style={({ pressed }) => [
                        styles.option,
                        selected && styles.optionSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.optionText}>
                        <Text selectable style={styles.optionName}>
                          {friend.name}
                        </Text>
                        <Text selectable style={styles.optionDescription}>
                          {friend.gamesStorytold} {friend.gamesStorytold === 1 ? 'game' : 'games'}{' '}
                          as storyteller
                        </Text>
                      </View>
                      {selected ? <Check color={colors.primary} size={18} strokeWidth={3} /> : null}
                    </Pressable>
                  );
                })
              ) : (
                <Text selectable style={styles.emptyText}>
                  {friends.length > 0
                    ? 'No friends match that search.'
                    : 'Add a friend before selecting a storyteller.'}
                </Text>
              )}
            </ScrollView>
            {selectedFriends.length > 0 ? (
              <Pressable
                accessibilityLabel="Clear Storyteller selection"
                accessibilityRole="button"
                onPress={handleClear}
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
              >
                <Text selectable style={styles.clearText}>
                  Clear selection
                </Text>
              </Pressable>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: '#00000099', flex: 1, justifyContent: 'flex-end' },
  clearButton: { alignItems: 'center', paddingVertical: 10 },
  clearText: { color: colors.danger, fontWeight: '800' },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  container: { gap: 8 },
  dialog: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    maxHeight: '82%',
    padding: 16,
  },
  dialogDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  dialogHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  dialogTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  dialogTitleGroup: { flex: 1, gap: 3 },
  dismissArea: { flex: 1 },
  emptyText: { color: colors.textMuted, fontSize: 14, lineHeight: 20, paddingVertical: 12 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  option: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionDescription: { color: colors.textMuted, fontSize: 12 },
  optionName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  optionSelected: { borderColor: colors.primary },
  optionText: { flex: 1, gap: 3 },
  options: { gap: 8 },
  pressed: { backgroundColor: colors.surfacePressed },
  scroll: { flexGrow: 0, flexShrink: 1 },
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.surface,
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
  triggerText: { flex: 1, gap: 2 },
  triggerTitle: { color: colors.text, fontWeight: '800' },
});
