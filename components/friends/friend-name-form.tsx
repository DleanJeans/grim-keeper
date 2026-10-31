import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { hasFriendName } from '@/utils/friend-utils';

type FriendNameFormProps = {
  friends: FriendSummary[];
  onAddFriend: (name: string) => void;
};

export function FriendNameForm({ friends, onAddFriend }: FriendNameFormProps) {
  const [name, setName] = useState('');
  const normalizedName = normalizePlayerName(name);
  const duplicateName = hasFriendName(friends, name);
  const canAddFriend = normalizedName.length > 0 && !duplicateName;

  function handleAddFriend() {
    if (!canAddFriend) {
      return;
    }

    onAddFriend(normalizedName);
    setName('');
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.label}>
        Friend name
      </Text>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel="Friend name"
          autoCapitalize="words"
          autoCorrect={false}
          enterKeyHint="done"
          onChangeText={setName}
          onSubmitEditing={handleAddFriend}
          returnKeyType="done"
          submitBehavior="submit"
          value={name}
          style={[styles.input, duplicateName && styles.inputDuplicate]}
        />
        <Pressable
          accessibilityLabel="Add friend"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAddFriend }}
          disabled={!canAddFriend}
          onPress={handleAddFriend}
          style={({ pressed }) => [
            styles.addButton,
            !canAddFriend ? styles.addButtonDisabled : pressed ? styles.addButtonPressed : null,
          ]}
        >
          <Plus
            color={canAddFriend ? colors.onPrimary : colors.onDisabled}
            size={19}
            strokeWidth={2.7}
          />
        </Pressable>
      </View>
      {duplicateName ? (
        <Text selectable style={styles.duplicateText}>
          That friend already exists.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 50,
    width: 54,
  },
  addButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  addButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  container: {
    gap: 8,
  },
  duplicateText: {
    color: colors.danger,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 17,
    minWidth: 0,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputDuplicate: {
    borderColor: colors.danger,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
