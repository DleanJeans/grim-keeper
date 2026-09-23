import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import { normalizeSongUrl } from '@/utils/dj-utils';

type DjUrlEntryProps = {
  onAdd: (songUrl: string) => void;
};

export function DjUrlEntry({ onAdd }: DjUrlEntryProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const songUrl = normalizeSongUrl(draft);
    if (!songUrl) {
      setError('Enter an http(s) or Spotify song URL.');
      return;
    }

    onAdd(songUrl);
    setDraft('');
    setError(null);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.entry}>
        <TextInput
          accessibilityLabel="Song URL"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => {
            setDraft(value);
            if (error) {
              setError(null);
            }
          }}
          onSubmitEditing={handleAdd}
          placeholder="Paste a Spotify, YouTube, or other URL"
          placeholderTextColor={colors.inputPlaceholder}
          returnKeyType="done"
          style={styles.input}
          value={draft}
        />
        <Pressable
          accessibilityLabel="Add song URL"
          accessibilityRole="button"
          disabled={!draft.trim()}
          onPress={handleAdd}
          style={({ pressed }) => [
            styles.addButton,
            !draft.trim() && styles.addButtonDisabled,
            pressed && styles.addButtonPressed,
          ]}
        >
          <Plus
            color={draft.trim() ? colors.onPrimary : colors.onDisabled}
            size={19}
            strokeWidth={2.7}
          />
          <Text style={[styles.addButtonText, !draft.trim() && styles.addButtonTextDisabled]}>
            Add
          </Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 13,
  },
  addButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  addButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  addButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  addButtonTextDisabled: {
    color: colors.onDisabled,
  },
  entry: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 8,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.inputText,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
  },
});
