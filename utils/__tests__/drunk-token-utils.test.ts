import { getDrunkTokenOffset } from '../drunk-token-utils';

const base = { center: { x: 100, y: 100 }, position: { x: 100, y: 0 }, size: 20, tokenSize: 40 };

describe('getDrunkTokenOffset', () => {
  it('points toward the map center, just past the token edge', () => {
    const offset = getDrunkTokenOffset({ ...base, others: [] });
    expect(offset.x).toBeCloseTo(0);
    expect(offset.y).toBeCloseTo(32);
  });

  it('nudges sideways around another token', () => {
    const offset = getDrunkTokenOffset({ ...base, others: [{ size: 40, x: 100, y: 32 }] });
    expect(Math.abs(offset.x)).toBeGreaterThan(5);
    expect(Math.hypot(offset.x, offset.y - 32)).toBeGreaterThan(0);
  });
});
