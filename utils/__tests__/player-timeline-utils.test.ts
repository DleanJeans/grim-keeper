import type { Game } from '@/types/game';
import { getPlayerTimeline } from '@/utils/player-timeline-utils';

const now = '2026-10-31T00:00:00.000Z';
const game: Pick<Game, 'conversations' | 'playerDayNotes' | 'players' | 'suspicions'> = {
  conversations: [
    { createdAt: now, day: 1, id: 't1', initiatorId: 'a', participantIds: ['a', 'b'] },
    {
      createdAt: now,
      day: 2,
      id: 'n1',
      initiatorId: 'b',
      kind: 'nomination',
      participantIds: ['b', 'a'],
      voterIds: ['b', 'c'],
    },
  ],
  playerDayNotes: [
    {
      day: 1,
      notes: [{ createdAt: now, id: 'x', text: 'quiet', updatedAt: now }],
      phase: 'day',
      playerId: 'a',
      updatedAt: now,
    },
  ],
  players: [
    {
      death: { day: 2, kind: 'execution', updatedAt: now },
      id: 'a',
      name: 'Ann',
      roleAssignments: [{ day: 1, kind: 'claim', phase: 'day', roleIds: ['chef'], updatedAt: now }],
      seat: 1,
    },
    { id: 'b', name: 'Bob', seat: 2 },
    { id: 'c', name: 'Cat', seat: 3 },
  ],
  suspicions: { '1:a': 'suspect' },
};
const roles = [{ id: 'chef', name: 'Chef', team: 'townsfolk' }];

describe('getPlayerTimeline', () => {
  it('lists each phase newest first', () => {
    expect(getPlayerTimeline(game, 'a', roles, 2, 'day', true)).toEqual([
      { day: 2, items: ['Nominated by Bob (2 votes)', 'Executed'], phase: 'day' },
      {
        day: 1,
        items: ['Claimed Chef', 'Marked suspect', 'Note: quiet', 'Talked with Bob'],
        phase: 'day',
      },
    ]);
  });

  it('stops at the current phase and hides characters with roles off', () => {
    expect(getPlayerTimeline(game, 'a', roles, 1, 'day', false)).toEqual([
      { day: 1, items: ['Note: quiet', 'Talked with Bob'], phase: 'day' },
    ]);
  });
});
