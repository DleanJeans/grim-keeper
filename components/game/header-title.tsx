import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';

type HeaderTitleProps = {
  activeDay: number;
  lastDayWithData: number;
  onChangeDay: (day: number) => void;
};

export function HeaderTitle({ activeDay, lastDayWithData, onChangeDay }: HeaderTitleProps) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
      <Pressable
        accessibilityLabel="Previous day"
        accessibilityRole="button"
        disabled={activeDay === 1}
        onPress={() => onChangeDay(activeDay - 1)}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: activeDay === 1 ? '#1f2937' : '#334155',
          borderRadius: 8,
          height: 32,
          justifyContent: 'center',
          opacity: pressed ? 0.75 : 1,
          width: 34,
        })}
      >
        <ChevronLeft color={activeDay === 1 ? '#64748b' : '#f8fafc'} size={15} strokeWidth={2.7} />
      </Pressable>
      <Text
        selectable
        style={{
          color: '#f8fafc',
          fontSize: 15,
          fontWeight: '900',
          minWidth: 54,
          textAlign: 'center',
        }}
      >
        Day {activeDay}/{lastDayWithData}
      </Text>
      <Pressable
        accessibilityLabel="Next day"
        accessibilityRole="button"
        onPress={() => onChangeDay(activeDay + 1)}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? '#475569' : '#334155',
          borderRadius: 8,
          height: 32,
          justifyContent: 'center',
          width: 34,
        })}
      >
        <ChevronRight color="#f8fafc" size={15} strokeWidth={2.7} />
      </Pressable>
    </View>
  );
}
