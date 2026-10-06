import type { Player, Role, RoleInfoEntry } from '@/types/game';
import {
  getAliveNeighbors,
  getRoleInfoForPhaseOrPrevious,
  getRoleInfoOwners,
  getRoleInfoTemplate,
  getRolesForInfoSlot,
  hasRoleInfo,
  mapRoleInfoPlayerIds,
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
