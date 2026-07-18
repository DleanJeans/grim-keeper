import { Footprints, HeartPulse, Skull } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

type PlayerCountStatusProps = {
  alivePlayerCount: number;
  deadPlayerCount: number;
  travelerPlayerCount: number;
};

type CountPillProps = {
  color: string;
  count: number;
  icon: ComponentType<{ color: string; size: number; strokeWidth?: number }>;
};

export function PlayerCountStatus({
  alivePlayerCount,
  deadPlayerCount,
  travelerPlayerCount,
}: PlayerCountStatusProps) {
  return (
    <View style={styles.row}>
      <CountPill color="#86efac" count={alivePlayerCount} icon={HeartPulse} />
      <CountPill color="#fca5a5" count={deadPlayerCount} icon={Skull} />
      {travelerPlayerCount > 0 ? (
        <CountPill color="#fcd34d" count={travelerPlayerCount} icon={Footprints} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  pillCount: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '900',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});

function CountPill({ color, count, icon: Icon }: CountPillProps) {
  return (
    <View style={styles.pill}>
      <Icon color={color} size={14} strokeWidth={2.7} />
      <Text style={styles.pillCount}>{count}</Text>
    </View>
  );
}
