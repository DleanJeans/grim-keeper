import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type NotFoundScreenProps = {
  message: string;
  title: string;
};

export function NotFoundScreen({ message, title }: NotFoundScreenProps) {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title }} />
      <Text selectable style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
});
