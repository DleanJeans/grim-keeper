import { useFonts } from 'expo-font';

export function useAppFonts() {
  const [fontsLoaded, fontError] = useFonts({
    GoogleSans: require('@/assets/fonts/GoogleSans.ttf'),
    'GoogleSans-Bold': require('@/assets/fonts/GoogleSans-Bold.ttf'),
  });

  return fontsLoaded || !!fontError;
}
