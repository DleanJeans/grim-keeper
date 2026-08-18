import { Download } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, StoredScript } from '@/types/game';
import { downloadJson, getJsonFilename, shareJsonFile } from '@/utils/file-transfer';
import { createGameTransfer } from '@/utils/game-transfer';

type ExportGameButtonProps = {
  game: Game;
  scripts: StoredScript[];
};

export function ExportGameButton({ game, scripts }: ExportGameButtonProps) {
  const showDialog = useAppDialog();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    try {
      setIsExporting(true);
      const json = createGameTransfer(game, scripts);
      const filename = getJsonFilename('grim-keeper-game');

      if (process.env.EXPO_OS === 'web') {
        downloadJson(json, filename);
      } else {
        await shareJsonFile(json, filename, 'Export Grim Keeper game');
      }
    } catch (error) {
      showDialog('Could not export game', getErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.description}>
        Export this game with the script it uses.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Export game"
        disabled={isExporting}
        onPress={handleExport}
        style={({ pressed }) => [
          styles.button,
          isExporting && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
      >
        <Download
          color={isExporting ? colors.onDisabled : colors.onPrimary}
          size={18}
          strokeWidth={2.6}
        />
        <Text style={[styles.buttonText, isExporting && styles.buttonTextDisabled]}>
          {isExporting ? 'Preparing export…' : 'Export game'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
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
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  buttonTextDisabled: {
    color: colors.onDisabled,
  },
  container: {
    gap: 10,
    paddingBottom: 4,
    paddingTop: 14,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The game could not be exported.';
}
