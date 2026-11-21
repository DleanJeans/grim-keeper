import 'expo-sqlite/localStorage/install';

const AUTO_FULLSCREEN_KEY = 'grim-keeper-auto-fullscreen';

let fullscreenRequest: Promise<void> | null = null;

export function canUseWebFullscreen() {
  return (
    process.env.EXPO_OS === 'web' &&
    typeof document !== 'undefined' &&
    document.fullscreenEnabled &&
    typeof document.documentElement.requestFullscreen === 'function'
  );
}

export function isWebFullscreenActive() {
  return canUseWebFullscreen() && document.fullscreenElement !== null;
}

export function requestWebFullscreen() {
  if (!canUseWebFullscreen() || document.fullscreenElement) {
    return Promise.resolve();
  }

  if (fullscreenRequest) {
    return fullscreenRequest;
  }

  fullscreenRequest = document.documentElement
    .requestFullscreen()
    .catch(() => undefined)
    .finally(() => {
      fullscreenRequest = null;
    });

  return fullscreenRequest;
}

export function isAutoFullscreenEnabled() {
  try {
    return globalThis.localStorage?.getItem(AUTO_FULLSCREEN_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setAutoFullscreenEnabled(enabled: boolean) {
  try {
    globalThis.localStorage?.setItem(AUTO_FULLSCREEN_KEY, enabled ? 'on' : 'off');
  } catch {
    // Ignore storage failures; the setting just will not persist.
  }
}

export function requestAutoFullscreen() {
  return isAutoFullscreenEnabled() ? requestWebFullscreen() : Promise.resolve();
}
