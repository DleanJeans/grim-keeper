import { Check, PenLine } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';

export function FriendNameEditor({
  friend,
  friends,
  onSave,
  reservedName,
}: {
  friend: FriendSummary;
  friends: FriendSummary[];
  onSave: (name: string) => boolean;
  reservedName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(friend.name);
  const normalizedName = normalizePlayerName(name);
  const normalizedNameKey = normalizedName.toLocaleLowerCase();
  const duplicateName =
    normalizePlayerName(reservedName).toLocaleLowerCase() === normalizedNameKey ||
    friends.some(
      (candidate) =>
        candidate.id !== friend.id &&
        normalizePlayerName(candidate.name).toLocaleLowerCase() === normalizedNameKey,
    );
  const canSave = normalizedName.length > 0 && normalizedName !== friend.name && !duplicateName;

  useEffect(() => {
    setName(friend.name);
  }, [friend.name]);

  function handleSave() {
    if (!canSave || !onSave(normalizedName)) {
      return;
    }

    setEditing(false);
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
        <Text selectable style={{ color: colors.text, flex: 1, fontSize: 24, fontWeight: '900' }}>
          {friend.name}
        </Text>
        <Pressable
          accessibilityLabel={`Edit ${friend.name}'s name`}
          accessibilityRole="button"
          onPress={() => setEditing((currentEditing) => !currentEditing)}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: pressed ? colors.surfacePressed : colors.surfaceRaised,
            borderRadius: 8,
            justifyContent: 'center',
            minHeight: 36,
            width: 40,
          })}
        >
          <PenLine color={colors.text} size={17} strokeWidth={2.6} />
        </Pressable>
      </View>

      {editing ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            enterKeyHint="done"
            onChangeText={setName}
            onSubmitEditing={handleSave}
            returnKeyType="done"
            submitBehavior="submit"
            value={name}
            style={{
              backgroundColor: colors.surfaceRaised,
              borderColor: duplicateName ? colors.danger : colors.border,
              borderRadius: 8,
              borderWidth: 1,
              color: colors.text,
              flex: 1,
              fontSize: 16,
              minHeight: 48,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          />
          <Pressable
            accessibilityLabel="Save friend name"
            accessibilityRole="button"
            disabled={!canSave}
            onPress={handleSave}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: !canSave
                ? colors.disabled
                : pressed
                  ? colors.surfacePressed
                  : colors.primary,
              borderRadius: 8,
              justifyContent: 'center',
              minHeight: 48,
              width: 52,
            })}
          >
            <Check
              color={canSave ? colors.onPrimary : colors.onDisabled}
              size={20}
              strokeWidth={2.8}
            />
          </Pressable>
        </View>
      ) : null}

      {editing && duplicateName ? (
        <Text selectable style={{ color: colors.danger, fontSize: 14 }}>
          That name is already in use.
        </Text>
      ) : null}
    </View>
  );
}
