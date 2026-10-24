import { Check, PenLine } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import { normalizePlayerName } from '@/utils/conversation-utils';

type AppUserNameCardProps = {
  appUserName: string;
  onSave: (name: string) => void;
};

export function AppUserNameCard({ appUserName, onSave }: AppUserNameCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(appUserName);
  const normalizedName = normalizePlayerName(name);
  const canSave = normalizedName.length > 0 && normalizedName !== appUserName;

  useEffect(() => {
    setName(appUserName);
  }, [appUserName]);

  function handleSave() {
    if (!canSave) {
      return;
    }

    onSave(normalizedName);
    setName(normalizedName);
    setEditing(false);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text selectable style={styles.greeting}>
          Hi, {appUserName}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setEditing((currentEditing) => !currentEditing)}
          style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
        >
          <PenLine color={colors.text} size={17} strokeWidth={2.6} />
        </Pressable>
      </View>

      {editing ? (
        <View style={styles.editRow}>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            enterKeyHint="done"
            onChangeText={setName}
            onSubmitEditing={handleSave}
            returnKeyType="done"
            submitBehavior="submit"
            value={name}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              !canSave ? styles.saveButtonDisabled : pressed ? styles.buttonPressed : null,
            ]}
          >
            <Check
              color={canSave ? colors.onPrimary : colors.onDisabled}
              size={20}
              strokeWidth={2.8}
            />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    width: 40,
  },
  editRow: {
    flexDirection: 'row',
    gap: 10,
  },
  greeting: {
    color: colors.text,
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
    width: 52,
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
});
