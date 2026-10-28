import type { Role } from '@/types/game';
import type { PdfTextLine, PdfTextSegment } from '@/utils/pdf-text';

/** Fewer letters than this across the whole PDF means it is a scan or images only. */
const MIN_TEXT_LETTERS = 20;
/** Longest name prefix, in words, tried when a name and its ability share one text run. */
const MAX_NAME_WORDS = 5;
const MAX_SUGGESTIONS = 3;
/** Words that must follow a name in the same text run for it to count as name plus ability. */
const MIN_ABILITY_WORDS = 3;

const TEAM_HEADINGS: Record<string, string> = {
  demon: 'demon',
  demons: 'demon',
  fabled: 'fabled',
  loric: 'loric',
  minion: 'minion',
  minions: 'minion',
  outsider: 'outsider',
  outsiders: 'outsider',
  townsfolk: 'townsfolk',
  traveler: 'traveller',
  travelers: 'traveller',
  traveller: 'traveller',
  travellers: 'traveller',
};

/** Headings after the character list, where other names are not characters to report. */
const END_HEADINGS = new Set([
  'firstnight',
  'jinx',
  'jinxes',
  'nightorder',
  'othernight',
  'othernights',
]);

/** Night order steps and labels that look like character names. */
const NON_CHARACTER_NAMES = new Set(['dawn', 'demoninfo', 'dusk', 'minioninfo']);

/** Lowercase words a character name can contain, such as Spirit of Ivory. */
const NAME_CONNECTORS = new Set(['a', 'de', 'ex', 'la', 'of', 'the']);

export type PdfScriptUnmatchedRole = {
  name: string;
  /** The team heading the name was listed under. */
  team?: string;
};

export type PdfScriptDraft = {
  author?: string;
  name?: string;
  roles: Role[];
  unmatched: PdfScriptUnmatchedRole[];
};

/** How to resolve a name that did not match an official character. */
export type PdfScriptRoleChoice = { kind: 'custom' } | { kind: 'role'; roleId: string };

type RoleMatch = { role: Role; rest: string };

export class PdfScriptTextError extends Error {}

/**
 * Reads a script's name, author and characters from PDF text. Characters are matched to the
 * catalog by name; names listed under a team heading that match nothing are returned in
 * `unmatched` so the user can pick a role or skip them.
 */
export function parseScriptPdfText(lines: PdfTextLine[], catalog: Role[]): PdfScriptDraft {
  const letterCount = lines
    .flat()
    .reduce((count, segment) => count + (segment.text.match(/\p{L}/gu)?.length ?? 0), 0);

  if (letterCount < MIN_TEXT_LETTERS) {
    throw new PdfScriptTextError(
      'This PDF has no readable text. It may be a scan or a picture of a script. Try a PDF exported from a script tool, or upload the script JSON instead.',
    );
  }

  const rolesByName = getCatalogRolesByName(catalog);
  const rolesById = new Map<string, Role>();
  const nameStyleCounts = new Map<string, number>();
  const headerSegments: PdfTextSegment[] = [];
  const candidates: (PdfScriptUnmatchedRole & { style?: string })[] = [];
  let team: string | undefined;
  let hasEnded = false;
  let hasStarted = false;

  for (const line of lines) {
    const lineText = getLineText(line);
    const heading = normalizeRoleName(lineText);

    if (TEAM_HEADINGS[heading]) {
      team = TEAM_HEADINGS[heading];
      hasStarted = true;
      continue;
    }

    if (END_HEADINGS.has(heading)) {
      hasEnded = true;
      hasStarted = true;
      continue;
    }

    let lineHasRole = false;

    for (const segment of line) {
      const match = matchRoleName(segment.text, rolesByName);

      if (match) {
        lineHasRole = true;
        rolesById.set(match.role.id, rolesById.get(match.role.id) ?? match.role);
        if (segment.style && !match.rest) {
          nameStyleCounts.set(segment.style, (nameStyleCounts.get(segment.style) ?? 0) + 1);
        }
      } else if ((team || rolesById.size > 0) && !hasEnded) {
        const name = getCandidateName(segment);
        if (name) {
          candidates.push({ name, style: segment.style, team });
        }
      }
    }

    if (lineHasRole) {
      hasStarted = true;
    } else if (!hasStarted) {
      headerSegments.push(...line);
    }
  }

  const nameStyle = getMostCommon(nameStyleCounts);
  const unmatched = new Map<string, PdfScriptUnmatchedRole>();

  for (const { name, style, team: candidateTeam } of candidates) {
    // With font details, only text set like the matched names counts; without, trust the shape.
    const isListedAsName = !nameStyle || style === nameStyle;
    const key = normalizeRoleName(name);
    if (isListedAsName && !unmatched.has(key)) {
      unmatched.set(key, { name, team: candidateTeam });
    }
  }

  return {
    ...getHeaderDetails(headerSegments),
    roles: [...rolesById.values()],
    unmatched: [...unmatched.values()],
  };
}

