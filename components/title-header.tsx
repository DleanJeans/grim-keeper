import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { type ReactNode, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type TitleHeaderProps = {
  center?: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
  title: string;
};

export function TitleHeader({ center, icon, right, title }: TitleHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const handleBack = useCallback(() => router.back(), [router]);

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ChevronLeft color={colors.text} size={24} strokeWidth={2.5} />
        </Pressable>
        <View
          style={center ? styles.titleRowWithCenter : styles.titleRow}
          pointerEvents={center ? 'auto' : 'none'}
        >
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
  },
  titleRowWithCenter: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minWidth: 0,
    paddingLeft: 4,
  },
});
