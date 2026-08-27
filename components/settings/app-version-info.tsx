import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function AppVersionInfo() {
  const version = Constants.expoConfig?.version ?? 'Unknown';
  const deployedAt = parseDeploymentDate(process.env.EXPO_PUBLIC_DEPLOYED_AT);

  return (
    <View style={styles.container}>
      <Text selectable style={styles.version}>
        Version {version}
      </Text>
      <Text selectable style={styles.deployedAt}>
        {deployedAt
          ? `Deployed ${formatDeploymentDate(deployedAt)}`
          : 'Deployment time unavailable'}
      </Text>
    </View>
  );
}

function formatDeploymentDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function parseDeploymentDate(timestamp: string | undefined) {
  if (!timestamp) {
    return undefined;
  }

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  deployedAt: {
    color: colors.textSubtle,
    fontSize: 12,
  },
  version: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
