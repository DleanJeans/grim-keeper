import type { Game, Player } from '@/types/game';
import { getLastDayWithData } from '@/utils/game-utils';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Alice',
    seat: 0,
    ...overrides,
  };
}

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'g1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    activeDay: 1,
    players: [makePlayer()],
    conversations: [],
    ...overrides,
  };
}

describe('getLastDayWithData', () => {
  it('returns 1 for a brand new game with no data', () => {
    expect(getLastDayWithData(makeGame())).toBe(1);
  });

  it('returns the highest conversation day across interactions and nominations', () => {
    const game = makeGame({
      conversations: [
        {
          id: 'c1',
          day: 2,
          participantIds: ['p1', 'p2'],
          initiatorId: 'p1',
          createdAt: '2026-01-02T00:00:00.000Z',
        },
        {
          id: 'c2',
          day: 4,
          kind: 'nomination',
          participantIds: ['p1', 'p2'],
          initiatorId: 'p1',
          voterIds: [],
          createdAt: '2026-01-04T00:00:00.000Z',
        },
      ],
    });

    expect(getLastDayWithData(game)).toBe(4);
  });

  it('considers player day notes', () => {
    const game = makeGame({
      conversations: [
        {
          id: 'c1',
          day: 2,
          participantIds: ['p1', 'p2'],
          initiatorId: 'p1',
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      playerDayNotes: [
        {
          day: 5,
          playerId: 'p1',
          notes: [
            {
              createdAt: '2026-01-05T00:00:00.000Z',
              id: 'note-1',
              text: 'loud',
              updatedAt: '2026-01-05T00:00:00.000Z',
            },
          ],
          updatedAt: '2026-01-05T00:00:00.000Z',
        },
      ],
    });

    expect(getLastDayWithData(game)).toBe(5);
  });

  it('considers player deaths and revives', () => {
    const game = makeGame({
      players: [
        makePlayer({
          death: { day: 3, kind: 'execution', updatedAt: '2026-01-03T00:00:00.000Z' },
        }),
        makePlayer({
          id: 'p2',
          seat: 1,
          name: 'Bob',
          revive: { day: 6, updatedAt: '2026-01-06T00:00:00.000Z' },
        }),
      ],
      conversations: [
        {
          id: 'c1',
          day: 1,
          participantIds: ['p1', 'p2'],
          initiatorId: 'p1',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    expect(getLastDayWithData(game)).toBe(6);
  });

  it('falls back to 1 when playerDayNotes is missing', () => {
    const game = makeGame({ playerDayNotes: undefined });
    expect(getLastDayWithData(game)).toBe(1);
  });
});
