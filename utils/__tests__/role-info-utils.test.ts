import type { Player, Role, RoleInfoEntry } from '@/types/game';
import {
  getAliveNeighbors,
  getRoleInfoForPhaseOrPrevious,
  getRoleInfoOwners,
  getRoleInfoTemplate,
  getRolesForInfoSlot,
  hasRoleInfo,
  inferRoleInfosFromNotes,
  mapRoleInfoPlayerIds,
  seedRoleInfos,
  setRoleInfoValue,
} from '@/utils/role-info-utils';

const NOW = '2026-01-01T00:00:00.000Z';

function makePlayer(id: string, seat: number, overrides: Partial<Player> = {}): Player {
  return { id, name: id.toUpperCase(), seat, ...overrides };
}

const roles: Role[] = [
  { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
  { id: 'empath', name: 'Empath', team: 'townsfolk' },
  { id: 'butler', name: 'Butler', team: 'outsider' },
  { id: 'poisoner', name: 'Poisoner', team: 'minion' },
  { id: 'imp', name: 'Imp', team: 'demon' },
  { id: 'gunslinger', name: 'Gunslinger', team: 'traveller' },
];

describe('getRoleInfoTemplate', () => {
  it('gives the Washerwoman a Townsfolk token and two player tokens', () => {
    expect(getRoleInfoTemplate({ id: 'washerwoman' }).slots).toEqual([
      { filter: 'townsfolk', id: '0', kind: 'role', label: 'Townsfolk' },
      { id: '1', kind: 'player', label: 'Player 1' },
      { id: '2', kind: 'player', label: 'Player 2' },
    ]);
  });

  it('filters the Investigator role token to Minions', () => {
    expect(getRoleInfoTemplate({ id: 'investigator' }).slots[0]).toMatchObject({
      filter: 'minion',
      kind: 'role',
    });
  });

  it('gives Chef and Clockmaker a single number token', () => {
    expect(getRoleInfoTemplate({ id: 'chef' }).slots.map((slot) => slot.kind)).toEqual(['number']);
    expect(getRoleInfoTemplate({ id: 'clockmaker' }).slots.map((slot) => slot.kind)).toEqual([
      'number',
    ]);
  });

  it('gives the Empath a number token plus auto neighbors', () => {
    const template = getRoleInfoTemplate({ id: 'empath' });
    expect(template.autoNeighbors).toBe(true);
    expect(template.slots.map((slot) => slot.kind)).toEqual(['number']);
  });

  it('gives the Dreamer a player, a good role and an evil role token', () => {
    expect(getRoleInfoTemplate({ id: 'dreamer' }).slots).toMatchObject([
      { kind: 'player' },
      { filter: 'good', kind: 'role' },
      { filter: 'evil', kind: 'role' },
    ]);
  });

  it('normalizes punctuation in role ids', () => {
    expect(getRoleInfoTemplate({ id: 'fortune_teller' })).toEqual(
      getRoleInfoTemplate({ id: 'fortuneteller' }),
    );
    expect(getRoleInfoTemplate({ id: 'devils_advocate' })).toEqual(
      getRoleInfoTemplate({ id: 'devilsadvocate' }),
    );
  });

  it('hides passive characters and falls back for homebrew characters', () => {
    expect(hasRoleInfo({ id: 'soldier' })).toBe(false);
    expect(hasRoleInfo({ id: 'tealady' })).toBe(true);
    expect(getRoleInfoTemplate({ id: 'custom_role' }).slots.map((slot) => slot.kind)).toEqual([
      'player',
      'text',
    ]);
  });
});

describe('getRolesForInfoSlot', () => {
  it('filters by team and alignment', () => {
    expect(getRolesForInfoSlot(roles, 'townsfolk').map((role) => role.id)).toEqual([
      'washerwoman',
      'empath',
    ]);
    expect(getRolesForInfoSlot(roles, 'good').map((role) => role.id)).toEqual([
      'washerwoman',
      'empath',
      'butler',
    ]);
    expect(getRolesForInfoSlot(roles, 'evil').map((role) => role.id)).toEqual(['poisoner', 'imp']);
    expect(getRolesForInfoSlot(roles, 'any')).toHaveLength(5);
  });
});

describe('setRoleInfoValue', () => {
  it('creates an entry for the phase', () => {
    expect(setRoleInfoValue(undefined, 'chef', 1, 'night', '0', '2', NOW)).toEqual([
      { day: 1, phase: 'night', roleId: 'chef', updatedAt: NOW, values: { '0': '2' } },
    ]);
  });

  it('carries earlier values forward into a new phase', () => {
    const night1 = setRoleInfoValue(undefined, 'washerwoman', 1, 'night', '1', 'a', NOW);
    const day1 = setRoleInfoValue(night1, 'washerwoman', 1, 'day', '2', 'b', NOW);

    expect(day1).toHaveLength(2);
    expect(day1[1].values).toEqual({ '1': 'a', '2': 'b' });
    expect(day1[0].values).toEqual({ '1': 'a' });
  });

  it('clears a slot when the value is undefined', () => {
    const entries = setRoleInfoValue(undefined, 'chef', 1, 'night', '0', '2', NOW);
    expect(setRoleInfoValue(entries, 'chef', 1, 'night', '0', undefined, NOW)[0].values).toEqual(
      {},
    );
  });
});

describe('getRoleInfoForPhaseOrPrevious', () => {
  const entries: RoleInfoEntry[] = [
    { day: 1, phase: 'night', roleId: 'empath', updatedAt: NOW, values: { '0': '1' } },
    { day: 2, phase: 'night', roleId: 'empath', updatedAt: NOW, values: { '0': '0' } },
  ];

  it('returns the latest entry at or before the phase', () => {
    expect(getRoleInfoForPhaseOrPrevious(entries, 'empath', 1, 'day')?.values).toEqual({
      '0': '1',
    });
    expect(getRoleInfoForPhaseOrPrevious(entries, 'empath', 3, 'day')?.values).toEqual({
      '0': '0',
    });
    expect(getRoleInfoForPhaseOrPrevious(entries, 'chef', 3, 'day')).toBeUndefined();
  });
});

describe('mapRoleInfoPlayerIds', () => {
  it('only rewrites player slots', () => {
    const entries: RoleInfoEntry[] = [
      {
        day: 1,
        phase: 'night',
        roleId: 'washerwoman',
        updatedAt: NOW,
        values: { '0': 'imp', '1': 'imp', '2': 'b' },
      },
    ];

    expect(
      mapRoleInfoPlayerIds(entries, (id) => (id === 'imp' ? undefined : `${id}!`))?.[0].values,
    ).toEqual({ '0': 'imp', '2': 'b!' });
  });
});

describe('getAliveNeighbors', () => {
  const players = [
    makePlayer('st', 0, { isStoryteller: true }),
    makePlayer('a', 1),
    makePlayer('b', 2, { death: { day: 2, kind: 'night', updatedAt: NOW } }),
    makePlayer('c', 3),
    makePlayer('d', 4),
  ];

  it('skips dead players and the storyteller, wrapping around the circle', () => {
    expect(getAliveNeighbors(players, 'c', 2, 'night').map((player) => player.id)).toEqual([
      'a',
      'd',
    ]);
    expect(getAliveNeighbors(players, 'a', 2, 'night').map((player) => player.id)).toEqual([
      'd',
      'c',
    ]);
  });

  it('counts players as alive before they die', () => {
    expect(getAliveNeighbors(players, 'c', 1, 'night').map((player) => player.id)).toEqual([
      'b',
      'd',
    ]);
  });
});

describe('getRoleInfoOwners', () => {
  it('returns players claiming the role', () => {
    const players = [
      makePlayer('a', 0, {
        roleAssignments: [
          { day: 1, kind: 'claim', phase: 'day', roleIds: ['empath'], updatedAt: NOW },
        ],
      }),
      makePlayer('b', 1),
    ];

    expect(getRoleInfoOwners(players, 'empath', 2, 'night', roles).map((p) => p.id)).toEqual(['a']);
  });
});

describe('inferRoleInfosFromNotes', () => {
  const tbRoles: Role[] = [
    { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
    { id: 'investigator', name: 'Investigator', team: 'townsfolk' },
    { id: 'empath', name: 'Empath', team: 'townsfolk' },
    { id: 'chef', name: 'Chef', team: 'townsfolk' },
    { id: 'fortuneteller', name: 'Fortune Teller', team: 'townsfolk' },
    { id: 'dreamer', name: 'Dreamer', team: 'townsfolk' },
    { id: 'saint', name: 'Saint', team: 'outsider' },
    { id: 'poisoner', name: 'Poisoner', team: 'minion' },
    { id: 'scarletwoman', name: 'Scarlet Woman', team: 'minion' },
    { id: 'imp', name: 'Imp', team: 'demon' },
  ];
  const players = [
    makePlayer('ann', 0, { name: 'Ann' }),
    makePlayer('ben', 1, { name: 'Ben' }),
    makePlayer('cat', 2, { name: 'Cat' }),
    makePlayer('dan', 3, { name: 'Dan' }),
  ];

  function claim(player: Player, roleId: string): Player {
    return {
      ...player,
      roleAssignments: [{ day: 1, kind: 'claim', roleIds: [roleId], updatedAt: NOW }],
    };
  }

  function note(playerId: string, text: string, day = 1, phase?: 'day' | 'night') {
    return {
      day,
      notes: [{ createdAt: NOW, id: `${playerId}-${day}`, text, updatedAt: NOW }],
      phase,
      playerId,
      updatedAt: NOW,
    };
  }

  function infer(
    claims: [string, string][],
    notes: ReturnType<typeof note>[],
    stored?: RoleInfoEntry[],
  ) {
    const claimed = players.map((player) => {
      const roleId = claims.find(([playerId]) => playerId === player.id)?.[1];
      return roleId ? claim(player, roleId) : player;
    });
    return inferRoleInfosFromNotes(claimed, notes, stored, tbRoles);
  }

  it('reads a Washerwoman character and two players', () => {
    expect(infer([['ann', 'washerwoman']], [note('ann', 'ben or dan is the empath')])).toEqual([
      {
        day: 1,
        phase: 'day',
        roleId: 'washerwoman',
        updatedAt: NOW,
        values: { '0': 'empath', '1': 'ben', '2': 'dan' },
      },
    ]);
  });

  it('reads multi-word characters and skips roles outside the slot filter', () => {
    const [entry] = infer(
      [['ben', 'investigator']],
      [note('ben', 'Saint? no: Scarlet Woman is Cat or Ann', 2, 'night')],
    );
    expect(entry).toMatchObject({
      day: 2,
      phase: 'night',
      values: { '0': 'scarletwoman', '1': 'cat', '2': 'ann' },
    });
  });

  it('reads Empath and Chef numbers from digits and words', () => {
    const entries = infer(
      [
        ['cat', 'empath'],
        ['dan', 'chef'],
      ],
      [note('cat', 'got a 1'), note('dan', 'zero pairs')],
    );
    expect(entries.map(({ roleId, values }) => [roleId, values])).toEqual([
      ['empath', { '0': '1' }],
      ['chef', { '0': '0' }],
    ]);
  });

  it('reads a Dreamer player with one good and one evil character', () => {
    const [entry] = infer([['dan', 'dreamer']], [note('dan', 'dreamt of Ann: Imp or Chef')]);
    expect(entry.values).toEqual({ '0': 'ann', '1': 'chef', '2': 'imp' });
  });

  it('reads Fortune Teller players and a yes/no answer', () => {
    const [entry] = infer([['ann', 'fortuneteller']], [note('ann', 'Ben + Cat: yes')]);
    expect(entry.values).toEqual({ '0': 'ben', '1': 'cat', '2': 'Yes' });
  });

  it('ignores partial words, unclaimed roles and roles that already have stored info', () => {
    expect(infer([['ann', 'empath']], [note('ann', 'benign, nothing useful')])).toEqual([]);
    expect(infer([], [note('ann', 'got a 1')])).toEqual([]);
    expect(
      infer(
        [['ann', 'empath']],
        [note('ann', 'got a 1')],
        [{ day: 1, phase: 'day', roleId: 'empath', updatedAt: NOW, values: {} }],
      ),
    ).toEqual([]);
  });
});

describe('seedRoleInfos', () => {
  const seed: RoleInfoEntry = {
    day: 1,
    phase: 'day',
    roleId: 'empath',
    updatedAt: NOW,
    values: { '0': '1' },
  };

  it('adds the role seeds only when the role has no stored entries', () => {
    expect(seedRoleInfos(undefined, 'empath', [seed])).toEqual([seed]);
    expect(seedRoleInfos(undefined, 'chef', [seed])).toBeUndefined();
    const stored = [{ ...seed, values: { '0': '2' } }];
    expect(seedRoleInfos(stored, 'empath', [seed])).toBe(stored);
  });
});
