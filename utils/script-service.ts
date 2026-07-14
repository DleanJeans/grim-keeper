import type { Role, StoredScript } from '@/types/game';
import { BOTC_ROLE_CATALOG_URL, mergeScriptRoles, normalizeRoleCatalog } from '@/utils/role-utils';

export const BOTC_SCRIPTS_API_URL = 'https://www.botcscripts.com/api/scripts';

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
  const response = await fetch(
    `${BOTC_SCRIPTS_API_URL}/?latest=true&include_homebrew=true&page=1${searchParam}`,
  );

  if (!response.ok) {
    throw new Error(`Script list request failed with ${response.status}`);
  }

  const data = (await response.json()) as { results?: unknown[] };
  return (data.results ?? []).flatMap(parseRemoteScript);
}

export async function fetchRemoteScriptContent(remoteId: number) {
  const response = await fetch(`${BOTC_SCRIPTS_API_URL}/${remoteId}/json`);
  if (!response.ok) {
    throw new Error(`Script download failed with ${response.status}`);
  }

  return response.json();
}

export function createStoredScript(
  remoteScript: RemoteScript,
  content: unknown,
  catalog: Role[],
  existingId = `script-remote-${remoteScript.pk}`,
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
