import { Text, View } from 'react-native';

export default function HomeRoute() {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: '#0f172a',
        flex: 1,
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Text selectable style={{ color: '#f8fafc', fontSize: 20, fontWeight: '700' }}>
        GrimKeeper
      </Text>
    </View>
  );
}
