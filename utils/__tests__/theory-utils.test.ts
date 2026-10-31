import type { Player } from '@/types/game';
import { getActiveTheoryEvilIds, getTheoryLabel } from '@/utils/theory-utils';

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
});