/** Official characters with names close to `name`, closest first. */
export function getRoleSuggestions(name: string, catalog: Role[], limit = MAX_SUGGESTIONS) {
  const target = normalizeRoleName(name);

  return [...getCatalogRolesByName(catalog)]
    .map(([roleName, role]) => ({
      distance:
        roleName.includes(target) || target.includes(roleName)
          ? Math.abs(roleName.length - target.length) / 2
          : getEditDistance(roleName, target),
      role,
      roleName,
    }))
    .filter(
      ({ distance, roleName }) =>
        distance <= Math.max(2, Math.min(roleName.length, target.length) * 0.4),
    )
    .sort(
      (first, second) =>
        first.distance - second.distance || first.role.name.localeCompare(second.role.name),
    )
    .slice(0, limit)
    .map(({ role }) => role);
}

/**
 * Builds script JSON from a reviewed draft, so a PDF import is saved through the same path as an
 * uploaded JSON script. Unmatched names are skipped unless `choices` picks a role or keeps them as
 * custom characters.
 */
export function createPdfScriptJson(
  draft: Pick<PdfScriptDraft, 'author' | 'name' | 'roles' | 'unmatched'>,
  choices: ReadonlyMap<string, PdfScriptRoleChoice>,
  catalog: Role[],
) {
  const catalogIds = new Set(catalog.map((role) => role.id));
  const roleIds = new Set(draft.roles.map((role) => role.id));
  const customRoles: { id: string; name: string; team?: string }[] = [];

  for (const unmatched of draft.unmatched) {
    const choice = choices.get(unmatched.name);

    if (choice?.kind === 'role') {
      roleIds.add(choice.roleId);
    } else if (choice?.kind === 'custom') {
      const baseId = normalizeRoleName(unmatched.name) || 'custom';
      const id = catalogIds.has(baseId) || roleIds.has(baseId) ? `${baseId}_custom` : baseId;
      roleIds.add(id);
      customRoles.push({
        id,
        name: unmatched.name,
        ...(unmatched.team ? { team: unmatched.team } : {}),
      });
    }
  }

  const customRolesById = new Map(customRoles.map((role) => [role.id, role]));
  const meta = {
    id: '_meta',
    ...(draft.name?.trim() ? { name: draft.name.trim() } : {}),
    ...(draft.author?.trim() ? { author: draft.author.trim() } : {}),
  };

  return JSON.stringify([meta, ...[...roleIds].map((id) => customRolesById.get(id) ?? id)]);
}

/** Lowercase letters and digits only, so "Lil’ Monsta" and "lil monsta" compare equal. */
export function normalizeRoleName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getCatalogRolesByName(catalog: Role[]) {
  const rolesByName = new Map<string, Role>();

  for (const role of catalog) {
    const name = normalizeRoleName(role.name);
    if (
      name &&
      !role.id.startsWith('generic') &&
      !TEAM_HEADINGS[name] &&
      !NON_CHARACTER_NAMES.has(name) &&
      !rolesByName.has(name)
    ) {
      rolesByName.set(name, role);
    }
  }

  return rolesByName;
}

