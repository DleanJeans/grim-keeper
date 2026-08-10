import type { GameData } from '@/store/game-store';
import { getBackupStats } from '@/utils/data-transfer-stats';

describe('getBackupStats', () => {
  it('counts backup records across games and note collections', () => {
    const data: GameData = {
      appUserName: 'Keeper',
      friends: [
        { id: 'alice', name: 'Alice', createdAt: '2026-08-03T00:00:00.000Z' },
        { id: 'bob', name: 'Bob', createdAt: '2026-08-03T00:00:00.000Z' },
      ],
      games: [
        {
          id: 'game-1',
          activeDay: 1,
          createdAt: '2026-08-03T00:00:00.000Z',
          updatedAt: '2026-08-03T00:00:00.000Z',
          players: [
            { id: 'app-user', name: 'Keeper', seat: 0 },
            { id: 'alice', name: 'Alice', seat: 1 },
          ],
          conversations: [],
          playerDayNotes: [
            {
              day: 1,
              playerId: 'alice',
              updatedAt: '2026-08-03T00:00:00.000Z',
              notes: [
                {
                  id: 'note-1',
                  text: 'Note',
                  createdAt: '2026-08-03T00:00:00.000Z',
                  updatedAt: '2026-08-03T00:00:00.000Z',
                },
                {
                  id: 'note-2',
                  text: 'Another note',
                  createdAt: '2026-08-03T00:00:00.000Z',
                  updatedAt: '2026-08-03T00:00:00.000Z',
                },
              ],
            },
          ],
        },
      ],
      roleCatalog: [],
      savedNotes: [
        {
          id: 'saved-note-1',
          playerName: 'Alice',
          roleIds: [],
          text: 'Future note',
          gameId: 'game-1',
          scriptName: '',
          day: 1,
          createdAt: '2026-08-03T00:00:00.000Z',
          updatedAt: '2026-08-03T00:00:00.000Z',
        },
      ],
      scripts: [
        {
          id: 'script-1',
          name: 'Script',
          roles: [],
          updatedAt: '2026-08-03T00:00:00.000Z',
          version: '1',
        },
      ],
    };

    expect(getBackupStats(data)).toEqual({
      friends: 2,
      games: 1,
      notes: 3,
      players: 2,
      scripts: 1,
    });
  });
});
