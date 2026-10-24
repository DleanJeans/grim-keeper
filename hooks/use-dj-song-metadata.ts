import { useEffect, useState } from 'react';

import { type DjSongMetadata, resolveDjSongMetadata } from '@/utils/spotify';

const metadataCache = new Map<string, DjSongMetadata>();

export function useDjSongMetadata(songUrl: string) {
  const [metadata, setMetadata] = useState<DjSongMetadata | undefined>(() =>
    metadataCache.get(songUrl),
  );

  useEffect(() => {
    let active = true;
    const cached = metadataCache.get(songUrl);
    if (cached) {
      setMetadata(cached);
      return () => {
        active = false;
      };
    }

    setMetadata(undefined);
    resolveDjSongMetadata(songUrl).then((nextMetadata) => {
      // A Spotify lookup without a title failed (often offline), so try again on the next mount.
      if (nextMetadata.provider !== 'spotify' || nextMetadata.title) {
        metadataCache.set(songUrl, nextMetadata);
      }
      if (active) {
        setMetadata(nextMetadata);
      }
    });

    return () => {
      active = false;
    };
  }, [songUrl]);

  return metadata;
}
