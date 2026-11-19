const DEFAULT_LINK_SCRIPT_NAME = 'Pocket Grimoire script';

/**
 * Turns a Pocket Grimoire sheet link (`.../sheet?characters=a%2Cb`) into script JSON,
 * or returns null when the text is not such a link.
 */
export function pocketGrimoireLinkToScriptJson(value: string, fallbackName?: string) {
  const text = value.trim();
  if (!/^https?:\/\/\S+$/i.test(text)) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }

  if (!/(^|\.)pocketgrimoire\.co\.uk$/i.test(url.hostname)) {
    return null;
  }

  const roleIds = (url.searchParams.get('characters') ?? '')
    .split(',')
    .map((id) => id.trim().toLocaleLowerCase())
    .filter(Boolean);
  if (roleIds.length === 0) {
    return null;
  }

  const name =
    url.searchParams.get('name')?.trim() || fallbackName?.trim() || DEFAULT_LINK_SCRIPT_NAME;

  return JSON.stringify([{ id: '_meta', name }, ...new Set(roleIds)]);
}
