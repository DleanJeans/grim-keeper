import AsyncStorage from '@react-native-async-storage/async-storage';
import { useURL } from 'expo-linking';
import { useEffect, useRef } from 'react';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['[Reanimated] Reduced motion setting']);

/**
 * On mount, check URL for ?clear=true and wipe AsyncStorage if present.
 * Then call onReady.
 */
export function useDevClear(onReady: () => void) {
  const url = useURL();
  const cleared = useRef(false);

  useEffect(() => {
    console.log({ url })
    if (!cleared.current && url?.includes('clear=true')) {
      console.log('Clearing...')
      cleared.current = true;
      AsyncStorage.clear().then(onReady);
    } else {
      onReady();
    }
  }, [url]);
}
