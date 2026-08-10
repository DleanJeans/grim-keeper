import { Check, PenLine, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { TextInput } from '@/components/text';
import { colors } from '@/theme/colors';

export function FriendNameInputRow({
  duplicateName,
  name,
  onChangeName,
  onSubmit,
}: {
  duplicateName: boolean;
  name: string;
  onChangeName: (next: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8 }}>
      <TextInput
        autoCapitalize="words"
        autoCorrect={false}
        enterKeyHint="done"
        onChangeText={onChangeName}
        onSubmitEditing={onSubmit}
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
          minHeight: 36,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      />
    </View>
  );
}

export function FriendNameSaveButton({
  canSave,
  onPress,
}: {
  canSave: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel="Save friend name"
      accessibilityRole="button"
      disabled={!canSave}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: !canSave
          ? colors.disabled
          : pressed
            ? colors.surfacePressed
            : colors.primary,
        borderRadius: 8,
        justifyContent: 'center',
        minHeight: 36,
        minWidth: 40,
        paddingHorizontal: 10,
      })}
    >
      <Check color={canSave ? colors.onPrimary : colors.onDisabled} size={18} strokeWidth={2.8} />
    </Pressable>
  );
}

export function FriendNameEditToggle({
  editing,
  friendName,
  onToggleEditing,
}: {
  editing: boolean;
  friendName: string;
  onToggleEditing: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={
        editing ? `Cancel editing ${friendName}'s name` : `Edit ${friendName}'s name`
      }
      accessibilityRole="button"
      hitSlop={8}
      onPress={onToggleEditing}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? colors.surfacePressed : colors.surfaceRaised,
        borderRadius: 8,
        justifyContent: 'center',
        minHeight: 36,
        minWidth: 40,
        paddingHorizontal: 10,
      })}
    >
      {editing ? (
        <X color={colors.text} size={18} strokeWidth={2.6} />
      ) : (
        <PenLine color={colors.text} size={18} strokeWidth={2.6} />
      )}
    </Pressable>
  );
}
