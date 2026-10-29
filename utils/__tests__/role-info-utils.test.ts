import type { Player, Role, RoleInfoEntry } from '@/types/game';
import {
  getAliveNeighbors,
  getDailyRoleInfo,
  getExecutedPlayer,
  getMentionedRoleIds,
  getNominationPlayers,
  getRoleInfoDays,
  getRoleInfoForPhaseOrPrevious,
  getRoleInfoNights,
  getRoleInfoOwners,
  getRoleInfoTargetPlayers,
  getRoleInfoTemplate,
  getRoleInfoUsedPhase,
  getRolesForInfoSlot,
  hasRoleInfo,
  inferNightKills,
  inferRoleInfos,
  inferRoleInfosFromNotes,
  inferVirginNominations,
  isPlayerChoosableForSlot,
  isRoleInfoOver,
  isRoleInfoShownInPhase,
  mapRoleInfoPlayerIds,
  ROLE_INFO_TRUE_KEY,
  seedRoleInfos,
  setDailyRoleInfoValues,
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

  it('starts a new phase empty when not carrying forward', () => {
    const entries = setRoleInfoValue(undefined, 'empath', 1, 'night', '0', '1', NOW);
    const next = setRoleInfoValue(entries, 'empath', 2, 'night', 'x', undefined, NOW, false);
    expect(next[1].values).toEqual({});
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

  it('fills a day note into that day and the night before', () => {
    const values = { '0': 'empath', '1': 'ben', '2': 'dan' };
    expect(infer([['ann', 'washerwoman']], [note('ann', 'ben or dan is the empath')])).toEqual([
      { day: 1, phase: 'night', roleId: 'washerwoman', updatedAt: NOW, values },
      { day: 1, phase: 'day', roleId: 'washerwoman', updatedAt: NOW, values },
    ]);
  });

  it('keeps a night note for its night over the next day note', () => {
    const entries = infer(
      [['cat', 'empath']],
      [note('cat', 'now a 2', 2, 'day'), note('cat', 'got a 1', 2, 'night')],
    );
    expect(entries.map(({ day, phase, values }) => [day, phase, values['0']])).toEqual([
      [2, 'night', '1'],
      [2, 'day', '2'],
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
    expect(entries.map(({ phase, roleId, values }) => [roleId, phase, values])).toEqual([
      ['empath', 'night', { '0': '1' }],
      ['empath', 'day', { '0': '1' }],
      ['chef', 'night', { '0': '0' }],
      ['chef', 'day', { '0': '0' }],
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

describe('inferNightKills', () => {
  const demonRoles: Role[] = [
    { id: 'imp', name: 'Imp', team: 'demon' },
    { id: 'po', name: 'Po', team: 'demon' },
    { id: 'lleech', name: 'Lleech', team: 'demon' },
    { id: 'assassin', name: 'Assassin', team: 'minion' },
  ];

  function died(
    id: string,
    seat: number,
    day: number,
    kind: 'execution' | 'night',
    killerRoleIds?: string[],
  ) {
    return makePlayer(id, seat, { death: { day, kind, killerRoleIds, updatedAt: NOW } });
  }

  it('fills each night with that night deaths and ignores executions', () => {
    const players = [
      died('ann', 0, 1, 'execution'),
      died('ben', 1, 2, 'night'),
      died('cat', 2, 3, 'night'),
    ];
    const imp = inferNightKills(players, [], demonRoles).filter((entry) => entry.roleId === 'imp');
    expect(imp.map(({ day, phase, values }) => [day, phase, values])).toEqual([
      [2, 'night', { '0': 'ben' }],
      [3, 'night', { '0': 'cat' }],
    ]);
  });

  it('fills every kill token of other Demons and keeps their other tokens', () => {
    const players = [died('ann', 0, 2, 'night'), died('ben', 1, 2, 'night')];
    const stored: RoleInfoEntry[] = [
      { day: 1, phase: 'night', roleId: 'lleech', updatedAt: NOW, values: { '0': 'dan' } },
    ];
    const entries = inferNightKills(players, stored, demonRoles);
    expect(entries.find((entry) => entry.roleId === 'po')?.values).toEqual({
      '0': 'ann',
      '1': 'ben',
    });
    expect(entries.find((entry) => entry.roleId === 'lleech')?.values).toEqual({
      '0': 'dan',
      '1': 'ann',
    });
  });

  it('gives credited deaths to their killer only', () => {
    const players = [died('ann', 0, 2, 'night', ['assassin'])];
    expect(inferNightKills(players, [], demonRoles).map((entry) => entry.roleId)).toEqual([
      'assassin',
    ]);
  });

  it('leaves nights with stored kills alone', () => {
    const players = [died('ann', 0, 2, 'night')];
    const stored: RoleInfoEntry[] = [
      { day: 2, phase: 'night', roleId: 'imp', updatedAt: NOW, values: { '0': 'ben' } },
    ];
    expect(
      inferNightKills(players, stored, demonRoles).some((entry) => entry.roleId === 'imp'),
    ).toBe(false);
  });

  it('does not fill kill tokens from notes', () => {
    const players = [
      makePlayer('ann', 0, {
        roleAssignments: [{ day: 1, kind: 'confirm', roleIds: ['imp'], updatedAt: NOW }],
      }),
      makePlayer('ben', 1),
    ];
    const notes = [
      {
        day: 1,
        notes: [{ createdAt: NOW, id: 'n', text: 'BEN executed', updatedAt: NOW }],
        playerId: 'ann',
        updatedAt: NOW,
      },
    ];
    expect(inferRoleInfos(players, notes, undefined, demonRoles)).toEqual([]);
  });
});

describe('inferVirginNominations', () => {
  const virginRoles: Role[] = [{ id: 'virgin', name: 'Virgin', team: 'townsfolk' }];
  const virgin = makePlayer('ann', 0, {
    roleAssignments: [{ day: 1, kind: 'claim', roleIds: ['virgin'], updatedAt: NOW }],
  });

  function nomination(id: string, day: number, initiatorId: string, nomineeId: string) {
    return {
      createdAt: `2026-01-0${day}T00:00:00.000Z`,
      day,
      id,
      initiatorId,
      kind: 'nomination' as const,
      participantIds: [initiatorId, nomineeId],
    };
  }

  it('fills the first nominator of the Virgin and whether they were executed', () => {
    const ben = makePlayer('ben', 1, { death: { day: 2, kind: 'execution', updatedAt: NOW } });
    const cat = makePlayer('cat', 2);
    const entries = inferVirginNominations(
      [virgin, ben, cat],
      [
        nomination('n2', 3, 'cat', 'ann'),
        nomination('n1', 2, 'ben', 'ann'),
        nomination('n0', 1, 'ann', 'cat'),
      ],
      [],
      virginRoles,
    );
    expect(entries.map(({ day, phase, values }) => [day, phase, values])).toEqual([
      [2, 'day', { '0': 'ben', '1': 'Yes' }],
    ]);
  });

  it('says No when the nominator survived the day', () => {
    const [entry] = inferVirginNominations(
      [virgin, makePlayer('ben', 1)],
      [nomination('n1', 1, 'ben', 'ann')],
      [],
      virginRoles,
    );
    expect(entry.values).toEqual({ '0': 'ben', '1': 'No' });
  });
});

describe('getExecutedPlayer', () => {
  it('finds the player executed that day, not night deaths', () => {
    const players = [
      makePlayer('ann', 0, { death: { day: 1, kind: 'night', updatedAt: NOW } }),
      makePlayer('ben', 1, { death: { day: 1, kind: 'execution', updatedAt: NOW } }),
    ];
    expect(getExecutedPlayer(players, 1)?.id).toBe('ben');
    expect(getExecutedPlayer(players, 2)).toBeUndefined();
    expect(getRoleInfoTemplate({ id: 'undertaker' }).autoExecuted).toBe(true);
  });
});

describe('getNominationPlayers', () => {
  const players = [makePlayer('ann', 0), makePlayer('ben', 1), makePlayer('cat', 2)];
  const nomination = (id: string, day: number, initiatorId: string, voterIds?: string[]) => ({
    createdAt: NOW,
    day,
    id,
    initiatorId,
    kind: 'nomination' as const,
    participantIds: [initiatorId, 'ann'],
    voterIds,
  });
  const conversations = [
    nomination('n1', 1, 'cat', ['ben', 'cat']),
    nomination('n2', 1, 'ben', ['cat']),
    nomination('n3', 2, 'ann', ['ann']),
    { createdAt: NOW, day: 1, id: 'i1', initiatorId: 'ann', participantIds: ['ann', 'ben'] },
  ];

  it("lists the day's nominators and voters by seat, once each", () => {
    expect(getNominationPlayers(players, conversations, 1, 'nominators').map((p) => p.id)).toEqual([
      'ben',
      'cat',
    ]);
    expect(getNominationPlayers(players, conversations, 1, 'voters').map((p) => p.id)).toEqual([
      'ben',
      'cat',
    ]);
    expect(getNominationPlayers(players, conversations, 3, 'voters')).toEqual([]);
  });

  it('is shown for the Town Crier and Flowergirl', () => {
    expect(getRoleInfoTemplate({ id: 'towncrier' }).autoDayBefore).toBe('nominators');
    expect(getRoleInfoTemplate({ id: 'flowergirl' }).autoDayBefore).toBe('voters');
  });
});

describe('getRoleInfoTargetPlayers', () => {
  const claim = (roleId: string) => ({
    roleAssignments: [{ day: 1, kind: 'claim' as const, roleIds: [roleId], updatedAt: NOW }],
  });
  const crierRoles: Role[] = [...roles, { id: 'towncrier', name: 'Town Crier', team: 'townsfolk' }];
  const nomination = {
    createdAt: NOW,
    day: 1,
    id: 'n1',
    initiatorId: 'cat',
    kind: 'nomination' as const,
    participantIds: ['cat', 'dan'],
  };

  it("points at the players in the character's info tokens", () => {
    const owner = makePlayer('ann', 0, claim('washerwoman'));
    const players = [owner, makePlayer('ben', 1), makePlayer('cat', 2), makePlayer('dan', 3)];
    const roleInfos: RoleInfoEntry[] = [
      {
        day: 1,
        phase: 'night',
        roleId: 'washerwoman',
        updatedAt: NOW,
        values: { '0': 'empath', '1': 'ben', '2': 'dan' },
      },
    ];

    expect(
      getRoleInfoTargetPlayers(owner, players, [], roleInfos, roles, 2, 'day').map((p) => p.id),
    ).toEqual(['ben', 'dan']);
  });

  it("points a living Town Crier at the previous day's nominators", () => {
    const owner = makePlayer('ann', 0, claim('towncrier'));
    const players = [owner, makePlayer('cat', 2), makePlayer('dan', 3)];
    const targets = (crier: Player) =>
      getRoleInfoTargetPlayers(crier, players, [nomination], [], crierRoles, 2, 'day').map(
        (p) => p.id,
      );

    expect(targets(owner)).toEqual(['cat']);
    expect(targets({ ...owner, death: { day: 1, kind: 'execution', updatedAt: NOW } })).toEqual([]);
  });
});

describe('getRoleInfoUsedPhase', () => {
  it('finds the first phase a once-per-game ability was recorded', () => {
    const entries: RoleInfoEntry[] = [
      { day: 1, phase: 'day', roleId: 'slayer', updatedAt: NOW, values: {} },
      { day: 3, phase: 'day', roleId: 'slayer', updatedAt: NOW, values: { '0': 'ben' } },
      { day: 2, phase: 'day', roleId: 'slayer', updatedAt: NOW, values: { '0': 'cat' } },
      { day: 1, phase: 'night', roleId: 'empath', updatedAt: NOW, values: { '0': '1' } },
    ];
    expect(getRoleInfoUsedPhase({ id: 'slayer' }, entries)?.day).toBe(2);
    expect(getRoleInfoUsedPhase({ id: 'virgin' }, entries)).toBeUndefined();
    expect(getRoleInfoUsedPhase({ id: 'empath' }, entries)).toBeUndefined();
  });
});

describe('getRoleInfoNights', () => {
  it('lists every night up to the day for every-night characters', () => {
    expect(getRoleInfoNights({ id: 'empath' }, 3)).toEqual([1, 2, 3]);
  });

  it('starts other-nights characters on the second night', () => {
    expect(getRoleInfoNights({ id: 'imp' }, 3)).toEqual([2, 3]);
    expect(getRoleInfoNights({ id: 'imp' }, 1)).toEqual([]);
  });

  it('stops once all of the character players have died', () => {
    const empath = makePlayer('ann', 0, { death: { day: 2, kind: 'execution', updatedAt: NOW } });
    expect(getRoleInfoNights({ id: 'empath' }, 4, [empath])).toEqual([1, 2]);
    expect(isRoleInfoOver({ id: 'empath' }, [empath], 2, 'day')).toBe(true);
    expect(isRoleInfoOver({ id: 'empath' }, [empath], 2, 'night')).toBe(false);
    expect(isRoleInfoOver({ id: 'washerwoman' }, [empath], 3, 'night')).toBe(false);
  });

  it('keeps start-knowing, once-only and day characters to a single row', () => {
    expect(getRoleInfoNights({ id: 'washerwoman' }, 3)).toBeUndefined();
    expect(getRoleInfoNights({ id: 'ravenkeeper' }, 3)).toBeUndefined();
    expect(getRoleInfoNights({ id: 'virgin' }, 3)).toBeUndefined();
  });
});

describe('daily role info', () => {
  it('gives the Savant a row per day until all of its players died', () => {
    const savant = makePlayer('ann', 0, { death: { day: 3, kind: 'night', updatedAt: NOW } });
    expect(getRoleInfoDays({ id: 'savant' }, 2)).toEqual([1, 2]);
    expect(getRoleInfoDays({ id: 'savant' }, 4, [savant])).toEqual([1, 2]);
    expect(getRoleInfoDays({ id: 'empath' }, 3)).toBeUndefined();
    expect(isRoleInfoOver({ id: 'savant' }, [savant], 3, 'day')).toBe(true);
  });

  it('shows the Savant from the first day on', () => {
    expect(isRoleInfoShownInPhase({ id: 'savant' }, 1, 'night')).toBe(false);
    expect(isRoleInfoShownInPhase({ id: 'savant' }, 1, 'day')).toBe(true);
    expect(isRoleInfoShownInPhase({ id: 'savant' }, 2, 'night')).toBe(true);
  });

  it('reads a day entry, falling back to one saved during that night', () => {
    const entries: RoleInfoEntry[] = [
      { day: 1, phase: 'night', roleId: 'savant', updatedAt: NOW, values: { '0': 'old' } },
      { day: 2, phase: 'night', roleId: 'savant', updatedAt: NOW, values: { '0': 'night' } },
      { day: 2, phase: 'day', roleId: 'savant', updatedAt: NOW, values: { '0': 'day' } },
    ];
    expect(getDailyRoleInfo(entries, 'savant', 1)?.values['0']).toBe('old');
    expect(getDailyRoleInfo(entries, 'savant', 2)?.values['0']).toBe('day');
    expect(getDailyRoleInfo(entries, 'savant', 3)).toBeUndefined();
  });

  it('replaces the listed days and drops days left empty', () => {
    const entries: RoleInfoEntry[] = [
      { day: 1, phase: 'night', roleId: 'savant', updatedAt: NOW, values: { '0': 'old' } },
      { day: 2, phase: 'day', roleId: 'savant', updatedAt: NOW, values: { '0': 'gone' } },
      { day: 1, phase: 'night', roleId: 'empath', updatedAt: NOW, values: { '0': '1' } },
    ];
    const next = setDailyRoleInfoValues(
      entries,
      'savant',
      new Map<number, Record<string, string>>([
        [1, { '0': 'A', '1': 'B', [ROLE_INFO_TRUE_KEY]: '1' }],
        [2, {}],
      ]),
      'later',
    );
    expect(next).toEqual([
      entries[2],
      {
        day: 1,
        phase: 'day',
        roleId: 'savant',
        updatedAt: 'later',
        values: { '0': 'A', '1': 'B', [ROLE_INFO_TRUE_KEY]: '1' },
      },
    ]);
  });
});

describe('getMentionedRoleIds', () => {
  it('counts claims, confirmations and rumors from any day but not guesses', () => {
    const players = [
      makePlayer('ann', 0, {
        roleAssignments: [
          { day: 4, kind: 'claim', roleIds: ['washerwoman'], updatedAt: NOW },
          { day: 2, kind: 'guess', roleIds: ['imp'], updatedAt: NOW },
          { day: 3, kind: 'rumor', roleIds: ['empath'], subjectPlayerId: 'ben', updatedAt: NOW },
        ],
      }),
    ];
    expect([...getMentionedRoleIds(players)]).toEqual(['washerwoman', 'empath']);
  });
});

describe('isRoleInfoShownInPhase', () => {
  it('shows start-knowing characters only on the first night and day', () => {
    expect(isRoleInfoShownInPhase({ id: 'washerwoman' }, 1)).toBe(true);
    expect(isRoleInfoShownInPhase({ id: 'washerwoman' }, 2)).toBe(false);
  });

  it('shows other-nights characters only after the first night and day', () => {
    expect(isRoleInfoShownInPhase({ id: 'undertaker' }, 1)).toBe(false);
    expect(isRoleInfoShownInPhase({ id: 'undertaker' }, 2)).toBe(true);
  });

  it('shows every-night characters on all phases', () => {
    expect(isRoleInfoShownInPhase({ id: 'empath' }, 1)).toBe(true);
    expect(isRoleInfoShownInPhase({ id: 'empath' }, 3)).toBe(true);
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

  it('adds the role seeds only for phases the role has not stored', () => {
    expect(seedRoleInfos(undefined, 'empath', [seed])).toEqual([seed]);
    expect(seedRoleInfos(undefined, 'chef', [seed])).toBeUndefined();
    const stored = [{ ...seed, values: { '0': '2' } }];
    expect(seedRoleInfos(stored, 'empath', [seed])).toBe(stored);
    const nextNight = { ...seed, day: 2, phase: 'night' as const };
    expect(seedRoleInfos(stored, 'empath', [seed, nextNight])).toEqual([...stored, nextNight]);
  });
});

describe('Alsaahir', () => {
  it('has a player slot per Demon and Minion in play', () => {
    const template = getRoleInfoTemplate({ id: 'alsaahir' }, { demons: 1, minions: 3 });
    expect(template.slots.map((slot) => [slot.id, slot.kind, slot.label])).toEqual([
      ['0', 'player', 'Demon'],
      ['1', 'player', 'Minion'],
      ['2', 'player', 'Minion'],
      ['3', 'player', 'Minion'],
    ]);
  });

  it('maps every guessed player id, beyond the default slots too', () => {
    const entries = mapRoleInfoPlayerIds(
      [
        {
          day: 2,
          phase: 'day',
          roleId: 'alsaahir',
          updatedAt: NOW,
          values: { '0': 'a', '3': 'b' },
        },
      ],
      (id) => `new-${id}`,
    );
    expect(entries?.[0].values).toEqual({ '0': 'new-a', '3': 'new-b' });
  });
});

describe('isPlayerChoosableForSlot', () => {
  const killedNight2 = makePlayer('ann', 1, { death: { day: 2, kind: 'night', updatedAt: NOW } });
  const alive = makePlayer('ben', 2);
  const [impKill] = getRoleInfoTemplate({ id: 'imp' }).slots;
  const [revived] = getRoleInfoTemplate({ id: 'professor' }).slots;
  const [master] = getRoleInfoTemplate({ id: 'butler' }).slots;

  it('keeps a player killed that night choosable for the kill', () => {
    expect(isPlayerChoosableForSlot(killedNight2, impKill, 2, 'night')).toBe(true);
    expect(isPlayerChoosableForSlot(killedNight2, impKill, 3, 'night')).toBe(false);
  });

  it('only allows dead players for dead-only slots', () => {
    expect(isPlayerChoosableForSlot(killedNight2, revived, 3, 'night')).toBe(true);
    expect(isPlayerChoosableForSlot(alive, revived, 3, 'night')).toBe(false);
  });

  it('allows anyone for other player slots', () => {
    expect(isPlayerChoosableForSlot(killedNight2, master, 3, 'night')).toBe(true);
  });
});
