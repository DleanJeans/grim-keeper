import { Stack } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { DataTransferCard } from '@/components/settings/data-transfer-card';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';

export default function SettingsRoute() {
  const showDialog = useAppDialog();
  const clearData = useGameStore((state) => state.clearData);

  function confirmClearData() {
    showDialog(
      'Clear all data?',
      'This removes all games, friends, notes, and downloaded scripts from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear data', style: 'destructive', onPress: clearData },
      ],
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ header: () => <TitleHeader title="Settings" />, title: 'Settings' }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.screen}
      >
        <DataTransferCard />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear all data"
          onPress={confirmClearData}
          style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
        >
          <Trash2 color={colors.danger} size={18} strokeWidth={2.6} />
          <Text style={styles.clearButtonText}>Clear data</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  clearButtonPressed: {
    opacity: 0.75,
  },
  clearButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
