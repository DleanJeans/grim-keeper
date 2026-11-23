import type { Game, Role, SavedNote, StoredScript } from '@/types/game';
import { isDecidedResult } from '@/utils/game-utils';
import { APP_USER_ID } from '@/utils/object-id';
import { SUSHI_BUFFET_SCRIPT_ID } from '@/utils/script-constants';

export type ScriptRoleEntry = {
  description?: string;
  noteCount: number;
  notes: ScriptRoleNote[];
  role: Role;
};

export type ScriptRoleNote = {
  playerNames: string[];
  /** The saved notes with this text about the role; empty for script and catalog notes. */
  savedNoteIds: string[];
  text: string;
};

export type NightSheet = {
  firstNight: string[];
  otherNight: string[];
};

/** Fewer games per friend on one script than overall, so the minimum starts lower than on Friends. */
export const DEFAULT_SCRIPT_MIN_GAMES = 3;

/**
 * The id that groups a script with its base script and the other scripts based on it: the end of
 * the base chain. A game's embedded script stands in for a script that left the list.
 */
export function getScriptFamilyId(scriptId: string, scripts: StoredScript[], games: Game[] = []) {
  const findScript = (id: string) =>
    scripts.find((script) => script.id === id) ??
    games.find((game) => game.script?.id === id)?.script;
  const seen = new Set([scriptId]);
  let currentId = scriptId;
  let baseId = findScript(currentId)?.baseScriptId;

  while (baseId && !seen.has(baseId)) {
    seen.add(baseId);
    currentId = baseId;
    baseId = findScript(currentId)?.baseScriptId;
  }

  return currentId;
}

/** The scripts that can be this script's base: not itself and not a script based on it. */
export function getBaseScriptCandidates(script: StoredScript, scripts: StoredScript[]) {
  const basedOnScript = (candidate: StoredScript) => {
    const seen = new Set([candidate.id]);
    let baseId = candidate.baseScriptId;

    while (baseId && !seen.has(baseId)) {
      if (baseId === script.id) return true;
      seen.add(baseId);
      baseId = scripts.find((other) => other.id === baseId)?.baseScriptId;
    }

    return false;
  };

  return scripts.filter(
    (candidate) =>
      candidate.id !== script.id &&
      candidate.id !== SUSHI_BUFFET_SCRIPT_ID &&
      !basedOnScript(candidate),
  );
}

/** Looks up a game's script family, or undefined for a game without a script. */
function getGameFamilyId(game: Game, scripts: StoredScript[], games: Game[]) {
  const scriptId = game.scriptId ?? game.script?.id;
  return scriptId ? getScriptFamilyId(scriptId, scripts, games) : undefined;
}

/**
 * The games played on a script or on any script in its family (its base script and the scripts
 * based on it). Matched by script id like the script cards' counts.
 */
export function getScriptGames(games: Game[], scriptId: string, scripts: StoredScript[] = []) {
  const familyId = getScriptFamilyId(scriptId, scripts, games);
  return games.filter((game) => getGameFamilyId(game, scripts, games) === familyId);
}

/** The names of the other scripts whose games count together with this script's. */
export function getScriptFamilyNames(scriptId: string, games: Game[], scripts: StoredScript[]) {
  const familyId = getScriptFamilyId(scriptId, scripts, games);
  const names = new Map<string, string>();

  for (const script of [
    ...scripts,
    ...games.flatMap((game) => (game.script ? [game.script] : [])),
  ]) {
    if (
      script.id !== scriptId &&
      !names.has(script.id) &&
      getScriptFamilyId(script.id, scripts, games) === familyId
    ) {
      names.set(script.id, script.name);
    }
  }

  return [...names.values()];
}

/** The ids of everyone who played in a game, leaving out its Storytellers. */
export function getGamePlayerIds(game: Game) {
  return new Set(game.players.filter((player) => !player.isStoryteller).map((player) => player.id));
}

/** Games per script family, for the script cards' win rate pill. */
export function getScriptFamilyPlayCounts(games: Game[], scripts: StoredScript[]) {
  const counts = new Map<string, number>();

  for (const game of games) {
    const familyId = getGameFamilyId(game, scripts, games);
    if (familyId) counts.set(familyId, (counts.get(familyId) ?? 0) + 1);
  }

  return counts;
}

export function getScriptPlayCounts(games: Game[]) {
  const gamesPlayedByScript = new Map<string, number>();

  for (const game of games) {
    const scriptId = game.scriptId ?? game.script?.id;

    if (scriptId) {
      gamesPlayedByScript.set(scriptId, (gamesPlayedByScript.get(scriptId) ?? 0) + 1);
    }
  }

  return gamesPlayedByScript;
}

export type ScriptWinRecord = { losses: number; wins: number };

/**
 * Your wins and losses per script family (see `getScriptFamilyId`), from games with a result where
 * you played (not storytold).
 */
