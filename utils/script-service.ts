import type { Game, Role, StoredScript } from '@/types/game';
import { createScriptId } from '@/utils/object-id';
import {
  BOTC_ROLE_CATALOG_URL,
  BOTC_ROLE_ICON_BASE_URL,
  mergeRoleCatalogMetadata,
  mergeScriptRoles,
  normalizeRoleCatalog,
  parseRoleIconCatalog,
} from '@/utils/role-utils';
import { SUSHI_BUFFET_SCRIPT_ID, SUSHI_BUFFET_SCRIPT_NAME } from '@/utils/script-constants';
import type { NightSheet } from '@/utils/script-utils';

export const BOTC_SCRIPTS_API_URL = 'https://www.botcscripts.com/api/scripts';
export const BOTC_NIGHT_SHEET_URL = 'https://release.botc.app/resources/data/nightsheet.json';
export const OFFICIAL_SCRIPT_AUTHOR = 'The Pandemonium Institute';
export const OFFICIAL_CAROUSEL_SCRIPT_ID = 'carousel';
export { SUSHI_BUFFET_SCRIPT_ID, SUSHI_BUFFET_SCRIPT_NAME } from '@/utils/script-constants';

const BOTC_RESOURCES_URL = `${BOTC_ROLE_ICON_BASE_URL.replace('/characters', '')}/`;

const officialScriptNames = new Set(['Trouble Brewing', 'Sects and Violets', 'Bad Moon Rising']);

export type RemoteScript = {
  pk: number;
  name: string;
  version: string;
  scriptType: string;
  author?: string;
  content: unknown[];
  score?: number;
};

export async function fetchRoleCatalog(): Promise<Role[]> {
  try {
    const response = await fetch(BOTC_ROLE_CATALOG_URL);
    if (!response.ok) {
      throw new Error(`Role catalog request failed with ${response.status}`);
    }

    const roles = normalizeRoleCatalog(await response.json());
    if (roles.length > 0) {
      return roles;
    }
  } catch {
    // The resources page remains available when the raw JSON catalog is blocked.
  }

  const fallbackResponse = await fetch(BOTC_RESOURCES_URL);
  if (!fallbackResponse.ok) {
    throw new Error(`Role catalog request failed with ${fallbackResponse.status}`);
  }

  const roles = parseRoleIconCatalog(await fallbackResponse.text());
  if (roles.length === 0) {
    throw new Error('The role catalog does not contain any role icons.');
  }

  return roles;
}

export async function fetchNightSheet(): Promise<NightSheet> {
  const response = await fetch(BOTC_NIGHT_SHEET_URL);
  if (!response.ok) {
    throw new Error(`Nightsheet request failed with ${response.status}`);
  }

  const data = (await response.json()) as { firstNight?: unknown; otherNight?: unknown };
  const firstNight = getNightSheetRoleIds(data.firstNight);
  const otherNight = getNightSheetRoleIds(data.otherNight);

  if (firstNight.length === 0 && otherNight.length === 0) {
    throw new Error('The nightsheet does not contain any role IDs.');
  }

  return { firstNight, otherNight };
}

export async function fetchRemoteScripts(search = ''): Promise<RemoteScript[]> {
  const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
  return fetchRemoteScriptsFromQuery(`latest=true&include_homebrew=true&page=1${searchParam}`);
}

export async function fetchOfficialRemoteScripts(): Promise<RemoteScript[]> {
  const scripts = await fetchRemoteScriptsFromQuery(
    `latest=true&include_homebrew=true&page=1&all_scripts=true&author=${encodeURIComponent(OFFICIAL_SCRIPT_AUTHOR)}`,
  );

  return scripts.filter(
    (script) => script.author === OFFICIAL_SCRIPT_AUTHOR && officialScriptNames.has(script.name),
  );
}

export async function fetchRemoteScriptContent(remoteId: number) {
  const response = await fetch(`${BOTC_SCRIPTS_API_URL}/${remoteId}/json`);
  if (!response.ok) {
    throw new Error(`Script download failed with ${response.status}`);
  }

  return response.json();
}

export async function restoreRemoteScript(
  script: StoredScript,
  catalog: Role[],
): Promise<StoredScript> {
  if (script.remoteId === undefined) {
    throw new Error('The script does not have a remote ID.');
  }

  const content = await fetchRemoteScriptContent(script.remoteId);
  const serializedContent = JSON.stringify(content);

  if (serializedContent === undefined) {
    throw new Error('The downloaded script content is invalid.');
  }

  return {
    ...createHomebrewScript(serializedContent, catalog, script.id),
    remoteId: script.remoteId,
  };
}

