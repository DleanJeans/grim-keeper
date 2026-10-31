import { StyleSheet, View } from 'react-native';

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
        accessibilityLabel="Friend name"
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

const styles = StyleSheet.create({
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
});
