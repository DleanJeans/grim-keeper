import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { parseSpotifySong, parseYouTubeVideoId } from '@/utils/spotify';

/** Returns the clipboard text when it is a Spotify or YouTube link, else undefined. */
export function useClipboardSongUrl() {
  const [songUrl, setSongUrl] = useState<string>();

  const refresh = useCallback(async () => {
    try {
      const text = (await Clipboard.getStringAsync()).trim();
      setSongUrl(parseSpotifySong(text) || parseYouTubeVideoId(text) ? text : undefined);
    } catch {
      setSongUrl(undefined);
    }
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh]);

  // Browsers (iOS Safari) only allow clipboard reads from a user gesture, so callers can re-read on tap.
  return { songUrl, refresh };
}
