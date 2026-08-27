import type { Player } from '@/types/game';
import {
  clampMapHeight,
  clampMapWidth,
  clampTokenPosition,
  getDefaultMapHeight,
  getDefaultMapWidth,
  getDefaultTokenSize,
  getLegacyMapHeight,
  getMapScale,
  getNextMapDimension,
  getPlayerMapPosition,
  getTokenSize,
  resolveTokenCollisions,
  scalePlayerMapPositions,
} from '@/utils/layout-utils';

const players: Player[] = Array.from({ length: 8 }, (_, seat) => ({
  id: `player-${seat}`,
  name: `Player ${seat}`,
  seat,
}));

describe('layout utils', () => {
  it('derives stable map dimensions from the initial viewport', () => {
    expect(getDefaultMapWidth(390)).toBe(350);
    expect(getDefaultMapWidth(1920)).toBe(1200);
    expect(getDefaultMapHeight(350, 844)).toBe(440);
    expect(getDefaultMapHeight(350, 1129)).toBe(580);
    expect(getLegacyMapHeight(350, 1129)).toBe(587);
    expect(clampMapHeight(587)).toBe(580);
  });

  it('clamps manually resized map widths to the supported range', () => {
    expect(clampMapWidth(239)).toBe(240);
    expect(clampMapWidth(1201)).toBe(1200);
    expect(clampMapWidth(587)).toBe(587);
  });

  it('snaps dimension changes to the next step in the pressed direction', () => {
    expect(getNextMapDimension(554, -20, 20, clampMapHeight)).toBe(540);
    expect(getNextMapDimension(554, 20, 20, clampMapHeight)).toBe(560);
    expect(getNextMapDimension(560, 20, 20, clampMapHeight)).toBe(580);
  });

  it('scales the logical map to the available width', () => {
    expect(getMapScale(700, 350)).toBe(2);
    expect(getMapScale(175, 350)).toBe(0.5);
  });

  it('sizes new-game tokens from the map perimeter and player count', () => {
    expect(getDefaultTokenSize(20, 400, 300)).toBe(70);
    expect(getDefaultTokenSize(20, 200, 200)).toBe(40);
    expect(getDefaultTokenSize(4, 400, 300)).toBe(100);
  });

  it('clamps token sizes to the supported range', () => {
    expect(getTokenSize(1)).toBe(40);
    expect(getTokenSize(1000)).toBe(100);
  });

  it('scales legacy positions relative to the map edges', () => {
    const positionedPlayers: Player[] = [
      { id: 'left', name: 'left', seat: 0, position: { x: 34, y: 50 } },
      { id: 'right', name: 'right', seat: 1, position: { x: 316, y: 537 } },
      { id: 'new', name: 'new', seat: 2 },
    ];

    const positions = scalePlayerMapPositions(positionedPlayers, 350, 587, 350, 580, 68);

    expect(positions.left.x).toBe(34);
    expect(positions.left.y).toBeCloseTo((50 * 580) / 587);
    expect(positions.right.x).toBe(316);
    expect(positions.right.y).toBeCloseTo((537 * 580) / 587);
    expect(positions.new).toBeUndefined();
  });

  it('scales stored positions when the logical map width changes', () => {
    const positionedPlayers: Player[] = [
      { id: 'center', name: 'center', seat: 0, position: { x: 600, y: 300 } },
    ];

    const positions = scalePlayerMapPositions(positionedPlayers, 1200, 600, 350, 600, 68);

    expect(positions.center.x).toBeCloseTo(175);
    expect(positions.center.y).toBe(300);
  });

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

  it('keeps storytellers centered without changing seated-player positions', () => {
    const storyteller: Player = {
      id: 'storyteller',
      isStoryteller: true,
      name: 'Storyteller',
      seat: -1,
    };
    const mixedPlayers = [...players, storyteller];

    expect(getPlayerMapPosition(storyteller, mixedPlayers, 268, 200)).toEqual({
      x: 134,
      y: 100,
    });
    expect(
      mixedPlayers
        .filter((player) => !player.isStoryteller)
        .map((player) => getPlayerMapPosition(player, mixedPlayers, 268, 200)),
    ).toEqual(players.map((player) => getPlayerMapPosition(player, players, 268, 200)));
  });

  it('keeps the token border inside the map', () => {
    expect(clampTokenPosition({ x: 0, y: 200 }, 200, 200, 68, 3)).toEqual({
      x: 37,
      y: 163,
    });
  });
});

