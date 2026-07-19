import type { ExpoConfig } from 'expo/config';

type Variant = 'development' | 'preview' | 'production';

const variant: Variant = (process.env.APP_VARIANT as Variant) || 'development';

const isDev = variant === 'development';
const bundleSuffix = isDev ? '.dev' : variant === 'preview' ? '.preview' : '';
const baseId = 'com.dleanjeans.grimkeeper';
const bundleId = `${baseId}${bundleSuffix}`;
const projectId = '89799b1d-f54f-490e-bcf5-cdf38764f4da';

const config: ExpoConfig = {
  name: 'GrimKeeper',
  slug: 'grim-keeper',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  scheme: 'exp+grim-keeper',
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleId,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0f172a',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    package: bundleId,
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'exp+grim-keeper' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
    output: 'single',
  },
  updates: {
    url: `https://u.expo.dev/${projectId}`,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 10000,
  },
  runtimeVersion: { policy: 'sdkVersion' },
  extra: {
    eas: {
      projectId,
    },
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    [
      'expo-font',
      {
        fonts: ['./assets/fonts/GoogleSans.ttf', './assets/fonts/GoogleSans-Bold.ttf'],
      },
    ],
  ],
  owner: 'dleanjeans',
};

export default config;
