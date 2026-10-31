import type { Conversation, Player, Role } from '@/types/game';
import { getDayRecap } from '@/utils/day-recap-utils';

const at = (minute: number) => `2026-10-31T00:${String(minute).padStart(2, '0')}:00.000Z`;
const roles: Role[] = [
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
  { id: 'empath', name: 'Empath', team: 'townsfolk' },
  { id: 'imp', name: 'Imp', team: 'demon' },
];

const players: Player[] = [
  { id: 'st', isStoryteller: true, name: 'Story', seat: 0 },
  {
    id: 'a',
    name: 'Ann',
    roleAssignments: [
      { day: 1, kind: 'claim', phase: 'day', roleIds: ['chef'], updatedAt: at(1) },
      { day: 2, kind: 'claim', phase: 'day', roleIds: ['chef'], updatedAt: at(5) },
    ],
    seat: 1,
  },
  {
    death: { day: 2, kind: 'execution', updatedAt: at(9) },
    id: 'b',
    name: 'Bob',
    roleAssignments: [
      { day: 2, kind: 'claim', phase: 'day', roleIds: ['empath'], updatedAt: at(6) },
    ],
    seat: 2,
  },
  {
    death: { day: 2, killerRoleIds: ['imp'], kind: 'night', updatedAt: at(3) },
    id: 'c',
    name: 'Cat',
    seat: 3,
  },
  { id: 'd', name: 'Dan', revive: { day: 2, updatedAt: at(8) }, seat: 4 },
  { id: 'e', name: 'Eve', seat: 5 },
];

const conversations: Conversation[] = [
  {
    createdAt: at(7),
    day: 2,
    id: 'n1',
    initiatorId: 'a',
    kind: 'nomination',
    participantIds: ['a', 'b'],
    voterIds: ['a', 'd', 'e'],
  },
  {
    createdAt: at(7),
    day: 2,
    id: 'talk',
    initiatorId: 'a',
    kind: 'interaction',
    participantIds: ['a', 'e'],
  },
];

describe('getDayRecap', () => {
  it('lists the night and the day in order', () => {
    const recap = getDayRecap({ conversations, players }, 2, roles);
    expect(recap.night.map((event) => event.text)).toEqual(['Cat died (Imp)']);
    expect(recap.day.map((event) => event.text)).toEqual([
      'Bob claimed Empath',
      'Ann nominated Bob: 3/2 votes, on the block',
      'Bob was executed',
      'Dan came back',
    ]);
  });

  it('shows a claim on the day it was first made', () => {
    const recap = getDayRecap({ conversations, players }, 1, roles);
    expect(recap.day.map((event) => event.text)).toEqual(['Ann claimed Chef']);
    expect(recap.night).toEqual([]);
  });
});

describe('getDayRecap with roles hidden', () => {
  it('leaves out claims and killer characters', () => {
    const recap = getDayRecap({ conversations, players }, 2, roles, false);
    expect(recap.night.map((event) => event.text)).toEqual(['Cat died']);
    expect(recap.day.map((event) => event.text)).not.toContain('Bob claimed Empath');
  });
});
