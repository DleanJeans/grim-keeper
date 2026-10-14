import type { Game, Role, SavedNote, StoredScript } from '@/types/game';

export type ScriptRoleEntry = {
  description?: string;
  noteCount: number;
  notes: ScriptRoleNote[];
  role: Role;
};

export type ScriptRoleNote = {
  playerNames: string[];
  text: string;
};

export type NightSheet = {
  firstNight: string[];
  otherNight: string[];
};

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

export function sortScriptsByMostPlayed(scripts: StoredScript[], games: Game[]) {
  const gamesPlayedByScript = getScriptPlayCounts(games);

  return [...scripts].sort((first, second) => {
    const gamesDifference =
      (gamesPlayedByScript.get(second.id) ?? 0) - (gamesPlayedByScript.get(first.id) ?? 0);

    return (
      gamesDifference || first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })
    );
  });
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

      const playerName = note.playerName.trim();
      if (
        playerName &&
        !playerNames.some((name) => name.toLocaleLowerCase() === playerName.toLocaleLowerCase())
      ) {
        playerNames.push(playerName);
      }
    }

    const notes = [...notesByText].map(([text, playerNames]) => ({ playerNames, text }));

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

export function getNightOrderRoleEntries(
  entries: ScriptRoleEntry[],
  nightSheet: NightSheet,
  nightName: keyof NightSheet,
) {
  const nightOrder = new Map<string, number>();

  for (const roleId of nightSheet[nightName]) {
    const normalizedRoleId = normalizeNightSheetRoleId(roleId);
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