describe('resolveTokenCollisions', () => {
  const mapWidth = 400;
  const mapHeight = 300;
  const tokenSize = 60;

  function makePlayer(id: string, x: number, y: number): Player {
    return { id, name: id, seat: 0, position: { x, y } };
  }

  it('returns no changes when no tokens overlap', () => {
    const a = makePlayer('a', 100, 100);
    const b = makePlayer('b', 220, 100);

    const result = resolveTokenCollisions([a, b], mapWidth, mapHeight, tokenSize);

    expect(result.positions).toEqual({});
  });

  it('pushes an overlapping token away from the anchor', () => {
    // a (anchor) is at (100, 100); b is just inside a's overlap zone at (140, 100).
    // tokenSize = 60, so non-overlap distance is 60. b is 40 away, so overlap is 20.
    const a = makePlayer('a', 100, 100);
    const b = makePlayer('b', 140, 100);

    const result = resolveTokenCollisions([a, b], mapWidth, mapHeight, tokenSize, 'a');

    // b should end up at distance tokenSize from a, along the +x axis.
    expect(result.positions.b).toEqual({ x: 160, y: 100 });
    // anchor is never moved.
    expect(result.positions.a).toBeUndefined();
  });

  it('splits overlap evenly between two non-anchor tokens', () => {
    // a and b are 30 apart, tokenSize = 60, so overlap is 30 → each moves 15.
    const a = makePlayer('a', 100, 100);
    const b = makePlayer('b', 130, 100);

    const result = resolveTokenCollisions([a, b], mapWidth, mapHeight, tokenSize);

    expect(result.positions.a).toEqual({ x: 85, y: 100 });
    expect(result.positions.b).toEqual({ x: 145, y: 100 });
  });

  it('cascades pushes through a chain of touching tokens', () => {
    // Three tokens in a line: a--b--c with b and c just barely not overlapping.
    // If a moves so it overlaps b, b gets pushed into c and c gets pushed
    // out further. The exact final positions are an iterative approximation;
    // we only assert that all overlaps are resolved and the chain pushed in
    // the right direction.
    const overlapping = [
      makePlayer('a', 80, 100), // 40 from b → overlap of 20
      makePlayer('b', 120, 100),
      makePlayer('c', 180, 100),
    ];

    const result = resolveTokenCollisions(overlapping, mapWidth, mapHeight, tokenSize, 'a');

    // Anchor is never moved.
    expect(result.positions.a).toBeUndefined();
    // b ended up pushed out of a's overlap zone.
    expect(result.positions.b).toBeDefined();
    expect(result.positions.b?.x).toBeGreaterThanOrEqual(139);
    // c got pushed further right to make room for b.
    expect(result.positions.c).toBeDefined();
    expect(result.positions.c?.x).toBeGreaterThan(180);
  });

  it('clamps pushed tokens to the map bounds', () => {
    // Anchor is in the corner, target sits to the left of the wall and gets
    // pushed into the wall when the anchor overlaps it.
    const a = makePlayer('a', 30, 30);
    const b = makePlayer('b', 0, 30);

    const result = resolveTokenCollisions([a, b], mapWidth, mapHeight, tokenSize, 'a');

    // b's center can't go below the inset (tokenSize/2 = 30), so it gets
    // pinned there even though a is still overlapping.
    expect(result.positions.b).toBeDefined();
    expect(result.positions.b?.x).toBeGreaterThanOrEqual(30);
  });

  it('skips players without a position so they keep their default placement', () => {
    // Regression: resizing tokens on a fresh game used to teleport every
    // unpositioned player to (0, 0) because the resolver treated "no
    // position" as "overlapping at the origin". Unpositioned players should
    // be left alone so getPlayerMapPosition can place them on the perimeter.
    const a = makePlayer('a', 100, 100);
    const b: Player = { id: 'b', name: 'b', seat: 1 };
    const c: Player = { id: 'c', name: 'c', seat: 2 };
    const d = makePlayer('d', 120, 100);

    const result = resolveTokenCollisions([a, b, c, d], mapWidth, mapHeight, tokenSize);

    expect(result.positions.b).toBeUndefined();
    expect(result.positions.c).toBeUndefined();
  });
});
