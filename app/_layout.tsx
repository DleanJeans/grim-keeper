import type { NativeStackHeaderProps } from 'expo-router/build/react-navigation/native-stack';
import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppFonts } from '@/hooks/use-app-fonts';
import { colors } from '@/theme/colors';

const grimKeeperTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.background,
    notification: colors.danger,
    primary: colors.primary,
    text: colors.text,
  },
  fonts: {
    ...DarkTheme.fonts,
    bold: {
      fontFamily: 'GoogleSans-Bold',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'GoogleSans-Bold',
      fontWeight: '800' as const,
    },
    medium: {
      fontFamily: 'GoogleSans-Bold',
      fontWeight: '600' as const,
    },
    regular: {
      fontFamily: 'GoogleSans',
      fontWeight: '400' as const,
    },
  },
};

function CompactHeader({ back, navigation, options, route }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const HeaderLeft = options.headerLeft;
  const HeaderRight = options.headerRight;
  const HeaderTitle = typeof options.headerTitle === 'function' ? options.headerTitle : null;
  const title =
    typeof options.headerTitle === 'string' ? options.headerTitle : options.title || route.name;

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
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
        <View style={styles.headerTitleSlot}>
          {HeaderTitle ? (
            HeaderTitle({ children: title, tintColor: colors.text })
          ) : (
            <Text numberOfLines={1} style={[styles.headerTitle, options.headerTitleStyle]}>
              {title}
            </Text>
          )}
        </View>
        <View style={[styles.headerSide, styles.headerRight]}>
          {HeaderRight ? <HeaderRight canGoBack={Boolean(back)} tintColor={colors.text} /> : null}
        </View>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const fontsReady = useAppFonts();

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={grimKeeperTheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            header: (props) => <CompactHeader {...props} />,
            headerLargeStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: {
              color: colors.text,
              fontFamily: 'GoogleSans-Bold',
              fontSize: 15,
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerTitleStyle: {
                color: colors.text,
                fontFamily: 'GoogleSans-Bold',
                fontSize: 20,
              },
              title: 'Grim Keeper',
            }}
          />
          <Stack.Screen name="create" options={{ title: 'New Game' }} />
          <Stack.Screen name="game/[id]" options={{ title: 'Game' }} />
        </Stack>
      </ThemeProvider>
      <StatusBar style="light" />
    </GestureHandlerRootView>
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
  },
  headerTitle: {
    color: colors.text,
    fontFamily: 'GoogleSans-Bold',
    fontSize: 15,
    textAlign: 'center',
  },
  headerTitleSlot: {
    alignItems: 'center',
    flex: 0.75,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
