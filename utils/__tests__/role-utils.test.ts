import {
  getRoleAssignmentForDay,
  getRoleIconUrl,
  getRoleNames,
  getRolesForDay,
  getRolesForDayOrPrevious,
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

  it('formats unknown role ids for display', () => {
    expect(getRoleNames(['custom_role'], [])).toEqual(['Custom Role']);
  });

  it('identifies traveler characters from the role catalog', () => {
    expect(isTravelerRole({ id: 'village_idiot', name: 'Village Idiot', team: 'traveller' })).toBe(
      true,
    );
    expect(isTravelerRole({ id: 'imp', name: 'Imp', team: 'demon' })).toBe(false);
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
});
