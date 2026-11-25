/**
 * Web only: removes service workers and Cache Storage entries, then reloads with a
 * cache-busting query so the newest deployed version loads. localStorage and IndexedDB
 * (games, friends, settings, theme) are left untouched.
 */
export async function forceReloadWebApp() {
  if (process.env.EXPO_OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }
  } catch {
    // Reload anyway; the cache-busting URL still bypasses the HTTP cache.
  }

  const url = new URL(window.location.href);
  url.searchParams.set('_reload', Date.now().toString());
  window.location.replace(url.toString());
}

const ENTRY_SCRIPT = /\/_expo\/static\/js\/web\/[^"'\s]+\.js/g;

/**
 * Web only: compares the entry script of the running page with the one the server
 * currently serves. Returns undefined when the check cannot be made (offline, error).
 */
export async function isWebUpdateAvailable() {
  if (process.env.EXPO_OS !== 'web' || typeof document === 'undefined') {
    return undefined;
  }

  try {
    const response = await fetch(`/?_check=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'text/html' },
    });
    if (!response.ok) {
      return undefined;
    }
    const deployed = new Set((await response.text()).match(ENTRY_SCRIPT));
    const running = Array.from(document.scripts)
      .map((script) => script.getAttribute('src') ?? '')
      .filter((src) => ENTRY_SCRIPT.test(src));
    ENTRY_SCRIPT.lastIndex = 0;
    if (deployed.size === 0 || running.length === 0) {
      return undefined;
    }
    return running.some((src) => !deployed.has(src));
  } catch {
    return undefined;
  }
}
