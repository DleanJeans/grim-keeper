import {
  canRoleKill,
  GENERIC_CHARACTER_TYPE_ROLE_REFERENCES,
  GENERIC_CHARACTER_TYPE_ROLES,
  getAssignedRoleIdsForDay,
  getAssignedRoleIdsForDayOrPrevious,
  getEffectiveRoleForPlayer,
  getKillerRoleOptions,
  getLatestRumorMapDisplaysForDayOrPrevious,
  getPlayerRoleBucket,
  getRoleAssignmentForDay,
  getRoleDisplayForDayOrPrevious,
  getRoleDisplayForMode,
  getRoleIconUrl,
  getRoleIconUrlForAlignment,
  getRoleNames,
  getRoleOwnerNamesForDay,
  getRolesForDay,
  getRolesForDayOrPrevious,
  getRolesWithKillAbility,
  getRumorAboutPlayerForDay,
  getTravelerClaimRoles,
  isFlowerGirlRole,
  isTravelerRole,
  mergeRoleCatalogMetadata,
  mergeScriptRoles,
  parseRoleIconCatalog,
} from '@/utils/role-utils';

describe('role utilities', () => {
  it('lets confirmed roles override every map display mode', () => {
    const roles = [
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'imp', name: 'Imp', team: 'demon' },
      { id: 'soldier', name: 'Soldier', team: 'townsfolk' },
    ];
    const player = {
      id: 'subject',
      name: 'Subject',
      seat: 0,
      roleAssignments: [
        {
          day: 1,
          kind: 'claim' as const,
          roleIds: ['empath'],
          updatedAt: '2026-07-14T00:00:00.000Z',
        },
        {
          day: 1,
          kind: 'guess' as const,
          roleIds: ['soldier'],
          updatedAt: '2026-07-14T00:01:00.000Z',
        },
        {
          day: 1,
          kind: 'confirm' as const,
          roleIds: ['imp'],
          updatedAt: '2026-07-14T00:02:00.000Z',
        },
      ],
    };
    const rumorSource = {
      id: 'source',
      name: 'Source',
      seat: 1,
      roleAssignments: [
        {
          day: 1,
          kind: 'rumor' as const,
          roleIds: ['empath'],
          subjectPlayerId: 'subject',
          updatedAt: '2026-07-14T00:03:00.000Z',
        },
      ],
    };

    for (const mode of ['claim', 'confirm', 'guess', 'rumor'] as const) {
      expect(getRoleDisplayForMode(player, [player, rumorSource], 1, roles, mode)).toMatchObject({
        kind: 'confirm',
        roleIds: ['imp'],
      });
    }
  });

  it('uses the newest rumor per subject for map display', () => {
    const source = {
      id: 'source',
      name: 'Source',
      seat: 0,
      roleAssignments: [
        {
          day: 1,
          kind: 'rumor' as const,
          roleIds: ['empath'],
          subjectPlayerId: 'subject',
          updatedAt: '2026-07-14T00:00:00.000Z',
        },
      ],
    };
    const newerSource = {
      id: 'newer-source',
      name: 'Newer Source',
      seat: 1,
      roleAssignments: [
        {
          day: 2,
          kind: 'rumor' as const,
          roleIds: ['imp'],
          subjectPlayerId: 'subject',
          updatedAt: '2026-07-14T00:01:00.000Z',
        },
      ],
    };
    const subject = { id: 'subject', name: 'Subject', seat: 2 };
    const roles = [
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];

    expect(
      getLatestRumorMapDisplaysForDayOrPrevious([source, newerSource, subject], 2, roles),
    ).toEqual([
      {
        assignment: newerSource.roleAssignments?.[0],
        roles: [roles[1]],
        sourcePlayer: newerSource,
        subjectPlayer: subject,
      },
    ]);
  });

  it('provides generic character type role references with lowercase icon URLs', () => {
    expect(GENERIC_CHARACTER_TYPE_ROLES.map(({ imageUrl, name }) => ({ imageUrl, name }))).toEqual(
      ['Demon', 'Evil', 'Good', 'Minion', 'Outsider', 'Townsfolk', 'Traveller'].map((name) => ({
        imageUrl: `https://release.botc.app/resources/characters/generic/${name.toLowerCase()}.webp`,
        name,
      })),
    );
    expect(GENERIC_CHARACTER_TYPE_ROLE_REFERENCES.map(({ name }) => name)).toEqual([
      'Demon',
      'Demons',
      'Evil',
      'Evils',
      'Good',
      'Goods',
      'Minion',
      'Minions',
      'Outsider',
      'Outsiders',
      'Townsfolk',
      'Townsfolks',
      'Traveller',
      'Travellers',
      'Traveler',
      'Travelers',
    ]);
    expect(
      GENERIC_CHARACTER_TYPE_ROLE_REFERENCES.filter(({ name }) => name.startsWith('Traveler')).map(
        ({ imageUrl }) => imageUrl,
      ),
    ).toEqual([
      'https://release.botc.app/resources/characters/generic/traveller.webp',
      'https://release.botc.app/resources/characters/generic/traveller.webp',
    ]);
  });

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

  it('uses official role metadata when an imported role is missing edition data', () => {
    expect(getRoleIconUrl({ id: 'fanggu', name: 'Fang Gu' })).toBe(
      'https://release.botc.app/resources/characters/snv/fanggu_e.webp',
    );
    expect(getRoleIconUrl({ id: 'gunslinger', name: 'Gunslinger' })).toBe(
      'https://release.botc.app/resources/characters/tb/gunslinger.webp',
    );
  });

  it('uses custom role image URLs instead of generated role paths', () => {
    const [townsfolk] = mergeScriptRoles(
      [
        {
          id: 'custom_townsfolk',
          image: ['https://example.com/townsfolk.webp', 'https://example.com/evil.webp'],
          name: 'Custom Townsfolk',
          team: 'townsfolk',
        },
      ],
      [],
    );
    const [minion] = mergeScriptRoles(
      [
        {
          id: 'custom_minion',
          image: ['https://example.com/minion.webp', 'https://example.com/good.webp'],
          name: 'Custom Minion',
          team: 'minion',
        },
      ],
      [],
    );

    expect(getRoleIconUrl(townsfolk)).toBe('https://example.com/townsfolk.webp');
    expect(getRoleIconUrl(minion)).toBe('https://example.com/good.webp');
  });

  it('uses official icon paths when a role is in the official catalog', () => {
    const [officialRole] = mergeScriptRoles(
      [
        {
          id: 'imp',
          image: ['https://example.com/custom-imp.webp', 'https://example.com/custom-imp-e.webp'],
          name: 'Imp',
        },
      ],
      [{ edition: 'tb', id: 'imp', name: 'Imp', team: 'demon' }],
    );

    expect(getRoleIconUrl(officialRole)).toBe(
      'https://release.botc.app/resources/characters/tb/imp_e.webp',
    );
  });

  it('fills missing official role metadata from the catalog', () => {
    const [role] = mergeRoleCatalogMetadata(
      [{ id: 'fanggu', name: 'Fang Gu', team: 'demon' }],
      [
        {
          edition: 'snv',
          id: 'fanggu',
          imageUrl: 'https://release.botc.app/resources/characters/snv/fanggu_g.webp',
          name: 'Fang Gu',
          team: 'demon',
        },
      ],
    );

    expect(role.edition).toBe('snv');
    expect(getRoleIconUrl(role)).toBe(
      'https://release.botc.app/resources/characters/snv/fanggu_g.webp',
    );
  });

  it('builds role metadata from the resources icon index', () => {
    const [role] = parseRoleIconCatalog(
      '<a href="/resources/characters/snv/fanggu_g.webp"></a>' +
        '<a href="/resources/characters/snv/fanggu_e.webp"></a>',
    );

    expect(role).toMatchObject({
      edition: 'snv',
      id: 'fanggu',
      imageUrls: [
        'https://release.botc.app/resources/characters/snv/fanggu_g.webp',
        'https://release.botc.app/resources/characters/snv/fanggu_e.webp',
      ],
    });
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

  it('uses custom traveler image URLs for good and evil claims', () => {
    const [traveler] = mergeScriptRoles(
      [
        {
          id: 'custom_traveler',
          image: [
            'https://example.com/traveler.webp',
            'https://example.com/traveler-good.webp',
            'https://example.com/traveler-evil.webp',
          ],
          name: 'Custom Traveler',
          team: 'traveller',
        },
      ],
      [],
    );
    const [good, evil] = getTravelerClaimRoles(traveler);

    expect(getRoleIconUrl(good)).toBe('https://example.com/traveler-good.webp');
    expect(getRoleIconUrl(evil)).toBe('https://example.com/traveler-evil.webp');
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

  it('resolves generic roles when mirroring a rumor on its subject', () => {
    const source = {
      id: 'source',
      name: 'Alice',
      roleAssignments: [
        {
          day: 1,
          kind: 'rumor' as const,
          roleIds: ['generic_evil'],
          subjectPlayerId: 'subject',
          updatedAt: '2026-07-19T00:00:00.000Z',
        },
      ],
      seat: 0,
    };
    const subject = { id: 'subject', name: 'Stefan', seat: 1 };

    expect(getRumorAboutPlayerForDay([source, subject], subject.id, 1, [])[0].roles).toEqual([
      expect.objectContaining({ id: 'generic_evil', name: 'Evil' }),
    ]);
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
        ability:
          'Each night*, choose 2 players: they die. A dead player you chose last night might be regurgitated.',
        id: 'shabaloth',
        name: 'Shabaloth',
      }),
    ).toBe(true);
    expect(
      canRoleKill({
        ability:
          'Each nominee chooses a player: until voting, only they may speak & they are mad the nominee is good or they might die.',
        id: 'bigwig',
        name: 'Big Wig',
        team: 'loric',
      }),
    ).toBe(true);
    expect(
      canRoleKill({
        ability:
          'Each night, choose a player & a good character: they are "mad" they are this character tomorrow, or might be executed.',
        id: 'cerenovus',
        name: 'Cerenovus',
      }),
    ).toBe(true);
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

    expect(roles.map((role) => role.id)).toEqual(['generic_unknown', 'generic_demon', 'imp']);
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
      'generic_unknown',
      'generic_evil',
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

  it('falls back to the claimed role after the confirmed role is cleared', () => {
    expect(
      getRoleDisplayForDayOrPrevious(
        [
          { day: 1, kind: 'claim', roleIds: ['empath'], updatedAt: '2026-07-14T00:00:00.000Z' },
          { day: 1, kind: 'confirm', roleIds: [], updatedAt: '2026-07-14T00:02:00.000Z' },
        ],
        1,
        [
          { id: 'empath', name: 'Empath', team: 'townsfolk' },
          { id: 'imp', name: 'Imp', team: 'demon' },
        ],
      ),
    ).toEqual({
      kind: 'claim',
      roleIds: ['empath'],
      roles: [{ id: 'empath', name: 'Empath', team: 'townsfolk' }],
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

  it('returns the confirmed role for a player when both claim and confirm exist', () => {
    const player = {
      id: 'app-user',
      name: 'Alice',
      seat: 0,
      roleAssignments: [
        {
          day: 1,
          kind: 'claim' as const,
          roleIds: ['empath'],
          updatedAt: '2026-07-14T00:00:00.000Z',
        },
        {
          day: 1,
          kind: 'confirm' as const,
          roleIds: ['imp'],
          updatedAt: '2026-07-14T00:01:00.000Z',
        },
      ],
    };
    const roles = [
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];

    expect(getEffectiveRoleForPlayer(player, roles, 1)).toEqual({
      role: { id: 'imp', name: 'Imp', team: 'demon' },
      kind: 'confirm',
    });
  });

  it('falls back to the claimed role when no confirmation exists', () => {
    const player = {
      id: 'p1',
      name: 'Alice',
      seat: 0,
      roleAssignments: [
        {
          day: 1,
          kind: 'claim' as const,
          roleIds: ['empath'],
          updatedAt: '2026-07-14T00:00:00.000Z',
        },
      ],
    };

    expect(
      getEffectiveRoleForPlayer(player, [{ id: 'empath', name: 'Empath', team: 'townsfolk' }], 1),
    ).toEqual({
      role: { id: 'empath', name: 'Empath', team: 'townsfolk' },
      kind: 'claim',
    });
  });

  it('returns null when the player has no claim and no confirm', () => {
    expect(getEffectiveRoleForPlayer({ id: 'p1', name: 'Alice', seat: 0 }, [], 1)).toEqual({
      role: null,
      kind: null,
    });
  });

  it('ignores role assignments that occur after the active day', () => {
    const player = {
      id: 'p1',
      name: 'Alice',
      seat: 0,
      roleAssignments: [
        { day: 3, kind: 'claim' as const, roleIds: ['imp'], updatedAt: '2026-07-14T00:00:00.000Z' },
      ],
    };

    expect(
      getEffectiveRoleForPlayer(player, [{ id: 'imp', name: 'Imp', team: 'demon' }], 1),
    ).toEqual({ role: null, kind: null });
  });

  it('buckets the app user first then townsfolk, outsiders, minions, demons, and unknown', () => {
    const roles = [
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'drunk', name: 'Drunk', team: 'outsider' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];
    const appUser = {
      id: 'app-user',
      name: 'App',
      seat: 0,
      roleAssignments: [
        {
          day: 1,
          kind: 'claim' as const,
          roleIds: ['empath'],
          updatedAt: '2026-07-14T00:00:00.000Z',
        },
      ],
    };
    const townsfolk = {
      id: 'town',
      name: 'Town',
      seat: 1,
      roleAssignments: [
        {
          day: 1,
          kind: 'claim' as const,
          roleIds: ['empath'],
          updatedAt: '2026-07-14T00:00:00.000Z',
        },
      ],
    };
    const outsider = {
      id: 'out',
      name: 'Out',
      seat: 2,
      roleAssignments: [
        {
          day: 1,
          kind: 'claim' as const,
          roleIds: ['drunk'],
          updatedAt: '2026-07-14T00:00:00.000Z',
        },
      ],
    };
    const minion = {
      id: 'mini',
      name: 'Mini',
      seat: 3,
      roleAssignments: [
        {
          day: 1,
          kind: 'claim' as const,
          roleIds: ['poisoner'],
          updatedAt: '2026-07-14T00:00:00.000Z',
        },
      ],
    };
    const demon = {
      id: 'dem',
      name: 'Dem',
      seat: 4,
      roleAssignments: [
        { day: 1, kind: 'claim' as const, roleIds: ['imp'], updatedAt: '2026-07-14T00:00:00.000Z' },
      ],
    };
    const unknown = { id: 'unk', name: 'Unk', seat: 5 };

    expect(getPlayerRoleBucket(appUser, roles, 1)).toBe(0);
    expect(getPlayerRoleBucket(townsfolk, roles, 1)).toBe(1);
    expect(getPlayerRoleBucket(outsider, roles, 1)).toBe(2);
    expect(getPlayerRoleBucket(minion, roles, 1)).toBe(3);
    expect(getPlayerRoleBucket(demon, roles, 1)).toBe(4);
    expect(getPlayerRoleBucket(unknown, roles, 1)).toBe(5);
  });

  it('sorts a mixed player list by app user, alignment bucket, then seat', () => {
    const roles = [
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'drunk', name: 'Drunk', team: 'outsider' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];
    const claim = (roleId: string, day = 1) => ({
      day,
      kind: 'claim' as const,
      roleIds: [roleId],
      updatedAt: '2026-07-14T00:00:00.000Z',
    });
    const players = [
      { id: 'p2', name: 'Townsfolk-B', seat: 4, roleAssignments: [claim('empath')] },
      { id: 'app-user', name: 'App', seat: 0, roleAssignments: [claim('empath')] },
      { id: 'p3', name: 'Demon', seat: 6, roleAssignments: [claim('imp')] },
      { id: 'p4', name: 'Townsfolk-A', seat: 2, roleAssignments: [claim('empath')] },
      { id: 'p5', name: 'Outsider', seat: 3, roleAssignments: [claim('drunk')] },
      { id: 'p6', name: 'Minion', seat: 5, roleAssignments: [claim('poisoner')] },
      { id: 'p7', name: 'Unknown', seat: 1 },
    ];

    const sorted = [...players].sort(
      (first, second) =>
        getPlayerRoleBucket(first, roles, 1) - getPlayerRoleBucket(second, roles, 1) ||
        first.seat - second.seat,
    );

    expect(sorted.map((player) => player.id)).toEqual([
      'app-user', // app user
      'p4', // townsfolk, seat 2
      'p2', // townsfolk, seat 4
      'p5', // outsider, seat 3
      'p6', // minion, seat 5
      'p3', // demon, seat 6
      'p7', // unknown, seat 1
    ]);
  });
});
