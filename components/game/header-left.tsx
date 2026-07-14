import { HeartPulse, Pencil, Skull } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';

type HeaderLeftProps = {
  alivePlayerCount: number;
  deadPlayerCount: number;
  onEdit: () => void;
};

export function HeaderLeft({ alivePlayerCount, deadPlayerCount, onEdit }: HeaderLeftProps) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 3 }}>
        <HeartPulse color="#86efac" size={16} strokeWidth={2.7} />
        <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '900' }}>
          {alivePlayerCount}
        </Text>
      </View>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 3 }}>
        <Skull color="#fca5a5" size={16} strokeWidth={2.7} />
        <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '900' }}>{deadPlayerCount}</Text>
      </View>
      <Pressable
        accessibilityHint="Open Create to add or remove players"
        accessibilityLabel="Edit players"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onEdit}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? '#1f2937' : 'transparent',
          borderRadius: 8,
          height: 32,
          justifyContent: 'center',
          width: 32,
        })}
      >
        <Pencil color="#f8fafc" size={17} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
