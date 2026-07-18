import { StyleSheet } from 'react-native';

import { Text } from '@/components/text';

type DayCountProps = {
  activeDay: number;
  lastDayWithData: number;
};

export function DayCount({ activeDay, lastDayWithData }: DayCountProps) {
  return (
    <Text selectable style={styles.label}>
      Day {activeDay}/{lastDayWithData}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '900',
    minWidth: 54,
    textAlign: 'center',
  },
});
