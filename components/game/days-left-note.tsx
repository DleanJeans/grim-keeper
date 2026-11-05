import { Hourglass, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { getDaysLeft } from '@/utils/nomination-utils';

type DaysLeftNoteProps = {
  alivePlayerCount: number;
};

/** A small badge with how many days are left with daily executions. Day phase only. */
export function DaysLeftNote({ alivePlayerCount }: DaysLeftNoteProps) {
  const daysLeft = getDaysLeft(alivePlayerCount);
  if (daysLeft === 0) {
    return null;
  }

  const finalThree = alivePlayerCount === 3;
  const Icon = finalThree ? TriangleAlert : Hourglass;
  const message = finalThree
    ? 'Final 3: execute the Demon today or evil wins'
    : daysLeft === 1
      ? 'Last day unless today’s execution ends the game'
      : `${daysLeft} days left with an execution each day`;
  const shortMessage = finalThree
    ? 'Final 3'
    : daysLeft === 1
      ? 'Last day'
      : `${daysLeft} days left`;
  const color = finalThree ? colors.warning : colors.dayCard.badgeText;

  return (
    <View accessibilityLabel={message} accessible style={styles.badge}>
      <Icon color={color} size={12} strokeWidth={2.6} />
      <Text style={[styles.text, finalThree && styles.warningText]}>{shortMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.dayCard.badgeBackground,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: { color: colors.dayCard.badgeText, fontSize: 11.5, fontWeight: '800' },
  warningText: { color: colors.warning },
});
