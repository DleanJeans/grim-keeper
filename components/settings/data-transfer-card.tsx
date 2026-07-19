import { Download, FileUp, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { createBackup, parseBackup } from '@/utils/data-transfer';

export function DataTransferCard() {
  const [backupText, setBackupText] = useState('');
  const importData = useGameStore((state) => state.importData);

  async function exportData() {
    const state = useGameStore.getState();
    const json = createBackup({
      appUserName: state.appUserName,
      friends: state.friends,
      games: state.games,
      roleCatalog: state.roleCatalog,
      savedNotes: state.savedNotes,
      scripts: state.scripts,
    });

    if (process.env.EXPO_OS === 'web') {
      downloadBackup(json);
      return;
    }

    await Share.share({ message: json, title: 'Grim Keeper backup' });
  }

  function confirmImport() {
    try {
      const data = parseBackup(backupText);

      if (process.env.EXPO_OS === 'web') {
        if (window.confirm('Replace all app data with this backup?')) {
          completeImport(data);
        }
        return;
      }

      Alert.alert(
        'Replace all app data?',
        'Importing this backup replaces the data currently stored on this device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: () => completeImport(data),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Could not import backup', getErrorMessage(error));
    }
  }

  function completeImport(data: Parameters<typeof importData>[0]) {
    importData(data);
    setBackupText('');

    if (process.env.EXPO_OS === 'web') {
      window.alert('Import complete. Your Grim Keeper data has been restored.');
    } else {
      Alert.alert('Import complete', 'Your Grim Keeper data has been restored.');
    }
  }

  function chooseBackupFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];

      if (file) {
        setBackupText(await file.text());
      }
    });
    input.click();
  }

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text selectable style={styles.title}>
          Data transfer
        </Text>
        <Text selectable style={styles.description}>
          Export everything from Expo Go, then paste the backup below in the web app.
        </Text>
      </View>

      <ActionButton icon="download" label="Export data" onPress={exportData} />

      <TextInput
        accessibilityLabel="Backup JSON"
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        onChangeText={setBackupText}
        placeholder="Paste Grim Keeper backup JSON"
        placeholderTextColor={colors.inputPlaceholder}
        style={styles.input}
        textAlignVertical="top"
        value={backupText}
      />

      {process.env.EXPO_OS === 'web' ? (
        <ActionButton icon="file" label="Choose backup file" onPress={chooseBackupFile} secondary />
      ) : null}

      <ActionButton
        disabled={!backupText.trim()}
        icon="upload"
        label="Import data"
        onPress={confirmImport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderCurve: 'continuous',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  actionDisabled: {
    backgroundColor: colors.disabled,
  },
  actionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  actionSecondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  actionText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  actionTextDisabled: {
    color: colors.onDisabled,
  },
  actionTextSecondary: {
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  heading: {
    gap: 6,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: colors.inputText,
    fontFamily: 'monospace',
    fontSize: 13,
    minHeight: 140,
    padding: 12,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});

type ActionButtonProps = {
  disabled?: boolean;
  icon: 'download' | 'file' | 'upload';
  label: string;
  onPress: () => void;
  secondary?: boolean;
};

function ActionButton({ disabled, icon, label, onPress, secondary }: ActionButtonProps) {
  const Icon = icon === 'download' ? Download : icon === 'file' ? FileUp : Upload;
  const foregroundColor = disabled ? colors.onDisabled : secondary ? colors.text : colors.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        secondary && styles.actionSecondary,
        disabled && styles.actionDisabled,
        pressed && styles.actionPressed,
      ]}
    >
      <Icon color={foregroundColor} size={18} strokeWidth={2.6} />
      <Text
        style={[
          styles.actionText,
          secondary && styles.actionTextSecondary,
          disabled && styles.actionTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function downloadBackup(json: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `grim-keeper-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The backup could not be read.';
}
