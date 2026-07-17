import type { Player } from '@/types/game';
import { getPlayerMapPosition } from '@/utils/layout-utils';

const players: Player[] = Array.from({ length: 8 }, (_, seat) => ({
  id: `player-${seat}`,
  name: `Player ${seat}`,
  seat,
}));

describe('layout utils', () => {
  it('places players clockwise along the map borders with the first player at 6 oclock', () => {
    const positions = players.map((player) => getPlayerMapPosition(player, players, 268, 200));

    expect(positions).toEqual([
      { x: 134, y: 166 },
      { x: 51, y: 166 },
      { x: 34, y: 100 },
      { x: 51, y: 34 },
      { x: 134, y: 34 },
      { x: 217, y: 34 },
      { x: 234, y: 100 },
      { x: 217, y: 166 },
    ]);
  });
});
