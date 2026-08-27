import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function AppVersionInfo() {
  const version = Constants.expoConfig?.version ?? 'Unknown';
  const deployedAt = Updates.createdAt;

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
