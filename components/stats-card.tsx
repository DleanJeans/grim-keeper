import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type StatsCardProps = {
  accessibilityHint?: string;
  children: ReactNode;
  label: string;
  onPress?: () => void;
  right?: ReactNode;
};

export function StatsCard({ accessibilityHint, children, label, onPress, right }: StatsCardProps) {
  const hasAction = Boolean(right);
  const content = (
    <>
      <View style={[styles.header, hasAction && styles.headerWithAction]}>
        <Text selectable style={[styles.label, hasAction && styles.labelWithAction]}>
          {label}
        </Text>
        {right}
      </View>
      {children}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 14,
  },
  cardPressed: {
    backgroundColor: colors.surfacePressed,
  },
  header: {
    alignItems: 'center',
    minHeight: 22,
    width: '100%',
  },
  headerWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  labelWithAction: {
    textAlign: 'left',
  },
});
