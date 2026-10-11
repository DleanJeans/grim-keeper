import { ClipboardPaste, Download, FileUp, Upload, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { GameTransferSection } from '@/components/settings/game-transfer-card';
import { Text } from '@/components/text';
import { useDjStore } from '@/store/dj-store';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { type BackupGameData, createBackup, parseBackup } from '@/utils/data-transfer';
import { getBackupStats } from '@/utils/data-transfer-stats';
import { downloadJson, getJsonFilename, shareJsonFile } from '@/utils/file-transfer';

type SelectedBackup = {
  data: BackupGameData;
  name: string;
  size: number;
};

export function DataTransferCard() {
  const showDialog = useAppDialog();
  const [backupText, setBackupText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<SelectedBackup | null>(null);
  const importData = useGameStore((state) => state.importData);
  const importDjData = useDjStore((state) => state.importData);

  async function exportData() {
    try {
      setIsExporting(true);
      const state = useGameStore.getState();
      const dj = useDjStore.getState();
      const json = createBackup({
        appUserName: state.appUserName,
        friends: state.friends,
        games: state.games,
        roleCatalog: state.roleCatalog,
        savedNotes: state.savedNotes,
        scripts: state.scripts,
        dj,
      });

      if (process.env.EXPO_OS === 'web') {
        downloadJson(json, `grim-keeper-backup-${new Date().toISOString().slice(0, 10)}.json`);
        return;
      }

      await shareJsonFile(json, getJsonFilename('grim-keeper-backup'), 'Export Grim Keeper backup');
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

  function completeImport(data: BackupGameData) {
    const { dj, ...gameData } = data;
    importData(gameData);
    importDjData(dj);
    resetImport();

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

  function resetImport() {
    setSelectedBackup(null);
    setBackupText('');
    setIsPasting(false);
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

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Text selectable style={styles.sectionTitle}>
            Export
          </Text>
          <Text selectable style={styles.description}>
            Save all app data on this device to a backup file.
          </Text>
        </View>

        <ActionButton
          disabled={isExporting}
          icon="download"
          label={isExporting ? 'Preparing backup…' : 'Export data'}
          onPress={exportData}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Text selectable style={styles.sectionTitle}>
            Import
          </Text>
          <Text selectable style={styles.description}>
            Replace all app data on this device with a backup.
          </Text>
        </View>

        {selectedBackup ? <SelectedBackupSummary backup={selectedBackup} /> : null}

        {isPasting ? (
          <TextInput
            accessibilityLabel="Backup JSON"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            multiline
            onChangeText={setBackupText}
            placeholder="Paste Grim Keeper backup JSON"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.input}
            textAlignVertical="top"
            value={backupText}
          />
        ) : null}

        {selectedBackup || isPasting ? (
          <>
            <ActionButton
              disabled={!selectedBackup && !backupText.trim()}
              icon="upload"
              label="Import data"
              onPress={confirmImport}
            />
            <ActionButton icon="cancel" label="Cancel" onPress={resetImport} secondary />
          </>
        ) : (
          <>
            {process.env.EXPO_OS === 'web' ? (
              <ActionButton icon="file" label="Choose backup file" onPress={chooseBackupFile} />
            ) : null}
            <ActionButton
              icon="paste"
              label="Paste backup"
              onPress={() => setIsPasting(true)}
              secondary
            />
          </>
        )}
      </View>

      <GameTransferSection />
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
  section: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 16,
    paddingTop: 16,
  },
  sectionHeading: {
    gap: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
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
  icon: 'cancel' | 'download' | 'file' | 'paste' | 'upload';
  label: string;
  onPress: () => void;
  secondary?: boolean;
};

function ActionButton({ disabled, icon, label, onPress, secondary }: ActionButtonProps) {
  const Icon = {
    cancel: X,
    download: Download,
    file: FileUp,
    paste: ClipboardPaste,
    upload: Upload,
  }[icon];
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

function SelectedBackupSummary({ backup }: { backup: SelectedBackup }) {
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
    </View>
  );
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
