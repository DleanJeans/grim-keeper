import type { Player, Role } from '@/types/game';
import { getActiveTheoryEvilIds, getTheoryLabel, getTheoryWarnings } from '@/utils/theory-utils';

const players = [
  { id: 'ann', name: 'Ann' },
  { id: 'bob', name: 'Bob' },
  { id: 'cat', name: 'Cat' },
] as Player[];

describe('theory utils', () => {
  it('names a theory after its evil players in seat order', () => {
    expect(getTheoryLabel(['cat', 'ann'], players)).toBe('Ann + Cat evil');
    expect(getTheoryLabel([], players)).toBe('Nobody evil yet');
  });

  it('returns the active theory evil players only', () => {
    const theories = [
      { evilPlayerIds: ['ann'], id: 'theory-1' },
      { evilPlayerIds: ['bob'], id: 'theory-2' },
    ];
    expect(getActiveTheoryEvilIds({ activeTheoryId: 'theory-2', theories })).toEqual(['bob']);
    expect(getActiveTheoryEvilIds({ theories })).toEqual([]);
  });

  it('warns about too many evil players and confirmed characters that disagree', () => {
    const roles = [
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ] as Role[];
    const confirm = (roleId: string) => [
      { day: 1, kind: 'confirm' as const, roleIds: [roleId], updatedAt: 'x' },
    ];
    const confirmed = [
      { id: 'ann', name: 'Ann', roleAssignments: confirm('chef') },
      { id: 'bob', name: 'Bob', roleAssignments: confirm('imp') },
      { id: 'cat', name: 'Cat' },
    ] as Player[];

    expect(getTheoryWarnings(['ann', 'cat'], confirmed, roles, 1, 'day', 1)).toEqual([
      '2 marked evil, but the setup has 1 evil player',
      'Ann is confirmed as Chef',
      'Bob is confirmed evil (Imp) but not marked',
    ]);
    expect(getTheoryWarnings(['bob'], confirmed, roles, 1, 'day', 2)).toEqual([]);
  });
});
