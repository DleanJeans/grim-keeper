import type { Player } from '@/types/game';
import {
  getLatestHistoryEntry,
  getRoleAssignmentHistory,
  type RoleAssignmentHistoryEntry,
} from '@/utils/role-assignment-history';

function player(id: string, roleAssignments: Player['roleAssignments'] = []): Player {
  return { id, name: id.toUpperCase(), roleAssignments, seat: 1 } as unknown as Player;
}

const at = '2026-01-01T00:00:00.000Z';

describe('getRoleAssignmentHistory', () => {
  it("lists a player's claims oldest first and skips empty ones", () => {
    const players = [
      player('a', [
        { day: 2, kind: 'claim', phase: 'night', roleIds: ['chef'], updatedAt: at },
        { day: 1, kind: 'claim', phase: 'day', roleIds: ['empath'], updatedAt: at },
        { day: 3, kind: 'claim', phase: 'day', roleIds: [], updatedAt: at },
        { day: 1, kind: 'guess', phase: 'day', roleIds: ['imp'], updatedAt: at },
      ]),
      player('b', [{ day: 1, kind: 'claim', phase: 'day', roleIds: ['monk'], updatedAt: at }]),
    ];

    expect(getRoleAssignmentHistory(players, 'a', 'claim')).toEqual([
      expect.objectContaining({ phaseIndex: 1, roleIds: ['empath'] }),
      expect.objectContaining({ phaseIndex: 2, roleIds: ['chef'] }),
    ]);
  });

  it('collects rumors about the player from every source', () => {
    const players = [
      player('a'),
      player('b', [
        {
          day: 1,
          kind: 'rumor',
          phase: 'day',
          roleIds: ['imp'],
          subjectPlayerId: 'a',
          updatedAt: at,
        },
        {
          day: 1,
          kind: 'rumor',
          phase: 'day',
          roleIds: ['spy'],
          subjectPlayerId: 'c',
          updatedAt: at,
        },
      ]),
      player('a2'),
    ];

    expect(getRoleAssignmentHistory(players, 'a', 'rumor')).toEqual([
      expect.objectContaining({ ownerName: 'B', ownerPlayerId: 'b', roleIds: ['imp'] }),
    ]);
  });
});

describe('getLatestHistoryEntry', () => {
  it('returns the newest entry that is not after the phase', () => {
    const entries: RoleAssignmentHistoryEntry[] = [
      { day: 1, kind: 'claim', ownerPlayerId: 'a', phase: 'day', phaseIndex: 1, roleIds: ['x'] },
      { day: 4, kind: 'claim', ownerPlayerId: 'a', phase: 'day', phaseIndex: 7, roleIds: ['y'] },
    ];

    expect(getLatestHistoryEntry(entries, 0)).toBeUndefined();
    expect(getLatestHistoryEntry(entries, 6)?.roleIds).toEqual(['x']);
    expect(getLatestHistoryEntry(entries, 8)?.roleIds).toEqual(['y']);
  });
});
