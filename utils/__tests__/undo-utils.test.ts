import type { Conversation, Game, Player } from '@/types/game';
import { describeGameChange, PENDING_CHANGE } from '@/utils/undo-utils';

const now = '2026-10-31T00:00:00.000Z';
const ann: Player = { id: 'a', name: 'Ann', seat: 0 };
const nomination: Conversation = {
  createdAt: now,
  day: 1,
  id: 'n1',
  initiatorId: 'a',
  kind: 'nomination',
  participantIds: ['a', 'b'],
};
const base: Pick<Game, 'conversations' | 'players'> = { conversations: [], players: [ann] };

describe('describeGameChange', () => {
  it('names deaths, revives and character assignments', () => {
    const dead = { ...ann, death: { day: 1, kind: 'night' as const, updatedAt: now } };
    expect(describeGameChange(base, { ...base, players: [dead] })).toBe('Death recorded');
    expect(describeGameChange({ ...base, players: [dead] }, base)).toBe('Death removed');
    const claimed = {
      ...ann,
      roleAssignments: [{ day: 1, kind: 'claim' as const, roleIds: ['chef'], updatedAt: now }],
    };
    expect(describeGameChange(base, { ...base, players: [claimed] })).toBe('Claim saved');
  });

  it('waits for votes on a new nomination', () => {
    const withNomination = { ...base, conversations: [nomination] };
    expect(describeGameChange(base, withNomination)).toBe(PENDING_CHANGE);
    const voted = { ...base, conversations: [{ ...nomination, voterIds: ['a'] }] };
    expect(describeGameChange(withNomination, voted)).toBe('Votes saved');
    expect(describeGameChange(base, voted)).toBe('Nomination saved');
    expect(describeGameChange(voted, base)).toBe('Nomination deleted');
  });

  it('ignores other edits', () => {
    expect(describeGameChange(base, { ...base, players: [{ ...ann }] })).toBeUndefined();
  });
});
