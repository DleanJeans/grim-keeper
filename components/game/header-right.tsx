import { UserPlus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';

type HeaderRightProps = {
  onAddPlayer: () => void;
};

export function HeaderRight({ onAddPlayer }: HeaderRightProps) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <Pressable
        accessibilityLabel="Add missing player"
        accessibilityRole="button"
        onPress={onAddPlayer}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? '#1f2937' : '#111827',
          borderColor: '#334155',
          borderRadius: 8,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 7,
        })}
      >
        <UserPlus color="#f8fafc" size={15} strokeWidth={2.5} />
        <Text style={{ color: '#f8fafc', fontSize: 13, fontWeight: '900' }}>Player</Text>
      </Pressable>
    </View>
  );
}
