import { getClaimOrbitLayout } from '@/utils/claim-orbit-utils';

const TOKEN = { borderWidth: 3, textHalfHeight: 13, tokenSize: 90 };

function expectInsideAndClear(
  layout: ReturnType<typeof getClaimOrbitLayout>,
  textHalfHeight = TOKEN.textHalfHeight,
) {
  const innerRadius = TOKEN.tokenSize / 2 - TOKEN.borderWidth;
  for (const [index, position] of layout.positions.entries()) {
    expect(Math.hypot(position.x, position.y) + layout.size / 2).toBeLessThanOrEqual(innerRadius);
    expect(Math.abs(position.y) - layout.size / 2).toBeGreaterThanOrEqual(textHalfHeight);
    for (const other of layout.positions.slice(index + 1)) {
      expect(Math.hypot(other.x - position.x, other.y - position.y)).toBeGreaterThanOrEqual(
        layout.size,
      );
    }
  }
}

describe('getClaimOrbitLayout', () => {
  it('groups claims around the bottom, first on the left', () => {
    const layout = getClaimOrbitLayout({ ...TOKEN, count: 3 });

    expect(layout.positions).toHaveLength(3);
    expect(layout.positions[1].x).toBeCloseTo(0);
    expect(layout.positions[0].x).toBeCloseTo(-layout.positions[2].x);
    expect(layout.positions[0].x).toBeLessThan(0);
    for (const position of layout.positions) {
      expect(position.y).toBeGreaterThan(0);
    }
    expectInsideAndClear(layout);
  });

  it('uses bigger tokens for fewer claims', () => {
    expect(getClaimOrbitLayout({ ...TOKEN, count: 1 }).size).toBe(27);
    expect(getClaimOrbitLayout({ ...TOKEN, count: 3 }).size).toBeLessThan(27);
  });

  it('puts the rest in a group at the top when the bottom is full', () => {
    const layout = getClaimOrbitLayout({ ...TOKEN, count: 6 });

    expect(layout.positions.filter((position) => position.y > 0)).toHaveLength(3);
    expect(layout.positions.filter((position) => position.y < 0)).toHaveLength(3);
    expectInsideAndClear(layout);
  });

  it('shrinks tokens so many claims still fit', () => {
    const six = getClaimOrbitLayout({ ...TOKEN, count: 6 });
    const nine = getClaimOrbitLayout({ ...TOKEN, count: 9 });

    expect(six.positions).toHaveLength(6);
    expect(nine.positions).toHaveLength(9);
    expect(nine.size).toBeLessThan(six.size);
    expectInsideAndClear(nine);
  });

  it('keeps clear of obstacles such as the dead vote badge', () => {
    const badge = { radius: 9, x: 0, y: 36 };
    const layout = getClaimOrbitLayout({ ...TOKEN, count: 2, obstacles: [badge] });

    expect(layout.positions).toHaveLength(2);
    for (const position of layout.positions) {
      expect(Math.hypot(position.x - badge.x, position.y - badge.y)).toBeGreaterThanOrEqual(
        badge.radius + layout.size / 2,
      );
    }
  });

  it('leaves claims out when the token is too small', () => {
    expect(
      getClaimOrbitLayout({ borderWidth: 3, count: 2, textHalfHeight: 13, tokenSize: 40 })
        .positions,
    ).toEqual([]);
    expect(getClaimOrbitLayout({ ...TOKEN, count: 0 }).positions).toEqual([]);
  });
});
