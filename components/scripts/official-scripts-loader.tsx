import { useEffect, useRef } from 'react';

import { useGameStore } from '@/store/game-store';
import {
  createOfficialCarouselScript,
  createStoredScript,
  fetchOfficialRemoteScripts,
  fetchRemoteScriptContent,
  fetchRoleCatalog,
  OFFICIAL_CAROUSEL_SCRIPT_ID,
} from '@/utils/script-service';

export function OfficialScriptsLoader() {
  const startedRef = useRef(false);

  useEffect(() => {
    let active = true;

    function startLoading() {
      if (startedRef.current) {
        return;
      }

      startedRef.current = true;
      void loadOfficialScripts(() => active).catch(() => {
        // Startup seeding is best effort; the Scripts screen can retry manually.
      });
    }

    if (useGameStore.persist.hasHydrated()) {
      startLoading();
    } else {
      const unsubscribe = useGameStore.persist.onFinishHydration(startLoading);

      return () => {
        active = false;
        startedRef.current = false;
        unsubscribe();
      };
    }

    return () => {
      active = false;
      startedRef.current = false;
    };
  }, []);

  return null;
}

async function loadOfficialScripts(isActive: () => boolean) {
  const initialState = useGameStore.getState();
  const catalogRequest =
    initialState.roleCatalog.length > 0
      ? Promise.resolve(initialState.roleCatalog)
      : fetchRoleCatalog();
  const scriptsRequest = fetchOfficialRemoteScripts();
  const [catalogResult, scriptsResult] = await Promise.allSettled([catalogRequest, scriptsRequest]);

  if (!isActive()) {
    return;
  }

  const catalog =
    catalogResult.status === 'fulfilled' ? catalogResult.value : initialState.roleCatalog;

  if (initialState.roleCatalog.length === 0 && catalog.length > 0) {
    useGameStore.getState().setRoleCatalog(catalog);
  }

  if (scriptsResult.status === 'fulfilled') {
    for (const remoteScript of scriptsResult.value) {
      if (!isActive() || hasStoredRemoteScript(remoteScript.pk)) {
        continue;
      }

      let content = remoteScript.content;
      try {
        content = await fetchRemoteScriptContent(remoteScript.pk);
      } catch {
        // The list response contains a usable role-id snapshot as a fallback.
      }

      if (!isActive() || hasStoredRemoteScript(remoteScript.pk)) {
        continue;
      }

      useGameStore.getState().saveScript(createStoredScript(remoteScript, content, catalog));
    }
  }

  if (!isActive() || catalog.length === 0 || hasStoredScript(OFFICIAL_CAROUSEL_SCRIPT_ID)) {
    return;
  }

  const carouselScript = createOfficialCarouselScript(catalog);
  if (carouselScript.roles.length > 0) {
    useGameStore.getState().saveScript(carouselScript);
  }
}

function hasStoredRemoteScript(remoteId: number) {
  return useGameStore.getState().scripts.some((script) => script.remoteId === remoteId);
}

function hasStoredScript(scriptId: string) {
  return useGameStore.getState().scripts.some((script) => script.id === scriptId);
}
