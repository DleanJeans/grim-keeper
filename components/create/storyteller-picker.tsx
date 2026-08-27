import { Check, ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';

type StorytellerPickerProps = {
  friends: FriendSummary[];
  onSelect: (friendId?: string) => void;
  selectedFriendId?: string | null;
};

export function StorytellerPicker({ friends, onSelect, selectedFriendId }: StorytellerPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId);
  const disabled = friends.length === 0;

  function handleSelect(friendId?: string) {
    onSelect(friendId);
    setOpen(false);
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.label}>
        Storyteller
      </Text>
      <Pressable
        accessibilityLabel={`Storyteller: ${selectedFriend?.name ?? (disabled ? 'No friends yet' : 'None')}`}
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
            {selectedFriend?.name ?? (disabled ? 'No friends yet' : 'Select a friend')}
          </Text>
          <Text selectable style={styles.triggerDescription}>
            {selectedFriend ? 'Selected friend' : 'Optional game role'}
          </Text>
        </View>
        <ChevronDown
          color={disabled ? colors.onDisabled : colors.textMuted}
          size={18}
          strokeWidth={2.6}
        />
      </Pressable>

      <Modal animationType="slide" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Close Storyteller picker"
            accessibilityRole="button"
            onPress={() => setOpen(false)}
            style={styles.dismissArea}
          />
          <View style={styles.dialog}>
            <View style={styles.dialogHeader}>
              <View style={styles.dialogTitleGroup}>
                <Text selectable style={styles.dialogTitle}>
                  Select Storyteller
                </Text>
                <Text selectable style={styles.dialogDescription}>
                  Choose a friend to place in the middle of the game map.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close Storyteller picker"
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.options}
              contentInsetAdjustmentBehavior="automatic"
            >
              {friends.length > 0 ? (
                friends.map((friend) => {
                  const selected = friend.id === selectedFriendId;
                  return (
                    <Pressable
                      accessibilityLabel={`${selected ? 'Selected' : 'Select'} ${friend.name} as storyteller`}
                      accessibilityRole="button"
                      key={friend.id}
                      onPress={() => handleSelect(friend.id)}
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
                  Add a friend before selecting a storyteller.
                </Text>
              )}
            </ScrollView>
            {selectedFriend ? (
              <Pressable
                accessibilityLabel="Clear Storyteller selection"
                accessibilityRole="button"
                onPress={() => handleSelect(undefined)}
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
              >
                <Text selectable style={styles.clearText}>
                  Clear selection
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
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
