import type { Role, StoredScript } from '@/types/game';
import { createScriptId } from '@/utils/object-id';
import { BOTC_ROLE_CATALOG_URL, mergeScriptRoles, normalizeRoleCatalog } from '@/utils/role-utils';

export const BOTC_SCRIPTS_API_URL = 'https://www.botcscripts.com/api/scripts';
export const OFFICIAL_SCRIPT_AUTHOR = 'The Pandemonium Institute';
export const OFFICIAL_CAROUSEL_SCRIPT_ID = 'carousel';

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
  const response = await fetch(BOTC_ROLE_CATALOG_URL);
  if (!response.ok) {
    throw new Error(`Role catalog request failed with ${response.status}`);
  }

  return normalizeRoleCatalog(await response.json());
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

export function createHomebrewScript(
  value: string,
  catalog: Role[],
  existingId?: string,
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
  if (!metadata) {
    throw new Error('The script JSON is missing a _meta entry.');
  }

  const name = getOptionalText(metadata.name);
  if (!name) {
    throw new Error('The script metadata needs a name.');
  }

  const roles = mergeScriptRoles(content, catalog);
  if (roles.length === 0) {
    throw new Error('The script does not contain any usable roles.');
  }

  const author = getOptionalText(metadata.author);

  return {
    id: existingId ?? createScriptId({ author, name }, []),
    name,
    version: getOptionalText(metadata.version) ?? '1.0.0',
    scriptType:
      getOptionalText(metadata.scriptType) ?? getOptionalText(metadata.script_type) ?? 'Full',
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
