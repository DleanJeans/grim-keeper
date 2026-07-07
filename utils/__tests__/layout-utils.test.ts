import type { Player } from '@/types/game';
import { getPlayerMapPosition } from '@/utils/layout-utils';

const players: Player[] = [
  { id: 'first', name: 'First', seat: 0 },
  { id: 'second', name: 'Second', seat: 1 },
];

describe('layout utils', () => {
  it('places the first player at the bottom of the default circle', () => {
    const firstPosition = getPlayerMapPosition(players[0], players, 200, 200);
    const secondPosition = getPlayerMapPosition(players[1], players, 200, 200);

    expect(firstPosition.x).toBeCloseTo(100);
    expect(firstPosition.y).toBeGreaterThan(100);
    expect(secondPosition.x).toBeCloseTo(100);
    expect(secondPosition.y).toBeLessThan(100);
  });
});
