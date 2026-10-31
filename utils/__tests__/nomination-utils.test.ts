import type { Conversation, Player } from '@/types/game';
import {
  getAlivePlayerCount,
  getDaysLeft,
  getOnTheBlockNominationId,
  getPlayerNominationHistory,
  getVotesToExecute,
} from '@/utils/nomination-utils';

const now = '2026-10-31T00:00:00.000Z';

function player(id: string, extra: Partial<Player> = {}): Player {
  return { id, name: id, seat: 0, ...extra };
}

function nomination(id: string, voterIds: string[]): Conversation {
  return {
    createdAt: now,
    day: 2,
    id,
    initiatorId: 'a',
    kind: 'nomination',
    participantIds: ['a', 'b'],
    voterIds,
  };
}

const players = [
  player('st', { isStoryteller: true }),
  player('a'),
  player('b'),
  player('c'),
  player('d', { death: { day: 2, kind: 'night', updatedAt: now } }),
  player('e', { death: { day: 2, kind: 'execution', updatedAt: now } }),
  player('f'),
];

describe('nomination utils', () => {
  it('counts players alive at the start of the day, without Storytellers', () => {
    expect(getAlivePlayerCount(players, 2)).toBe(5);
    expect(getVotesToExecute(players, 2)).toBe(3);
    expect(getAlivePlayerCount(players, 1)).toBe(6);
    expect(getAlivePlayerCount(players, 3)).toBe(4);
  });

  it('puts the nominee with the most votes on the block once they reach the votes needed', () => {
    const noms = [nomination('n1', ['a', 'b', 'c']), nomination('n2', ['a', 'b', 'c', 'f'])];
    expect(getOnTheBlockNominationId(noms, players, 2)).toBe('n2');
  });

  it('leaves the block empty on a tie or when nobody has enough votes', () => {
    expect(
      getOnTheBlockNominationId(
        [nomination('n1', ['a', 'b', 'c']), nomination('n2', ['a', 'b', 'f'])],
        players,
        2,
      ),
    ).toBeUndefined();
    expect(getOnTheBlockNominationId([nomination('n1', ['a', 'b'])], players, 2)).toBeUndefined();
    expect(getOnTheBlockNominationId([], players, 2)).toBeUndefined();
  });
});

describe('getDaysLeft', () => {
  it('counts days with an execution each day and a kill each night', () => {
    expect([2, 3, 4, 5, 6, 7, 12].map(getDaysLeft)).toEqual([0, 1, 1, 2, 2, 3, 5]);
  });
});

describe('getPlayerNominationHistory', () => {
  it('lists nominations and votes from one player, newest day first', () => {
    const noms: Conversation[] = [
      { ...nomination('n1', ['a', 'c']), day: 1, initiatorId: 'a', participantIds: ['a', 'b'] },
      { ...nomination('n2', ['b']), day: 1, initiatorId: 'c', participantIds: ['c', 'a'] },
      { ...nomination('n3', []), day: 2, initiatorId: 'b', participantIds: ['b', 'c'] },
      { ...nomination('n4', ['a']), day: 3, initiatorId: 'b', participantIds: ['b', 'c'] },
    ];
    expect(getPlayerNominationHistory(noms, players, 'a', 2)).toEqual([
      { day: 2, didNotVoteFor: ['c'], nominated: [], nominatedBy: [], votedFor: [] },
      { day: 1, didNotVoteFor: [], nominated: ['b'], nominatedBy: ['c'], votedFor: ['b'] },
    ]);
  });
});
