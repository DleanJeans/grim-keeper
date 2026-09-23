import { useEffect, useState } from 'react';

import { canUseWebFullscreen, isWebFullscreenActive } from '@/utils/web-fullscreen';

export function useWebFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(() => isWebFullscreenActive());

  useEffect(() => {
    if (!canUseWebFullscreen()) {
      return;
    }

    const updateFullscreen = () => setIsFullscreen(isWebFullscreenActive());
    updateFullscreen();
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => document.removeEventListener('fullscreenchange', updateFullscreen);
  }, []);

  return isFullscreen;
}
