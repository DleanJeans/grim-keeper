import { Stack } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { DataTransferCard } from '@/components/settings/data-transfer-card';
import { TitleHeader } from '@/components/title-header';
import { colors } from '@/theme/colors';

export default function SettingsRoute() {
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
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