export function createHomebrewScript(
  value: string,
  catalog: Role[],
  existingId?: string,
  fallbackName?: string,
): StoredScript {
  let content: unknown;

  try {
    content = JSON.parse(value);
  } catch {
    throw new Error('The file is not valid JSON.');
  }

  if (!Array.isArray(content)) {
    throw new Error('The file must contain a script JSON array.');
  }

  const metadata = content.find(
    (item): item is Record<string, unknown> => isRecord(item) && item.id === '_meta',
  );
  const scriptMetadata = metadata ?? (getOptionalText(fallbackName) ? {} : undefined);
  if (!scriptMetadata) {
    throw new Error('The script JSON is missing a _meta entry.');
  }

  const name = getOptionalText(scriptMetadata.name) ?? getOptionalText(fallbackName);
  if (!name) {
    throw new Error('The script metadata needs a name.');
  }

  const roles = mergeScriptRoles(content, catalog);
  if (roles.length === 0) {
    throw new Error('The script does not contain any usable roles.');
  }

  const author = getOptionalText(scriptMetadata.author);

  return {
    id: existingId ?? createScriptId({ author, name }, []),
    name,
    version: getOptionalText(scriptMetadata.version) ?? '1.0.0',
    scriptType:
      getOptionalText(scriptMetadata.scriptType) ??
      getOptionalText(scriptMetadata.script_type) ??
      'Full',
    author,
    roles,
    updatedAt: new Date().toISOString(),
  };
}

export function createOfficialCarouselScript(
  catalog: Role[],
  existingId = OFFICIAL_CAROUSEL_SCRIPT_ID,
): StoredScript {
  return {
    id: existingId,
    name: 'Carousel',
    version: '1.0.0',
    scriptType: 'Full',
    author: OFFICIAL_SCRIPT_AUTHOR,
    roles: catalog.filter((role) => role.edition?.toLocaleLowerCase() === 'carousel'),
    updatedAt: new Date().toISOString(),
  };
}

export function createSushiBuffetScript(catalog: Role[], existingRoles: Role[] = []): StoredScript {
  const rolesById = new Map<string, Role>();

  for (const role of [...catalog, ...existingRoles]) {
    if (!rolesById.has(role.id)) {
      rolesById.set(role.id, role);
    }
  }

  return {
    id: SUSHI_BUFFET_SCRIPT_ID,
    name: SUSHI_BUFFET_SCRIPT_NAME,
    version: '1.0.0',
    scriptType: 'Full',
    roles: mergeRoleCatalogMetadata([...rolesById.values()], catalog),
    updatedAt: new Date().toISOString(),
  };
}

export function isSushiBuffetScript(script?: Pick<StoredScript, 'id'>) {
  return script?.id === SUSHI_BUFFET_SCRIPT_ID;
}

/** The game script's characters, limited to the enabled ones for Sushi Buffet. */
export function getGameScriptRoles(game: Pick<Game, 'script' | 'sushiRoleIds'>) {
  if (!game.script) return [];
  if (!isSushiBuffetScript(game.script) || !game.sushiRoleIds) return game.script.roles;

  const enabledRoleIds = new Set(game.sushiRoleIds);
  return game.script.roles.filter((role) => enabledRoleIds.has(role.id));
}

export function createStoredScript(
  remoteScript: RemoteScript,
  content: unknown,
  catalog: Role[],
  existingId = createScriptId(
    { author: remoteScript.author, name: remoteScript.name, remoteId: remoteScript.pk },
    [],
  ),
): StoredScript {
  return {
    id: existingId,
    remoteId: remoteScript.pk,
    name: remoteScript.name,
    version: remoteScript.version,
    scriptType: remoteScript.scriptType,
    author: remoteScript.author,
    roles: mergeScriptRoles(content, catalog),
    updatedAt: new Date().toISOString(),
  };
}

async function fetchRemoteScriptsFromQuery(query: string): Promise<RemoteScript[]> {
  const response = await fetch(`${BOTC_SCRIPTS_API_URL}/?${query}`);

  if (!response.ok) {
    throw new Error(`Script list request failed with ${response.status}`);
  }

  const data = (await response.json()) as { results?: unknown[] };
  return (data.results ?? []).flatMap(parseRemoteScript);
}

function parseRemoteScript(value: unknown): RemoteScript[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.pk !== 'number' || typeof candidate.name !== 'string') {
    return [];
  }

  return [
    {
      pk: candidate.pk,
      name: candidate.name,
      version: typeof candidate.version === 'string' ? candidate.version : '1.0.0',
      scriptType: typeof candidate.script_type === 'string' ? candidate.script_type : 'Full',
      author: typeof candidate.author === 'string' ? candidate.author : undefined,
      content: Array.isArray(candidate.content) ? candidate.content : [],
      score: typeof candidate.score === 'number' ? candidate.score : undefined,
    },
  ];
}

function getOptionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getNightSheetRoleIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((roleId): roleId is string => typeof roleId === 'string')
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
