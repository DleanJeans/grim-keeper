import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Download, FileUp, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { Text } from '@/components/text';
import type { GameData } from '@/store/game-store';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { createBackup, parseBackup } from '@/utils/data-transfer';
import { getBackupStats } from '@/utils/data-transfer-stats';

type SelectedBackup = {
  data: GameData;
  name: string;
  size: number;
};

export function DataTransferCard() {
  const showDialog = useAppDialog();
  const [backupText, setBackupText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<SelectedBackup | null>(null);
  const importData = useGameStore((state) => state.importData);

  async function exportData() {
    try {
      setIsExporting(true);
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

      await shareBackupFile(json);
    } catch (error) {
      showDialog('Could not export backup', getErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  }

  function confirmImport() {
    try {
      const data = selectedBackup?.data ?? parseBackup(backupText);

      showDialog(
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
      showDialog('Could not import backup', getErrorMessage(error));
    }
  }

  function completeImport(data: Parameters<typeof importData>[0]) {
    importData(data);
    setBackupText('');
    setSelectedBackup(null);

    showDialog('Import complete', 'Your Grim Keeper data has been restored.');
  }

  function chooseBackupFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];

      if (file) {
        void selectBackupFile(file);
      }
    });
    input.click();
  }

  async function selectBackupFile(file: globalThis.File) {
    try {
      const data = parseBackup(await file.text());
      setBackupText('');
      setSelectedBackup({ data, name: file.name, size: file.size });
    } catch (error) {
      setSelectedBackup(null);
      showDialog('Could not import backup', getErrorMessage(error));
    }
  }

  function clearSelectedBackup() {
    setSelectedBackup(null);
    setBackupText('');
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

      <ActionButton
        disabled={isExporting}
        icon="download"
        label={isExporting ? 'Preparing backup…' : 'Export data'}
        onPress={exportData}
      />

      {selectedBackup ? (
        <SelectedBackupSummary backup={selectedBackup} onClear={clearSelectedBackup} />
      ) : (
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
      )}

      {process.env.EXPO_OS === 'web' ? (
        <ActionButton icon="file" label="Choose backup file" onPress={chooseBackupFile} secondary />
      ) : null}

      <ActionButton
        disabled={!selectedBackup && !backupText.trim()}
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
  selectedBackup: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  selectedBackupFile: {
    color: colors.inputText,
    fontSize: 15,
    fontWeight: '700',
  },
  selectedBackupMeta: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  selectedBackupStats: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
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

function SelectedBackupSummary({
  backup,
  onClear,
}: {
  backup: SelectedBackup;
  onClear: () => void;
}) {
  const stats = getBackupStats(backup.data);

  return (
    <View accessibilityLabel="Selected backup" style={styles.selectedBackup}>
      <Text selectable style={styles.selectedBackupFile}>
        {backup.name}
      </Text>
      <Text selectable style={styles.selectedBackupMeta}>
        {formatFileSize(backup.size)} ·{' '}
        <Text style={styles.selectedBackupStats}>
          {stats.games} games · {stats.players} players · {stats.friends} friends · {stats.scripts}{' '}
          scripts · {stats.notes} notes
        </Text>
      </Text>
      <ActionButton icon="upload" label="Paste backup instead" onPress={onClear} secondary />
    </View>
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

async function shareBackupFile(json: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing is not available on this device.');
  }

  const file = new File(Paths.cache, getBackupFilename());
  file.write(json);

  try {
    await Sharing.shareAsync(file.uri, {
      dialogTitle: 'Export Grim Keeper backup',
      mimeType: 'application/json',
      UTI: 'public.json',
    });
  } finally {
    file.delete();
  }
}

function getBackupFilename() {
  return `grim-keeper-backup-${new Date().toISOString().replaceAll(':', '-')}.json`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The backup could not be read.';
}
