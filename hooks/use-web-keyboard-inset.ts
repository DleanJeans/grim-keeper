import { useEffect, useState } from 'react';

/**
 * On web, returns how much of the bottom of the layout viewport is hidden
 * behind the on-screen keyboard. Mobile browsers such as Firefox on Android
 * shrink only the visual viewport when the keyboard opens, so a sheet pinned
 * to the bottom of a full-screen modal ends up behind the keyboard and
 * KeyboardAvoidingView does nothing there. Native platforms always get 0.
 */
export function useWebKeyboardInset(active = true) {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (process.env.EXPO_OS !== 'web' || !active || typeof window === 'undefined') {
      setInset(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    function update() {
      if (!viewport) return;
      const hidden = window.innerHeight - viewport.height - viewport.offsetTop;
      setInset(hidden > 1 ? Math.round(hidden) : 0);
    }

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [active]);

  return inset;
}
