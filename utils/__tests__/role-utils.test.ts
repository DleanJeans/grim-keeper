import {
  canRoleKill,
  getAssignedRoleIdsForDay,
  getAssignedRoleIdsForDayOrPrevious,
  getKillerRoleOptions,
  getRoleAssignmentForDay,
  getRoleDisplayForDayOrPrevious,
  getRoleIconUrl,
  getRoleIconUrlForAlignment,
  getRoleNames,
  getRoleOwnerNamesForDay,
  getRolesForDay,
  getRolesForDayOrPrevious,
  getRolesWithKillAbility,
  getTravelerClaimRoles,
  isFlowerGirlRole,
  isTravelerRole,
  mergeScriptRoles,
} from '@/utils/role-utils';

describe('role utilities', () => {
  it('prefers a confirmed role assignment over a claim on the same day', () => {
    const assignment = getRoleAssignmentForDay(
      [
        { day: 1, kind: 'claim', roleIds: ['empath'], updatedAt: '2026-07-14T00:00:00.000Z' },
        { day: 1, kind: 'confirm', roleIds: ['imp'], updatedAt: '2026-07-14T00:01:00.000Z' },
        { day: 2, kind: 'claim', roleIds: ['soldier'], updatedAt: '2026-07-14T00:02:00.000Z' },
      ],
      1,
    );

    expect(assignment?.roleIds).toEqual(['imp']);
  });

  it('loads only the requested assignment kind for editing', () => {
    const assignments = [
      {
        day: 1,
        kind: 'claim' as const,
        roleIds: ['empath'],
        updatedAt: '2026-07-14T00:00:00.000Z',
      },
      { day: 1, kind: 'confirm' as const, roleIds: ['imp'], updatedAt: '2026-07-14T00:01:00.000Z' },
    ];

    expect(getRoleAssignmentForDay(assignments, 1, 'claim')?.roleIds).toEqual(['empath']);
    expect(getRoleAssignmentForDay(assignments, 1, 'confirm')?.roleIds).toEqual(['imp']);
  });

  it('returns unique role ids from both claims and confirmations', () => {
    expect(
      getAssignedRoleIdsForDay(
        [
          {
            day: 2,
            kind: 'claim',
            roleIds: ['empath', 'drunk'],
            updatedAt: '2026-07-14T00:00:00.000Z',
          },
          {
            day: 2,
            kind: 'confirm',
            roleIds: ['imp', 'drunk'],
            updatedAt: '2026-07-14T00:01:00.000Z',
          },
        ],
        2,
      ),
    ).toEqual(['empath', 'drunk', 'imp']);
  });

  it('carries the latest claim and confirmation forward independently', () => {
    expect(
      getAssignedRoleIdsForDayOrPrevious(
        [
          {
            day: 1,
            kind: 'claim',
            roleIds: ['empath'],
            updatedAt: '2026-07-14T00:00:00.000Z',
          },
          {
            day: 2,
            kind: 'confirm',
            roleIds: ['imp'],
            updatedAt: '2026-07-14T00:01:00.000Z',
          },
        ],
        3,
      ),
    ).toEqual(['empath', 'imp']);
  });

  it('keeps an empty confirmation as an override', () => {
    const assignment = getRoleAssignmentForDay(
      [
        { day: 1, kind: 'claim', roleIds: ['empath'], updatedAt: '2026-07-14T00:00:00.000Z' },
        { day: 1, kind: 'confirm', roleIds: [], updatedAt: '2026-07-14T00:01:00.000Z' },
      ],
      1,
    );

    expect(assignment?.roleIds).toEqual([]);
  });

  it('builds official role icon paths from edition and alignment', () => {
    expect(getRoleIconUrl({ id: 'empath', name: 'Empath', team: 'townsfolk', edition: 'tb' })).toBe(
      'https://release.botc.app/resources/characters/tb/empath_g.webp',
    );
    expect(
      getRoleIconUrl({ id: 'imp', name: 'Imp', team: 'demon', edition: 'trouble brewing' }),
    ).toBe('https://release.botc.app/resources/characters/tb/imp_e.webp');
  });

  it('builds aligned traveler claim role variants', () => {
    const traveler = { edition: 'carousel', id: 'baron', name: 'Baron', team: 'traveller' };
    const [good, evil] = getTravelerClaimRoles(traveler);

    expect(getRoleIconUrlForAlignment(traveler, 'g')).toBe(
      'https://release.botc.app/resources/characters/carousel/baron_g.webp',
    );
    expect(good).toMatchObject({
      id: 'baron_good',
      imageUrl: 'https://release.botc.app/resources/characters/carousel/baron_g.webp',
      name: 'Good Baron',
    });
    expect(evil).toMatchObject({
      id: 'baron_evil',
      imageUrl: 'https://release.botc.app/resources/characters/carousel/baron_e.webp',
      name: 'Evil Baron',
    });
  });

  it('merges script ids with official role metadata and ignores _meta', () => {
    const roles = mergeScriptRoles(
      [
        { id: '_meta', name: 'Script' },
        { id: 'empath' },
        { id: 'custom_role', name: 'Custom Role' },
      ],
      [{ id: 'empath', name: 'Empath', team: 'townsfolk', edition: 'tb' }],
    );

    expect(roles).toEqual([
      { id: 'empath', name: 'Empath', team: 'townsfolk', edition: 'tb' },
      {
        id: 'custom_role',
        name: 'Custom Role',
        team: undefined,
        edition: undefined,
        imageUrl: undefined,
      },
    ]);
  });

  it('keeps role notes when merging script metadata', () => {
    const roles = mergeScriptRoles(
      [{ id: 'empath' }],
      [{ id: 'empath', name: 'Empath', notes: ['Watch their timing.'] }],
    );

    expect(roles[0].notes).toEqual(['Watch their timing.']);
  });

  it('formats unknown role ids for display', () => {
    expect(getRoleNames(['custom_role'], [])).toEqual(['Custom Role']);
  });

  it('identifies traveler characters from the role catalog', () => {
    expect(isTravelerRole({ id: 'village_idiot', name: 'Village Idiot', team: 'traveller' })).toBe(
      true,
    );
    expect(isTravelerRole({ id: 'imp', name: 'Imp', team: 'demon' })).toBe(false);
  });

  it('identifies Flower Girl by its id or display name', () => {
    expect(isFlowerGirlRole({ id: 'flower_girl', name: 'Flower Girl' })).toBe(true);
    expect(isFlowerGirlRole({ id: 'flowergirl', name: 'Custom Name' })).toBe(true);
    expect(isFlowerGirlRole({ id: 'empath', name: 'Empath' })).toBe(false);
  });

  it('identifies roles that can kill another player', () => {
    expect(
      canRoleKill({
        ability: 'Each night*, choose a player: they die.',
        id: 'imp',
        name: 'Imp',
      }),
    ).toBe(true);
    expect(
      canRoleKill({
        ability: 'Each night, choose a statement. If true, a player dies.',
        id: 'gossip',
        name: 'Gossip',
      }),
    ).toBe(true);
    expect(
      canRoleKill({ ability: 'If you guess wrong, you die.', id: 'gambler', name: 'Gambler' }),
    ).toBe(false);
    expect(
      canRoleKill({
        ability: 'You learn if the Demon dies.',
        id: 'undertaker',
        name: 'Undertaker',
      }),
    ).toBe(false);
  });

  it('returns only roles with kill abilities and fills missing abilities from the catalog', () => {
    const scriptRoles = [
      { id: 'imp', name: 'Imp' },
      { id: 'slayer', name: 'Slayer' },
      { id: 'poisoner', name: 'Poisoner' },
      { id: 'undertaker', name: 'Undertaker' },
    ];
    const catalog = [
      {
        ability: 'Each night*, choose a player: they die.',
        id: 'imp',
        name: 'Imp',
        team: 'demon',
        edition: 'tb',
      },
      {
        ability:
          'Once per game, during the day, publicly choose a player: if they are the Demon, they die.',
        id: 'slayer',
        name: 'Slayer',
        team: 'townsfolk',
        edition: 'tb',
      },
      {
        ability: 'Each night, choose a player: they are poisoned tonight and tomorrow day.',
        id: 'poisoner',
        name: 'Poisoner',
        team: 'minion',
        edition: 'tb',
      },
      {
        ability: 'You learn if the Demon dies.',
        id: 'undertaker',
        name: 'Undertaker',
        team: 'townsfolk',
        edition: 'tb',
      },
    ];

    expect(getRolesWithKillAbility(scriptRoles, catalog)).toEqual([catalog[0], catalog[1]]);
  });

  it('hides generic demon and evil options when the script has one matching killer type', () => {
    const roles = getKillerRoleOptions([
      {
        ability: 'Each night*, choose a player: they die.',
        id: 'imp',
        name: 'Imp',
        team: 'demon',
      },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
    ]);

    expect(roles.map((role) => role.id)).toEqual(['generic_unknown', 'imp']);
  });

  it('keeps generic demon when multiple demon types are in the script', () => {
    const roles = getKillerRoleOptions([
      {
        ability: 'Each night*, choose a player: they die.',
        id: 'imp',
        name: 'Imp',
        team: 'demon',
      },
      { id: 'vortox', name: 'Vortox', team: 'demon' },
    ]);

    expect(roles.map((role) => role.id)).toEqual(['generic_demon', 'generic_unknown', 'imp']);
  });

  it('keeps generic evil when multiple evil roles can kill', () => {
    const roles = getKillerRoleOptions([
      {
        ability: 'Each night*, choose a player: they die.',
        id: 'imp',
        name: 'Imp',
        team: 'demon',
      },
      {
        ability: 'Once per game, choose a player: they die.',
        id: 'assassin',
        name: 'Assassin',
        team: 'minion',
      },
    ]);

    expect(roles.map((role) => role.id)).toEqual([
      'generic_evil',
      'generic_unknown',
      'imp',
      'assassin',
    ]);
  });

  it('returns the visible role metadata for a player on a day', () => {
    expect(
      getRolesForDay(
        [{ day: 2, kind: 'confirm', roleIds: ['imp'], updatedAt: '2026-07-14T00:00:00.000Z' }],
        2,
        [{ id: 'imp', name: 'Imp', team: 'demon', edition: 'tb' }],
      ),
    ).toEqual([{ id: 'imp', name: 'Imp', team: 'demon', edition: 'tb' }]);
  });

  it('falls back to the most recent prior role assignment', () => {
    expect(
      getRolesForDayOrPrevious(
        [
          { day: 1, kind: 'claim', roleIds: ['empath'], updatedAt: '2026-07-14T00:00:00.000Z' },
          { day: 2, kind: 'claim', roleIds: ['imp'], updatedAt: '2026-07-14T00:01:00.000Z' },
        ],
        3,
        [
          { id: 'empath', name: 'Empath', team: 'townsfolk' },
          { id: 'imp', name: 'Imp', team: 'demon' },
        ],
      ),
    ).toEqual([{ id: 'imp', name: 'Imp', team: 'demon' }]);
  });

  it('returns only the confirmed roles and their confirmation state', () => {
    expect(
      getRoleDisplayForDayOrPrevious(
        [
          { day: 1, kind: 'claim', roleIds: ['empath'], updatedAt: '2026-07-14T00:00:00.000Z' },
          { day: 1, kind: 'confirm', roleIds: ['imp'], updatedAt: '2026-07-14T00:01:00.000Z' },
        ],
        1,
        [
          { id: 'empath', name: 'Empath', team: 'townsfolk' },
          { id: 'imp', name: 'Imp', team: 'demon' },
        ],
      ),
    ).toEqual({
      kind: 'confirm',
      roleIds: ['imp'],
      roles: [{ id: 'imp', name: 'Imp', team: 'demon' }],
    });
  });

  it('groups effective role owners by day with confirmation priority', () => {
    expect(
      getRoleOwnerNamesForDay(
        [
          {
            id: 'player-2',
            name: 'Bob',
            seat: 1,
            roleAssignments: [
              { day: 1, kind: 'claim', roleIds: ['empath'], updatedAt: '2026-07-14T00:00:00.000Z' },
            ],
          },
          {
            id: 'player-1',
            name: 'Alice',
            seat: 0,
            roleAssignments: [
              { day: 1, kind: 'claim', roleIds: ['empath'], updatedAt: '2026-07-14T00:00:00.000Z' },
              { day: 1, kind: 'confirm', roleIds: ['imp'], updatedAt: '2026-07-14T00:01:00.000Z' },
            ],
          },
        ],
        1,
        [
          { id: 'empath', name: 'Empath', team: 'townsfolk' },
          { id: 'imp', name: 'Imp', team: 'demon' },
        ],
      ),
    ).toEqual({ empath: ['Bob'], imp: ['Alice'] });
  });
});
