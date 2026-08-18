import { FileUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { pickJsonFile } from '@/utils/file-transfer';
import { parseGameTransfer } from '@/utils/game-transfer';

export function GameTransferCard() {
  const showDialog = useAppDialog();
  const importGameTransfer = useGameStore((state) => state.importGameTransfer);
  const [isImporting, setIsImporting] = useState(false);

  async function handleImport() {
    try {
      setIsImporting(true);
      const file = await pickJsonFile();

      if (!file) {
        return;
      }

      const transfer = parseGameTransfer(file.text);
      const game = transfer.data.game;
      const scriptName = transfer.data.script?.name ?? game.script?.name;
      const description = [
        scriptName ? `Script: ${scriptName}.` : 'This game has no script.',
        `${game.players.length} players and ${game.conversations.length} tracked interactions.`,
      ].join(' ');

      showDialog('Import game?', description, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', onPress: () => completeImport(transfer) },
      ]);
    } catch (error) {
      showDialog('Could not import game', getErrorMessage(error));
    } finally {
      setIsImporting(false);
    }
  }

  function completeImport(transfer: Parameters<typeof importGameTransfer>[0]) {
    importGameTransfer(transfer);
    showDialog('Game imported', 'The game was added to this device.');
  }

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text selectable style={styles.title}>
          Single game transfer
        </Text>
        <Text selectable style={styles.description}>
          Import one game and its script without replacing the games already on this device.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Import game"
        disabled={isImporting}
        onPress={handleImport}
        style={({ pressed }) => [
          styles.button,
          isImporting && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
      >
        <FileUp
          color={isImporting ? colors.onDisabled : colors.onPrimary}
          size={18}
          strokeWidth={2.6}
        />
        <Text style={[styles.buttonText, isImporting && styles.buttonTextDisabled]}>
          {isImporting ? 'Choosing game file…' : 'Import game'}
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
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The game transfer could not be read.';
}
