import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';
import { type ImageSourcePropType, Platform } from 'react-native';

import type { Role } from '@/types/game';
import { getRoleIconUrl } from '@/utils/role-utils';

const roleIconCacheDirectory = FileSystem.cacheDirectory
  ? `${FileSystem.cacheDirectory}role-icons/`
  : undefined;
const WEB_ROLE_ICON_CACHE_NAME = 'grimkeeper-role-icons-v1';
const pendingDownloads = new Map<string, Promise<string>>();
const pendingWebDownloads = new Map<string, Promise<string>>();

export function useRoleIconSource(role: Role | undefined) {
  const localSource = role?.imageSource;
  const remoteUri = localSource ? undefined : role ? getRoleIconUrl(role) : undefined;
  const [source, setSource] = useState(() => ({
    remoteUri,
    source: localSource ?? getInitialRemoteSource(remoteUri),
  }));

  useEffect(() => {
    let mounted = true;

    if (localSource) {
      setSource({ remoteUri, source: localSource });
      return () => {
        mounted = false;
      };
    }

    if (!remoteUri) {
      setSource({ remoteUri, source: undefined });
      return () => {
        mounted = false;
      };
    }

    cacheRoleIcon(remoteUri).then((cachedUri) => {
      if (mounted) {
        setSource({ remoteUri, source: { uri: cachedUri } });
      }
    });

    return () => {
      mounted = false;
    };
  }, [localSource, remoteUri]);

  if (localSource) {
    return localSource;
  }

  if (source.remoteUri !== remoteUri) {
    if (Platform.OS === 'web') {
      return undefined;
    }

    return remoteUri ? { uri: remoteUri } : undefined;
  }

  return source.source;
}

function getInitialRemoteSource(remoteUri: string | undefined): ImageSourcePropType | undefined {
  return Platform.OS === 'web' || !remoteUri ? undefined : { uri: remoteUri };
}

function cacheRoleIcon(remoteUri: string) {
  if (Platform.OS === 'web') {
    return cacheWebRoleIcon(remoteUri);
  }

  const cacheDirectory = roleIconCacheDirectory;
  if (!shouldCacheRoleIcon(remoteUri) || !cacheDirectory) {
    return Promise.resolve(remoteUri);
  }

  const pendingDownload = pendingDownloads.get(remoteUri);
  if (pendingDownload) {
    return pendingDownload;
  }

  const download = (async () => {
    try {
      const fileUri = getRoleIconFileUri(remoteUri);
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDirectory, { intermediates: true }).catch(
          () => undefined,
        );
        const temporaryFileUri = getRoleIconTemporaryFileUri(remoteUri);
        await FileSystem.downloadAsync(remoteUri, temporaryFileUri);
        await FileSystem.moveAsync({ from: temporaryFileUri, to: fileUri });
      }
      return fileUri;
    } catch {
      return remoteUri;
    } finally {
      pendingDownloads.delete(remoteUri);
    }
  })();

  pendingDownloads.set(remoteUri, download);
  return download;
}

function cacheWebRoleIcon(remoteUri: string) {
  const pendingDownload = pendingWebDownloads.get(remoteUri);
  if (pendingDownload) {
    return pendingDownload;
  }

  const download = (async () => {
    try {
      if (
        typeof caches === 'undefined' ||
        typeof URL === 'undefined' ||
        typeof URL.createObjectURL !== 'function'
      ) {
        return remoteUri;
      }

      const cache = await caches.open(WEB_ROLE_ICON_CACHE_NAME);
      const cachedResponse = await cache.match(remoteUri);
      const response = cachedResponse ?? (await fetch(remoteUri));

      if (!cachedResponse) {
        if (!response.ok) {
          return remoteUri;
        }
        await cache.put(remoteUri, response.clone());
      }

      return URL.createObjectURL(await response.blob());
    } catch {
      return remoteUri;
    }
  })();

  pendingWebDownloads.set(remoteUri, download);
  return download;
}

function getRoleIconFileUri(remoteUri: string) {
  return `${roleIconCacheDirectory}${encodeURIComponent(remoteUri)}`;
}

function getRoleIconTemporaryFileUri(remoteUri: string) {
  return `${getRoleIconFileUri(remoteUri)}.download`;
}

function shouldCacheRoleIcon(uri: string) {
  return Platform.OS !== 'web' && Boolean(roleIconCacheDirectory) && /^https?:\/\//.test(uri);
}
