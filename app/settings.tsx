import { Stack } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { DjSettingsCard } from '@/components/dj/dj-settings-card';
import { ResponsiveContent } from '@/components/responsive-content';
import { AppVersionInfo } from '@/components/settings/app-version-info';
import { DataTransferCard } from '@/components/settings/data-transfer-card';
import { NightStartSettingsCard } from '@/components/settings/night-start-settings-card';
import { SizeSettingsCard } from '@/components/settings/size-settings-card';
import { ThemeSettingsCard } from '@/components/settings/theme-settings-card';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useDjStore } from '@/store/dj-store';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { FONT_SCALE_PERCENT, setFontScalePercent, useFontScale } from '@/theme/font-scale';
import { setUiScalePercent, UI_SCALE_PERCENT, useUiScale } from '@/theme/ui-scale';

export default function SettingsRoute() {
  const showDialog = useAppDialog();
  const clearData = useGameStore((state) => state.clearData);
  const clearDjData = useDjStore((state) => state.clearData);
  const uiScalePercent = Math.round(useUiScale() * 100);
  const fontScalePercent = Math.round(useFontScale() * 100);

  function confirmClearData() {
    showDialog(
      'Clear all data?',
      'This removes all games, friends, notes, downloaded scripts, and DJ data from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear data',
          style: 'destructive',
          onPress: () => {
            clearData();
            clearDjData();
          },
        },
      ],
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ header: () => <TitleHeader title="Settings" />, title: 'Settings' }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={styles.screen}
      >
        <ResponsiveContent style={styles.content}>
          <ThemeSettingsCard />
          <SizeSettingsCard
            description="Makes everything in the app smaller or larger: buttons, icons, the map and text."
            onChange={setUiScalePercent}
            percent={uiScalePercent}
            range={UI_SCALE_PERCENT}
            title="UI size"
          />
          <SizeSettingsCard
            description="Makes text across the app smaller or larger, on top of the UI size."
            onChange={setFontScalePercent}
            percent={fontScalePercent}
            range={FONT_SCALE_PERCENT}
            title="Font size"
          />
          <DjSettingsCard />
          <NightStartSettingsCard />
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
          <AppVersionInfo />
        </ResponsiveContent>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 20,
  },
  scrollContent: {
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
