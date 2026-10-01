import { ClipboardPaste } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';

type ScriptPasteImporterProps = {
  onImport: (value: string, fallbackName?: string) => Promise<boolean>;
};

export function ScriptPasteImporter({ onImport }: ScriptPasteImporterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [scriptJson, setScriptJson] = useState('');
  const [fallbackName, setFallbackName] = useState('');

  async function importPastedScript() {
    setIsImporting(true);

    try {
      const imported = await onImport(scriptJson, fallbackName.trim() || undefined);
      if (imported) {
        setScriptJson('');
        setFallbackName('');
        setIsExpanded(false);
      }
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint="Opens a field where you can paste or type script JSON."
        accessibilityLabel="Paste script JSON"
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        onPress={() => setIsExpanded((expanded) => !expanded)}
        style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
      >
        <ClipboardPaste color={colors.text} size={18} strokeWidth={2.6} />
        <Text style={styles.toggleLabel}>
          {isExpanded ? 'Hide paste field' : 'Paste script JSON'}
        </Text>
      </Pressable>

      {isExpanded ? (
        <View style={styles.form}>
          <Text selectable style={styles.description}>
            Paste a script JSON array below. Add a name if its _meta entry has no name.
          </Text>
          <TextInput
            accessibilityLabel="Fallback script name"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={setFallbackName}
            placeholder="Script name (optional)"
            placeholderTextColor={colors.textSubtle}
            value={fallbackName}
            style={styles.nameInput}
          />
          <TextInput
            accessibilityLabel="Script JSON to import"
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            onChangeText={setScriptJson}
            placeholder="Paste script JSON"
            placeholderTextColor={colors.textSubtle}
            textAlignVertical="top"
            value={scriptJson}
            style={styles.jsonInput}
          />
          <Pressable
            accessibilityLabel="Import pasted script"
            accessibilityRole="button"
            disabled={!scriptJson.trim() || isImporting}
            onPress={() => void importPastedScript()}
            style={({ pressed }) => [
              styles.importButton,
              pressed && styles.importButtonPressed,
              (!scriptJson.trim() || isImporting) && styles.importButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.importButtonLabel,
                (!scriptJson.trim() || isImporting) && styles.importButtonLabelDisabled,
              ]}
            >
              {isImporting ? 'Importing…' : 'Import script'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    gap: 10,
  },
  importButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderCurve: 'continuous',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  importButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  importButtonLabel: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  importButtonLabelDisabled: {
    color: colors.onDisabled,
  },
  importButtonPressed: {
    opacity: 0.85,
  },
  jsonInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    minHeight: 160,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  togglePressed: {
    backgroundColor: colors.surfacePressed,
  },
});
