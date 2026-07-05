import { Text, View } from 'react-native';

export default function GameRoute() {
  return (
    <View style={{ alignItems: 'center', backgroundColor: '#0b1120', flex: 1, justifyContent: 'center' }}>
      <Text selectable style={{ color: '#f8fafc' }}>
        Game screen
      </Text>
    </View>
  );
}
