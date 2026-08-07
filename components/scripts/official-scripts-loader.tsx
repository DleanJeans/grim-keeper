import { useCallback, useEffect, useRef } from 'react';

import { useGameStore } from '@/store/game-store';
import {
  createOfficialCarouselScript,
  createStoredScript,
  fetchOfficialRemoteScripts,
  fetchRemoteScriptContent,
  fetchRoleCatalog,
  OFFICIAL_CAROUSEL_SCRIPT_ID,
  restoreRemoteScript,
} from '@/utils/script-service';

const OFFICIAL_SCRIPT_IDS = [
  'trouble-brewing',
  'sects-and-violets',
  'bad-moon-rising',
  OFFICIAL_CAROUSEL_SCRIPT_ID,
];

const OFFICIAL_ROLE_EDITIONS = new Set([
  'bad moon rising',
  'bmr',
  'carousel',
  'fabled',
  'loric',
  'sects and violets',
  'snv',
  'tb',
  'trouble brewing',
]);

export function OfficialScriptsLoader() {
  const scripts = useGameStore((state) => state.scripts);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const loadingRef = useRef(false);
  const activeRef = useRef(true);

  const startLoading = useCallback(() => {
    const state = useGameStore.getState();
    if (loadingRef.current || !needsScriptRecovery(state.scripts, state.roleCatalog)) {
      return;
    }

    loadingRef.current = true;
    void loadOfficialScripts(() => activeRef.current)
      .catch(() => {
        // Startup seeding is best effort; the Scripts screen can retry manually.
      })
      .finally(() => {
        loadingRef.current = false;
      });
  }, []);

  useEffect(() => {
    activeRef.current = true;

    if (useGameStore.persist.hasHydrated()) {
      startLoading();
    } else {
      const unsubscribe = useGameStore.persist.onFinishHydration(startLoading);

      return () => {
        activeRef.current = false;
        unsubscribe();
      };
    }

    return () => {
      activeRef.current = false;
    };
  }, [startLoading]);

  useEffect(() => {
    if (useGameStore.persist.hasHydrated() && needsScriptRecovery(scripts, roleCatalog)) {
      startLoading();
    }
  }, [roleCatalog, scripts, startLoading]);

  return null;
}

function needsOfficialScripts(scripts: ReturnType<typeof useGameStore.getState>['scripts']) {
  return OFFICIAL_SCRIPT_IDS.some(
    (scriptId) => !scripts.some((script) => script.id === scriptId && script.roles.length > 0),
  );
}

function needsScriptRecovery(
  scripts: ReturnType<typeof useGameStore.getState>['scripts'],
  roleCatalog: ReturnType<typeof useGameStore.getState>['roleCatalog'],
) {
  return (
    !hasOfficialRoleCatalog(roleCatalog) ||
    needsOfficialScripts(scripts) ||
    scripts.some((script) => script.remoteId !== undefined && script.roles.length === 0)
  );
}

async function loadOfficialScripts(isActive: () => boolean) {
  const initialState = useGameStore.getState();
  const catalogRequest = hasOfficialRoleCatalog(initialState.roleCatalog)
    ? Promise.resolve(initialState.roleCatalog)
    : fetchRoleCatalog();
  const scriptsRequest = fetchOfficialRemoteScripts();
  const [catalogResult, scriptsResult] = await Promise.allSettled([catalogRequest, scriptsRequest]);

  if (!isActive()) {
    return;
  }

  const catalog =
    catalogResult.status === 'fulfilled' ? catalogResult.value : initialState.roleCatalog;

  const downloadedScripts = initialState.scripts.filter(
    (script) => script.remoteId !== undefined && script.roles.length === 0,
  );

  if (!hasOfficialRoleCatalog(initialState.roleCatalog) && catalog.length > 0) {
    useGameStore.getState().setRoleCatalog([...catalog, ...initialState.roleCatalog]);
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

  for (const script of downloadedScripts) {
    if (!isActive() || script.remoteId === undefined || hasStoredRemoteScript(script.remoteId)) {
      continue;
    }

    try {
      const restoredScript = await restoreRemoteScript(script, catalog);

      if (isActive()) {
        useGameStore.getState().saveScript(restoredScript);
      }
    } catch {
      // A failed recovery can be retried when the Scripts screen or app restarts.
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
  return useGameStore
    .getState()
    .scripts.some((script) => script.remoteId === remoteId && script.roles.length > 0);
}

function hasStoredScript(scriptId: string) {
  return useGameStore
    .getState()
    .scripts.some((script) => script.id === scriptId && script.roles.length > 0);
}

function hasOfficialRoleCatalog(roles: ReturnType<typeof useGameStore.getState>['roleCatalog']) {
  return roles.some((role) =>
    OFFICIAL_ROLE_EDITIONS.has(role.edition?.trim().toLocaleLowerCase() ?? ''),
  );
}
