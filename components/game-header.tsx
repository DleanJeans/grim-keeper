import type { NativeStackHeaderProps } from 'expo-router/build/react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

export function GameHeader({ back, navigation, options, route }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const HeaderLeft = options.headerLeft;
  const HeaderRight = options.headerRight;
  const hasHeaderLeft = Boolean(back || HeaderLeft);
  const hasHeaderRight = Boolean(HeaderRight);
  const HeaderTitle = typeof options.headerTitle === 'function' ? options.headerTitle : null;
  const title =
    typeof options.headerTitle === 'string' ? options.headerTitle : options.title || route.name;

  const body = (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={[styles.headerContent, route.name === 'game/[id]' && styles.gameHeaderContent]}>
        {hasHeaderLeft ? (
          <View style={[styles.headerSide, styles.headerLeft]}>
            {back && options.headerBackVisible !== false ? (
              <Pressable
                accessibilityLabel="Go back"
                accessibilityRole="button"
                hitSlop={8}
                onPress={navigation.goBack}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              >
                <ChevronLeft color={colors.text} size={24} strokeWidth={2.5} />
              </Pressable>
            ) : null}
            {HeaderLeft ? <HeaderLeft canGoBack={Boolean(back)} tintColor={colors.text} /> : null}
          </View>
        ) : hasHeaderRight ? (
          <View style={styles.headerSide} />
        ) : null}
        <View
          style={[
            styles.headerTitleSlot,
            route.name === 'game/[id]' ? styles.gameHeaderTitleSlot : null,
          ]}
        >
          {HeaderTitle ? (
            HeaderTitle({ children: title, tintColor: colors.text })
          ) : (
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              numberOfLines={1}
              style={[styles.headerTitle, options.headerTitleStyle]}
            >
              {title}
            </Text>
          )}
        </View>
        {hasHeaderRight ? (
          <View style={[styles.headerSide, styles.headerRight]}>
            {HeaderRight ? <HeaderRight canGoBack={Boolean(back)} tintColor={colors.text} /> : null}
          </View>
        ) : hasHeaderLeft ? (
          <View style={styles.headerSide} />
        ) : null}
      </View>
    </View>
  );

  return body;
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    marginLeft: -8,
    width: 36,
  },
  gameHeaderContent: {
    height: 40,
    paddingHorizontal: 8,
  },
  gameHeaderTitleSlot: {
    flex: 0,
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
  headerLeft: {
    justifyContent: 'flex-start',
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  headerSide: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minWidth: 0,
  },
  headerTitle: {
    color: colors.text,
    flexShrink: 1,
    fontFamily: 'GoogleSans-Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  headerTitleSlot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  pressed: {
    opacity: 0.65,
  },
});
