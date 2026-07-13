import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

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
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
        Friend name
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          enterKeyHint="done"
          onChangeText={setName}
          onSubmitEditing={handleAddFriend}
          returnKeyType="done"
          submitBehavior="submit"
          value={name}
          style={{
            backgroundColor: colors.surface,
            borderColor: duplicateName ? colors.danger : colors.border,
            borderRadius: 8,
            borderWidth: 1,
            color: colors.text,
            flex: 1,
            fontSize: 17,
            minHeight: 50,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!canAddFriend}
          onPress={handleAddFriend}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: !canAddFriend
              ? colors.disabled
              : pressed
                ? colors.surfacePressed
                : colors.primary,
            borderRadius: 8,
            justifyContent: 'center',
            minHeight: 50,
            width: 54,
          })}
        >
          <Plus
            color={canAddFriend ? colors.onPrimary : colors.onDisabled}
            size={19}
            strokeWidth={2.7}
          />
        </Pressable>
      </View>
      {duplicateName ? (
        <Text selectable style={{ color: colors.danger, fontSize: 14 }}>
          That friend already exists.
        </Text>
      ) : null}
    </View>
  );
}
