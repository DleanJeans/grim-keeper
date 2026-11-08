import type { Player, Role, SavedNote } from '@/types/game';
import {
  getLessonPlayers,
  getLessonsForPlayers,
  getLessonsForScriptCharacters,
  getLessonsFromGame,
} from '@/utils/lesson-utils';

const roles = [
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
  { id: 'empath', name: 'Empath', team: 'townsfolk' },
  { id: 'imp', name: 'Imp', team: 'demon' },
] as Role[];

function player(id: string, overrides: Partial<Player> = {}): Player {
  return { id, name: id.toUpperCase(), ...overrides } as Player;
}

describe('getLessonPlayers', () => {
  it('lists every other player with what they claimed and really were', () => {
    const players = [
      player('app-user', {
        roleAssignments: [{ day: 1, kind: 'claim', roleIds: ['chef'], updatedAt: 'x' }],
      }),
      player('ann', {
        roleAssignments: [
          { day: 1, kind: 'claim', roleIds: ['chef'], updatedAt: 'x' },
          { day: 3, kind: 'confirm', roleIds: ['imp'], updatedAt: 'x' },
        ],
      }),
      player('bob', {
        roleAssignments: [
          { day: 1, kind: 'claim', roleIds: ['empath'], updatedAt: 'x' },
          { day: 2, kind: 'confirm', roleIds: ['empath'], updatedAt: 'x' },
        ],
      }),
      player('cat', {
        roleAssignments: [{ day: 2, kind: 'claim', roleIds: ['chef', 'empath'], updatedAt: 'x' }],
      }),
      player('dan'),
      player('eve', {
        roleAssignments: [{ day: 1, kind: 'confirm', roleIds: ['chef_evil'], updatedAt: 'x' }],
      }),
      player('st', { isStoryteller: true }),
    ] as Player[];

    expect(getLessonPlayers({ players }, roles, 3, 'day')).toEqual([
      { evil: true, playerId: 'ann', playerName: 'ANN', roleText: 'Chef → Imp' },
      { evil: false, playerId: 'bob', playerName: 'BOB', roleText: 'Empath' },
      { evil: false, playerId: 'cat', playerName: 'CAT', roleText: 'Chef / Empath' },
      { evil: false, playerId: 'dan', playerName: 'DAN', roleText: undefined },
      { evil: true, playerId: 'eve', playerName: 'EVE', roleText: 'Evil Chef' },
    ]);
  });
});

describe('getLessonsFromGame', () => {
  it('keeps notes about the player from that game, oldest first', () => {
    const note = (id: string, playerName: string, gameId: string, createdAt: string) =>
      ({ createdAt, gameId, id, playerName, roleIds: [], text: id }) as unknown as SavedNote;
    const savedNotes = [
      note('b', 'Ann', 'g1', '2026-01-02'),
      note('a', ' ann ', 'g1', '2026-01-01'),
      note('c', 'Ann', 'g2', '2026-01-03'),
      note('d', 'Bob', 'g1', '2026-01-04'),
    ];

    expect(getLessonsFromGame(savedNotes, 'ANN', 'g1').map((n) => n.id)).toEqual(['a', 'b']);
  });
});

describe('getLessonsForPlayers', () => {
  it('lists players with notes from other games, newest first, skipping you and the Storyteller', () => {
    const note = (id: string, playerName: string, gameId: string, createdAt: string) =>
      ({ createdAt, gameId, id, playerName, roleIds: [], text: id }) as unknown as SavedNote;
    const savedNotes = [
      note('old', 'Ann', 'g0', '2026-01-01'),
      note('new', 'Ann', 'g1', '2026-01-02'),
      note('this-game', 'Ann', 'g2', '2026-01-03'),
      note('only-this-game', 'Bob', 'g2', '2026-01-03'),
      note('st', 'St', 'g1', '2026-01-03'),
    ];
    const players = [player('ann', { name: 'Ann' }), player('bob', { name: 'Bob' })];
    players.push(player('st', { isStoryteller: true, name: 'St' }));

    expect(
      getLessonsForPlayers({ id: 'g2', players }, savedNotes).map(({ lessons, playerId }) => [
        playerId,
        lessons.map((lesson) => lesson.id),
      ]),
    ).toEqual([['ann', ['new', 'old']]]);
  });
});

describe('getLessonsForScriptCharacters', () => {
  const note = (id: string, playerName: string, roleIds: string[], gameId = 'old'): SavedNote => ({
    createdAt: `2026-07-0${id}T00:00:00.000Z`,
    day: 1,
    gameId,
    id,
    playerName,
    roleIds,
    scriptName: 'Trouble Brewing',
    text: `note ${id}`,
    updatedAt: `2026-07-0${id}T00:00:00.000Z`,
  });
  const game = {
    id: 'game-1',
    script: {
      id: 'tb',
      name: 'Trouble Brewing',
      roles: [
        { id: 'mayor', name: 'Mayor' },
        { id: 'spy', name: 'Spy' },
      ],
      updatedAt: '2026-07-07T00:00:00.000Z',
      version: '1.0.0',
    },
  };

  it('groups character-only notes from other games under their first script character', () => {
    const groups = getLessonsForScriptCharacters(
      game,
      [
        note('1', '', ['spy', 'mayor']),
        note('2', 'You', ['spy']),
        note('3', '', ['spy_evil']),
        note('4', 'Stefan', ['spy']),
        note('5', '', ['spy'], 'game-1'),
        note('6', '', ['imp']),
      ],
      'You',
    );

    expect(
      groups.map((group) => [group.role.id, group.lessons.map((lesson) => lesson.id)]),
    ).toEqual([
      ['mayor', ['1']],
      ['spy', ['3', '2']],
    ]);
  });
});
