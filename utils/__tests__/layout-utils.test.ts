import type { Player } from '@/types/game';
import { clampTokenPosition, getPlayerMapPosition } from '@/utils/layout-utils';

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

  it('keeps the token border inside the map', () => {
    expect(clampTokenPosition({ x: 0, y: 200 }, 200, 200, 68, 3)).toEqual({
      x: 37,
      y: 163,
    });
  });
});
