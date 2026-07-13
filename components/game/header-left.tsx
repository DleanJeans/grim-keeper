import { HeartPulse, Skull } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/text';

type HeaderLeftProps = {
  alivePlayerCount: number;
  deadPlayerCount: number;
};

export function HeaderLeft({ alivePlayerCount, deadPlayerCount }: HeaderLeftProps) {
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
    </View>
  );
}