export function getScriptWinRecords(games: Game[], scripts: StoredScript[] = []) {
  const records = new Map<string, ScriptWinRecord>();

  for (const game of games) {
    const scriptId = getGameFamilyId(game, scripts, games);
    if (!scriptId || !isDecidedResult(game.result)) continue;
    const appUser = game.players.find((player) => player.id === APP_USER_ID);
    if (appUser?.isStoryteller) continue;
    const record = records.get(scriptId) ?? { losses: 0, wins: 0 };
    if (game.result === 'won') record.wins += 1;
    else record.losses += 1;
    records.set(scriptId, record);
  }

  return records;
}

/** Each script's win rate games and your record, which both count its whole family. */
export function getScriptCardWinRates(games: Game[], scripts: StoredScript[]) {
  const familyRecords = getScriptWinRecords(games, scripts);
  const familyPlayCounts = getScriptFamilyPlayCounts(games, scripts);
  const scriptWinRateGames = new Map<string, number>();
  const scriptWinRecords = new Map<string, ScriptWinRecord>();

  for (const script of scripts) {
    const familyId = getScriptFamilyId(script.id, scripts, games);
    const record = familyRecords.get(familyId);
    scriptWinRateGames.set(script.id, familyPlayCounts.get(familyId) ?? 0);
    if (record) scriptWinRecords.set(script.id, record);
  }

  return { scriptWinRateGames, scriptWinRecords };
}

/** "3W 1L (75%)", or nothing when no game on the script has a result. */
export function formatWinRecord(record: ScriptWinRecord | undefined) {
  if (!record) return null;
  const total = record.wins + record.losses;
  if (total === 0) return null;
  return `${record.wins}W ${record.losses}L (${Math.round((record.wins / total) * 100)}%)`;
}

export function sortScriptsByMostPlayed(scripts: StoredScript[], games: Game[]) {
  const gamesPlayedByScript = getScriptPlayCounts(games);
  const sortedScripts = [...scripts].sort((first, second) => {
    const gamesDifference =
      (gamesPlayedByScript.get(second.id) ?? 0) - (gamesPlayedByScript.get(first.id) ?? 0);

    return (
      gamesDifference || first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })
    );
  });

  // New scripts are appended to the list: keep the latest on top until a game uses it,
  // so it can be selected right away.
  const newestScript = scripts.at(-1);
  if (!newestScript || gamesPlayedByScript.has(newestScript.id)) {
    return sortedScripts;
  }

  return [newestScript, ...sortedScripts.filter((script) => script.id !== newestScript.id)];
}

export function getScriptRoleEntries(
  roles: Role[],
  roleCatalog: Role[],
  savedNotes: SavedNote[],
): ScriptRoleEntry[] {
  const catalogById = new Map(roleCatalog.map((role) => [role.id, role]));

  return roles.map((role) => {
    const catalogRole = catalogById.get(role.id);
    const notesByText = new Map<string, string[]>();
    const savedNoteIdsByText = new Map<string, string[]>();

    for (const text of [...(role.notes ?? []), ...(catalogRole?.notes ?? [])]) {
      if (!notesByText.has(text)) {
        notesByText.set(text, []);
      }
    }

    for (const note of savedNotes) {
      if (!note.roleIds.includes(role.id)) {
        continue;
      }

      const playerNames = notesByText.get(note.text) ?? [];
      if (!notesByText.has(note.text)) {
        notesByText.set(note.text, playerNames);
      }
      savedNoteIdsByText.set(note.text, [...(savedNoteIdsByText.get(note.text) ?? []), note.id]);

      const playerName = note.playerName.trim();
      if (
        playerName &&
        !playerNames.some((name) => name.toLocaleLowerCase() === playerName.toLocaleLowerCase())
      ) {
        playerNames.push(playerName);
      }
    }

    const notes = [...notesByText].map(([text, playerNames]) => ({
      playerNames,
      savedNoteIds: savedNoteIdsByText.get(text) ?? [],
      text,
    }));

    return {
      description: role.ability ?? catalogRole?.ability,
      noteCount: notes.length,
      notes,
      role: {
        ...role,
        notes: notes.map(({ text }) => text),
      },
    };
  });
}

/** Trigger-only characters that don't belong on the Other nights order, only on the first night. */
export const NOT_WAKING_AFTER_FIRST_NIGHT = new Set(['grandmother', 'tinker', 'moonchild']);

export function getNightOrderRoleEntries(
  entries: ScriptRoleEntry[],
  nightSheet: NightSheet,
  nightName: keyof NightSheet,
) {
  const nightOrder = new Map<string, number>();

  for (const roleId of nightSheet[nightName]) {
    const normalizedRoleId = normalizeNightSheetRoleId(roleId);
    if (nightName === 'otherNight' && NOT_WAKING_AFTER_FIRST_NIGHT.has(normalizedRoleId)) continue;
    if (!nightOrder.has(normalizedRoleId)) {
      nightOrder.set(normalizedRoleId, nightOrder.size);
    }
  }

  return entries
    .map((entry) => ({ entry, index: nightOrder.get(normalizeNightSheetRoleId(entry.role.id)) }))
    .filter((item): item is { entry: ScriptRoleEntry; index: number } => item.index !== undefined)
    .sort((first, second) => first.index - second.index)
    .map(({ entry }) => entry);
}

function normalizeNightSheetRoleId(roleId: string) {
  return roleId.toLocaleLowerCase().replace(/[^a-z]/g, '');
}
