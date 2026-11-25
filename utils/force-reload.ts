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
