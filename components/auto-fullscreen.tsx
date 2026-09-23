import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { canUseWebFullscreen, requestWebFullscreen } from '@/utils/web-fullscreen';

const INTERACTIVE_SELECTOR = 'button, a, [role="button"], [role="link"]';

export function AutoFullscreen() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (!canUseWebFullscreen()) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (isInteractiveTarget(event.target)) {
        void requestWebFullscreen();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Enter' || event.key === ' ') && isInteractiveTarget(event.target)) {
        void requestWebFullscreen();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;
    void requestWebFullscreen();
  }, [pathname]);

  return null;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null;
}
