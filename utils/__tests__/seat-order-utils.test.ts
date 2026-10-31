import { isNoOpGap, movePlayerToGap, swapPlayers } from '@/utils/seat-order-utils';

const players = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
const ids = (items: { id: string }[]) => items.map((item) => item.id).join('');

describe('seat order', () => {
  it('moves a player into a gap before or after their seat', () => {
    expect(ids(movePlayerToGap(players, 'c', 0))).toBe('cabd');
    expect(ids(movePlayerToGap(players, 'a', 2))).toBe('bacd');
    expect(ids(movePlayerToGap(players, 'a', 4))).toBe('bcda');
    expect(ids(movePlayerToGap(players, 'd', 1))).toBe('adbc');
  });

  it('leaves the seats alone for the gaps beside the player or unknown players', () => {
    expect(movePlayerToGap(players, 'b', 1)).toBe(players);
    expect(movePlayerToGap(players, 'b', 2)).toBe(players);
    expect(movePlayerToGap(players, 'x', 0)).toBe(players);
    expect(isNoOpGap(players, 'b', 1)).toBe(true);
    expect(isNoOpGap(players, 'b', 2)).toBe(true);
    expect(isNoOpGap(players, 'b', 3)).toBe(false);
  });

  it('swaps two players', () => {
    expect(ids(swapPlayers(players, 'a', 'c'))).toBe('cbad');
    expect(swapPlayers(players, 'a', 'a')).toBe(players);
  });
});
