import type { Player } from '@/types/game';
import {
  clampMapHeight,
  clampMapWidth,
  clampTokenPosition,
  defaultMapHeight,
  defaultMapWidth,
  defaultTokenSize,
  findFreeTokenPosition,
  getDefaultMapHeight,
  getDefaultMapWidth,
  getLegacyMapHeight,
  getMapScale,
  getNextMapDimension,
  getPlayerMapPosition,
  getPlayerTokenScale,
  getTokenSize,
  resolveMapOverlaps,
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

  it('uses the requested new-game defaults', () => {
    expect(defaultMapWidth).toBe(500);
    expect(defaultMapHeight).toBe(500);
    expect(defaultTokenSize).toBe(90);
    expect(getTokenSize()).toBe(90);
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
      { x: 134, y: 155 },
      { x: 62, y: 155 },
      { x: 45, y: 100 },
      { x: 62, y: 45 },
      { x: 134, y: 45 },
      { x: 206, y: 45 },
      { x: 223, y: 100 },
      { x: 206, y: 155 },
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

  it('places several storytellers side by side at 75% size', () => {
    const storytellers: Player[] = ['first', 'second'].map((id) => ({
      id,
      isStoryteller: true,
      name: id,
      seat: -1,
    }));
    const mixedPlayers = [...players, ...storytellers];

    expect(
      storytellers.map((player) => getPlayerMapPosition(player, mixedPlayers, 268, 200, 90)),
    ).toEqual([
      { x: 100.25, y: 100 },
      { x: 167.75, y: 100 },
    ]);
    expect(storytellers.map((player) => getPlayerTokenScale(player, mixedPlayers))).toEqual([
      0.75, 0.75,
    ]);
    expect(getPlayerTokenScale(players[0], mixedPlayers)).toBe(1);
    expect(getPlayerTokenScale(storytellers[0], [...players, storytellers[0]])).toBe(1);
  });

  it('lets smaller storytellers sit closer together than full tokens', () => {
    const storytellers: Player[] = [
      { id: 'a', isStoryteller: true, name: 'A', position: { x: 200, y: 200 }, seat: -1 },
      { id: 'b', isStoryteller: true, name: 'B', position: { x: 267.5, y: 200 }, seat: -1 },
    ];

    expect(resolveTokenCollisions(storytellers, 500, 500, 90).positions).toEqual({});
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

describe('findFreeTokenPosition', () => {
  it('keeps the preferred spot when nothing covers it', () => {
    expect(findFreeTokenPosition([], { x: 250, y: 250 }, 500, 500, 90)).toEqual({ x: 250, y: 250 });
  });

  it('moves out of the way of a token on the preferred spot', () => {
    const blocker: Player = { id: 'st', name: 'Sam', position: { x: 250, y: 250 }, seat: -1 };
    const position = findFreeTokenPosition([blocker], { x: 250, y: 250 }, 500, 500, 90);

    expect(Math.hypot(position.x - 250, position.y - 250)).toBeGreaterThanOrEqual(90 - 0.5);
    expect(position).toEqual({ x: 250, y: 340 });
  });

  it('falls back to the preferred spot when the map has no room', () => {
    const blocker: Player = { id: 'a', name: 'A', position: { x: 50, y: 50 }, seat: 0 };

    expect(findFreeTokenPosition([blocker], { x: 50, y: 50 }, 100, 100, 90)).toEqual({
      x: 50,
      y: 50,
    });
  });
});

describe('resolveMapOverlaps', () => {
  it('pushes apart tokens that overlap, including ones still at their default spot', () => {
    const crowded: Player[] = [
      { id: 'a', name: 'A', position: { x: 250, y: 455 }, seat: 0 },
      // Seat 1 of 2 has no saved position, so it sits at its default spot on the top edge.
      { id: 'b', name: 'B', seat: 1 },
      { id: 'c', name: 'C', position: { x: 260, y: 45 }, seat: 2, isStoryteller: true },
    ];
    const positions = resolveMapOverlaps(crowded, 500, 500, 90);
    const placed = crowded.map((player) =>
      getPlayerMapPosition(
        { ...player, position: positions[player.id] ?? player.position },
        crowded,
        500,
        500,
        90,
      ),
    );

    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        expect(
          Math.hypot(placed[i].x - placed[j].x, placed[i].y - placed[j].y),
        ).toBeGreaterThanOrEqual(89);
      }
    }
    expect(positions.a).toBeUndefined();
  });
});
