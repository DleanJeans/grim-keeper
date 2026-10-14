import type { Game, Role, SavedNote, StoredScript } from '@/types/game';
import {
  getNightOrderRoleEntries,
  getScriptPlayCounts,
  getScriptRoleEntries,
  sortScriptsByMostPlayed,
} from '@/utils/script-utils';

const scripts: StoredScript[] = [
  createScript('script-z', 'Zulu'),
  createScript('script-a', 'Alpha'),
  createScript('script-b', 'Bravo'),
  createScript('script-unused', 'Unused'),
];
let nextGameId = 0;

describe('script utils', () => {
  it('counts each saved game by its effective script ID', () => {
    const games = [
      createGame({ scriptId: 'script-z' }),
      createGame({ script: scripts[1] }),
      createGame({ scriptId: 'missing-script' }),
      createGame(),
    ];

    expect([...getScriptPlayCounts(games)]).toEqual([
      ['script-z', 1],
      ['script-a', 1],
      ['missing-script', 1],
    ]);
  });

  it('sorts scripts by all saved games, including legacy embedded script IDs', () => {
    const games = [
      createGame({ scriptId: 'script-z' }),
      createGame({ scriptId: 'script-z' }),
      createGame({ script: scripts[1] }),
      createGame({ scriptId: 'script-b' }),
    ];

    expect(sortScriptsByMostPlayed(scripts, games).map((script) => script.name)).toEqual([
      'Zulu',
      'Alpha',
      'Bravo',
      'Unused',
    ]);
  });

  it('ignores games without a script and references to missing scripts', () => {
    const games = [
      createGame(),
      createGame({ scriptId: 'missing-script' }),
      createGame({ scriptId: 'script-a' }),
    ];

    expect(sortScriptsByMostPlayed(scripts, games).map((script) => script.name)).toEqual([
      'Alpha',
      'Bravo',
      'Unused',
      'Zulu',
    ]);
  });

  it('sorts ties alphabetically without mutating the input', () => {
    const originalOrder = [...scripts];
    const sortedScripts = sortScriptsByMostPlayed(scripts, []);

    expect(sortedScripts.map((script) => script.name)).toEqual([
      'Alpha',
      'Bravo',
      'Unused',
      'Zulu',
    ]);
    expect(scripts).toEqual(originalOrder);
  });

  it('merges and deduplicates script, catalog, and saved notes for each role', () => {
    const roles: Role[] = [
      { id: 'empath', name: 'Empath', notes: ['Watch timing.'] },
      { id: 'imp', name: 'Imp' },
    ];
    const catalog: Role[] = [
      {
        ability: 'Learn neighbors.',
        id: 'empath',
        name: 'Empath',
        notes: ['Watch timing.', 'Check claims.'],
      },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];
    const savedNotes: SavedNote[] = [
      createSavedNote('note-1', 'empath', 'Check claims.', 'Alice'),
      createSavedNote('note-2', 'empath', 'Review timing.', 'Ben'),
    ];

    expect(getScriptRoleEntries(roles, catalog, savedNotes)).toEqual([
      {
        description: 'Learn neighbors.',
        noteCount: 3,
        notes: [
          { playerNames: [], text: 'Watch timing.' },
          { playerNames: ['Alice'], text: 'Check claims.' },
          { playerNames: ['Ben'], text: 'Review timing.' },
        ],
        role: {
          ability: undefined,
          id: 'empath',
          name: 'Empath',
          notes: ['Watch timing.', 'Check claims.', 'Review timing.'],
        },
      },
      {
        description: undefined,
        noteCount: 0,
        notes: [],
        role: { id: 'imp', name: 'Imp', notes: [] },
      },
    ]);
  });

  it('lists only the roles that wake on each nightsheet tab, in night order', () => {
    const entries = getScriptRoleEntries(
      [
        { id: 'custom-b', name: 'Custom B' },
        { id: 'imp', name: 'Imp' },
        { id: 'fortune_teller', name: 'Fortune Teller' },
        { id: 'empath', name: 'Empath' },
        { id: 'soldier', name: 'Soldier' },
      ],
      [],
      [],
    );
    const nightSheet = {
      firstNight: ['fortuneteller', 'empath'],
      otherNight: ['imp', 'empath', 'fortuneteller'],
    };

    expect(
      getNightOrderRoleEntries(entries, nightSheet, 'firstNight').map(({ role }) => role.id),
    ).toEqual(['fortune_teller', 'empath']);
    expect(
      getNightOrderRoleEntries(entries, nightSheet, 'otherNight').map(({ role }) => role.id),
    ).toEqual(['imp', 'empath', 'fortune_teller']);
  });

  it('supports filtering the derived entries to roles with notes', () => {
    const entries = getScriptRoleEntries(
      [
        { id: 'empath', name: 'Empath', notes: ['Watch timing.'] },
        { id: 'imp', name: 'Imp' },
      ],
      [],
      [],
    );

    expect(entries.filter(({ noteCount }) => noteCount > 0).map(({ role }) => role.id)).toEqual([
      'empath',
    ]);
  });
});

function createScript(id: string, name: string): StoredScript {
  return {
    id,
    name,
    roles: [],
    updatedAt: '2026-09-09T00:00:00.000Z',
    version: '1.0.0',
  };
}

function createGame(overrides: Partial<Game> = {}): Game {
  return {
    activeDay: 1,
    conversations: [],
    createdAt: '2026-09-09T00:00:00.000Z',
    id: `game-${nextGameId++}`,
    players: [],
    updatedAt: '2026-09-09T00:00:00.000Z',
    ...overrides,
  };
}

function createSavedNote(id: string, roleId: string, text: string, playerName = ''): SavedNote {
  return {
    createdAt: '2026-09-09T00:00:00.000Z',
    day: 1,
    gameId: 'game-1',
    id,
    playerName,
    roleIds: [roleId],
    scriptName: 'Script',
    text,
    updatedAt: '2026-09-09T00:00:00.000Z',
  };
}
