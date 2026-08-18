import type { Game, Player } from '@/types/game';
import { getGameStats, getLastDayWithData } from '@/utils/game-utils';
import { APP_USER_ID } from '@/utils/object-id';

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

  it('considers role assignment days', () => {
    const game = makeGame({
      players: [
        makePlayer({
          roleAssignments: [
            {
              day: 7,
              kind: 'confirm',
              roleIds: ['role-1'],
              updatedAt: '2026-01-07T00:00:00.000Z',
            },
          ],
        }),
      ],
    });

    expect(getLastDayWithData(game)).toBe(7);
  });

  it('falls back to 1 when playerDayNotes is missing', () => {
    const game = makeGame({ playerDayNotes: undefined });
    expect(getLastDayWithData(game)).toBe(1);
  });
});

describe('getGameStats', () => {
  it('returns an empty win rate when no games have a result', () => {
    expect(getGameStats([])).toEqual({
      completedGames: 0,
      evilGames: 0,
      evilSideRate: undefined,
      evilWinRate: undefined,
      goodGames: 0,
      goodSideRate: undefined,
      goodWinRate: undefined,
      totalGames: 0,
      winRate: undefined,
      wins: 0,
    });
  });

  it('counts every saved game while calculating win rate from completed games', () => {
    expect(
      getGameStats([
        makeGame({ id: 'won', result: 'won' }),
        makeGame({ id: 'lost', result: 'lost' }),
        makeGame({ id: 'active' }),
      ]),
    ).toEqual({
      completedGames: 2,
      evilGames: 0,
      evilSideRate: undefined,
      evilWinRate: undefined,
      goodGames: 0,
      goodSideRate: undefined,
      goodWinRate: undefined,
      totalGames: 3,
      winRate: 50,
      wins: 1,
    });
  });

  it('calculates separate win rates from the app user role alignment', () => {
    const goodGame = makeAlignedGame('townsfolk', 'won');
    const evilGame = makeAlignedGame('demon', 'lost');
    const travelerGame = makeAlignedGame('traveller', 'won');
    const activeGoodGame = makeAlignedGame('townsfolk');

    expect(getGameStats([goodGame, evilGame, travelerGame, activeGoodGame])).toMatchObject({
      evilGames: 1,
      evilSideRate: 33,
      evilWinRate: 0,
      goodGames: 2,
      goodSideRate: 67,
      goodWinRate: 100,
    });
  });
});

function makeAlignedGame(team: 'demon' | 'townsfolk' | 'traveller', result?: 'lost' | 'won'): Game {
  const roleId = `${team}-role`;

  return makeGame({
    id: `${team}-${result}`,
    players: [
      {
        id: APP_USER_ID,
        name: 'Alice',
        roleAssignments: [
          {
            day: 1,
            kind: 'confirm',
            roleIds: [roleId],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        seat: 0,
      },
    ],
    result,
    script: {
      id: `${team}-script`,
      name: `${team} script`,
      roles: [{ id: roleId, name: team, team }],
      updatedAt: '2026-01-01T00:00:00.000Z',
      version: '1',
    },
  });
}