function matchRoleName(text: string, rolesByName: Map<string, Role>): RoleMatch | undefined {
  const exactRole = rolesByName.get(normalizeRoleName(text));
  if (exactRole) {
    return { rest: '', role: exactRole };
  }

  const words = text.split(' ');
  for (let count = Math.min(MAX_NAME_WORDS, words.length - 1); count >= 1; count -= 1) {
    const lastWord = words[count - 1];
    const nextWord = words[count];
    // "Damsel, if chosen" or "Imp. If" is a mention inside an ability, not a listed name.
    const endsName = /[\p{L}’'):]$/u.test(lastWord) || /^[-–—:]$/.test(nextWord);
    const role = endsName
      ? rolesByName.get(normalizeRoleName(words.slice(0, count).join(' ')))
      : undefined;

    // A name followed by ability text, not a title such as "Imp Party".
    if (role && !/^\p{Ll}/u.test(nextWord) && words.length - count >= MIN_ABILITY_WORDS) {
      return { rest: words.slice(count).join(' '), role };
    }
  }

  return undefined;
}

/** The name in a segment that looks like a listed character, such as "Name" or "Name: ability". */
function getCandidateName(segment: PdfTextSegment) {
  const text = segment.style ? segment.text : (segment.text.split(/\s*(?::|\s[-–—])\s/)[0] ?? '');
  const words = text.trim().split(' ');
  const key = normalizeRoleName(text);

  if (
    !key ||
    words.length > MAX_NAME_WORDS - 1 ||
    text.length > 30 ||
    NON_CHARACTER_NAMES.has(key) ||
    TEAM_HEADINGS[key] ||
    END_HEADINGS.has(key) ||
    /[.,;!?\d]/.test(text)
  ) {
    return undefined;
  }

  const isNameShaped = words.every(
    (word, index) => /^[\p{Lu}'’"(]/u.test(word) || (index > 0 && NAME_CONNECTORS.has(word)),
  );

  return isNameShaped ? text.trim() : undefined;
}

function getHeaderDetails(segments: PdfTextSegment[]): Pick<PdfScriptDraft, 'author' | 'name'> {
  let author: string | undefined;
  const nameSegments: PdfTextSegment[] = [];

  for (const segment of segments) {
    const authorMatch = /^(?:by|author:?)\s+(.+)$/i.exec(segment.text);
    const inlineAuthorMatch = /^(.+?)\s+by\s+(.+)$/i.exec(segment.text);

    if (authorMatch) {
      author ??= authorMatch[1].trim();
    } else if (inlineAuthorMatch && !author) {
      author = inlineAuthorMatch[2].trim();
      nameSegments.push({ ...segment, text: inlineAuthorMatch[1] });
    } else if (/\p{L}{2}/u.test(segment.text)) {
      nameSegments.push(segment);
    }
  }

  // The title is usually the biggest text above the characters.
  const name = nameSegments.reduce<PdfTextSegment | undefined>(
    (largest, segment) =>
      !largest || getStyleSize(segment.style) > getStyleSize(largest.style) ? segment : largest,
    undefined,
  )?.text;

  return { ...(author ? { author } : {}), ...(name ? { name: name.trim() } : {}) };
}

function getLineText(line: PdfTextLine) {
  return line.map((segment) => segment.text).join(' ');
}

function getStyleSize(style?: string) {
  return Number(style?.split(':').at(-1)) || 0;
}

function getMostCommon(counts: Map<string, number>) {
  let mostCommon: string | undefined;

  for (const [value, count] of counts) {
    if (!mostCommon || count > (counts.get(mostCommon) ?? 0)) {
      mostCommon = value;
    }
  }

  return mostCommon;
}

function getEditDistance(first: string, second: string) {
  let previous = Array.from({ length: second.length + 1 }, (_, index) => index);

  for (let row = 1; row <= first.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= second.length; column += 1) {
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + (first[row - 1] === second[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }

  return previous[second.length];
}
