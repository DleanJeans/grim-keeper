import { Check, PenLine, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

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
    <View style={styles.inputRow}>
      <TextInput
        autoCapitalize="words"
        autoCorrect={false}
        enterKeyHint="done"
        onChangeText={onChangeName}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        submitBehavior="submit"
        value={name}
        style={[styles.input, duplicateName && styles.inputDuplicate]}
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
      style={({ pressed }) => [
        styles.iconButton,
        styles.saveButton,
        pressed && styles.iconButtonPressed,
        !canSave && styles.saveButtonDisabled,
      ]}
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
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
    >
      {editing ? (
        <X color={colors.text} size={18} strokeWidth={2.6} />
      ) : (
        <PenLine color={colors.text} size={18} strokeWidth={2.6} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 40,
    paddingHorizontal: 10,
  },
  iconButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputDuplicate: {
    borderColor: colors.danger,
  },
  inputRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
});
