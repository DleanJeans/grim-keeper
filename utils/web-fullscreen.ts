let fullscreenRequest: Promise<void> | null = null;

export function canUseWebFullscreen() {
  return (
    process.env.EXPO_OS === 'web' &&
    typeof document !== 'undefined' &&
    document.fullscreenEnabled &&
    typeof document.documentElement.requestFullscreen === 'function'
  );
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
