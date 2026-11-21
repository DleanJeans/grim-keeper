import type { Game } from '@/types/game';
import { swapGamePlayer } from '@/utils/swap-player-utils';

const game: Game = {
  activeDay: 2,
  conversations: [
    {
      bigWigPlayerId: 'old',
      createdAt: '',
      day: 1,
      id: 'c1',
      initiatorId: 'old',
      kind: 'nomination',
      participantIds: ['old', 'ben'],
      voterIds: ['ben', 'old'],
    },
  ],
  createdAt: '',
  fakeEvilTeam: { demonId: 'old', minionIds: ['ben', 'old'], redHerringId: 'old' },
  id: 'g',
  knavesLiarId: 'old',
  players: [
    {
      death: { day: 1, kind: 'night', killerPlayerId: 'ben', updatedAt: '' },
      id: 'old',
      name: 'Sam',
      roleAssignments: [{ day: 1, kind: 'claim', roleIds: ['imp'], updatedAt: '' }],
      seat: 1,
    },
    {
      death: { day: 2, kind: 'night', killerPlayerIds: ['old'], updatedAt: '' },
      id: 'ben',
      name: 'Ben',
      roleAssignments: [
        { day: 1, kind: 'rumor', roleIds: [], subjectPlayerId: 'old', updatedAt: '' },
      ],
      seat: 2,
    },
  ],
  playerDayNotes: [{ day: 1, notes: [], playerId: 'old', updatedAt: '' }],
  roleInfos: [
    { day: 1, phase: 'night', playerId: 'old', roleId: 'washerwoman', updatedAt: '', values: {} },
  ],
  suspicions: { '3:old': 'suspect', '3:ben': 'trusted' },
  theories: [{ evilPlayerIds: ['old'], id: 't' }],
  tokenLabels: { old: 'drunk?' },
  updatedAt: '',
};

describe('swapGamePlayer', () => {
  it('points every reference at the new friend', () => {
    const next = swapGamePlayer(game, 'old', { id: 'sam2', name: 'Sam T' });
    expect(JSON.stringify(next)).not.toContain('"old"');
    expect(next.players[0]).toMatchObject({ id: 'sam2', name: 'Sam T', seat: 1 });
    expect(next.players[0].death?.killerPlayerId).toBe('ben');
    expect(next.players[1].death?.killerPlayerIds).toEqual(['sam2']);
    expect(next.conversations[0].participantIds).toEqual(['sam2', 'ben']);
    expect(next.suspicions).toEqual({ '3:sam2': 'suspect', '3:ben': 'trusted' });
    expect(next.tokenLabels).toEqual({ sam2: 'drunk?' });
    expect(next.roleInfos?.[0].playerId).toBe('sam2');
    expect(next.knavesLiarId).toBe('sam2');
  });

  it('refuses a friend already in the game', () => {
    expect(swapGamePlayer(game, 'old', { id: 'ben', name: 'Ben' })).toBe(game);
  });
});
