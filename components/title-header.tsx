import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { goBackOrHome } from '@/utils/navigation-utils';

type TitleHeaderProps = {
  center?: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
  showBack?: boolean;
  title: string;
};

export function TitleHeader({ center, icon, right, showBack = true, title }: TitleHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        {showBack ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={goBackOrHome}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <ChevronLeft color={colors.text} size={24} strokeWidth={2.5} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <View style={center ? styles.titleRowWithCenter : styles.titleRow}>
          {center ?? (
            <View style={styles.titleContent}>
              {icon}
              <Text numberOfLines={1} selectable style={styles.title}>
                {title}
              </Text>
            </View>
          )}
        </View>
        {right ? (
          <View style={styles.rightSlot}>{right}</View>
        ) : (
          <View style={styles.rightSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    marginLeft: -8,
    width: 36,
  },
  backSpacer: {
    width: 36,
  },
  header: {
    backgroundColor: colors.background,
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.65,
  },
  rightSlot: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginLeft: 12,
    minWidth: 36,
  },
  rightSpacer: {
    minWidth: 36,
  },
  title: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 28,
    fontWeight: '900',
  },
  titleContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  titleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minWidth: 0,
    pointerEvents: 'none',
  },
  titleRowWithCenter: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minWidth: 0,
    paddingLeft: 4,
    pointerEvents: 'auto',
  },
});
