import {
  buildConversationRows,
  hasDuplicatePlayerName,
  normalizePlayerName,
} from '@/utils/conversation-utils';
import type { Conversation, Player } from '@/types/game';

const players: Player[] = [
  { id: 'alice', name: 'Alice', seat: 0 },
  { id: 'ben', name: 'Ben', seat: 1 },
  { id: 'cora', name: 'Cora', seat: 2 },
];

describe('conversation utils', () => {
  it('normalizes player names for duplicate detection', () => {
    expect(normalizePlayerName('  Alice   Smith  ')).toBe('Alice Smith');
    expect(hasDuplicatePlayerName(['Alice Smith'], ' alice   smith ')).toBe(true);
    expect(hasDuplicatePlayerName(['Alice Smith'], 'Ben')).toBe(false);
  });

  it('builds day-specific conversation rows and prior-day repeat highlights', () => {
    const conversations: Conversation[] = [
      {
        id: 'day-1',
        day: 1,
        participantIds: ['alice', 'ben'],
        initiatorId: 'alice',
        createdAt: '2026-07-05T00:00:00.000Z',
      },
      {
        id: 'day-2',
        day: 2,
        participantIds: ['ben', 'alice', 'cora'],
        initiatorId: 'ben',
        createdAt: '2026-07-05T00:01:00.000Z',
      },
    ];

    expect(buildConversationRows(players, conversations, 1)).toEqual([
      {
        playerId: 'alice',
        playerName: 'Alice',
        talkedTo: ['Ben'],
        talkedToIds: ['ben'],
        repeatedPlayerIds: [],
      },
      {
        playerId: 'ben',
        playerName: 'Ben',
        talkedTo: ['Alice'],
        talkedToIds: ['alice'],
        repeatedPlayerIds: [],
      },
      {
        playerId: 'cora',
        playerName: 'Cora',
        talkedTo: [],
        talkedToIds: [],
        repeatedPlayerIds: [],
      },
    ]);

    expect(buildConversationRows(players, conversations, 2)[0]?.repeatedPlayerIds).toEqual([
      'ben',
    ]);
  });
});
