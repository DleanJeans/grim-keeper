import type { GameData } from '@/store/game-store';
import type { Game } from '@/types/game';
import { createBackup, parseBackup } from '@/utils/data-transfer';
import { remapDjSessionGameId } from '@/utils/dj-utils';
import { createGameTransfer, parseGameTransfer } from '@/utils/game-transfer';
import { APP_USER_ID } from '@/utils/object-id';

const songUrl = 'https://open.spotify.com/track/example-track';

const game: Game = {
  activeDay: 1,
  conversations: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  id: 'source-game',
  players: [{ id: APP_USER_ID, name: 'Keeper', seat: 0 }],
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const data: GameData = {
  appUserName: 'Keeper',
  friends: [],
  games: [game],
  roleCatalog: [],
  savedNotes: [],
  scripts: [],
};

describe('DJ transfer boundaries', () => {
  it('round trips catalog and session history without runtime metadata or credentials', () => {
    const backup = JSON.parse(
      createBackup({
        ...data,
        dj: {
          enabled: true,
          playlists: [
            {
              songUrls: [songUrl],
              target: { id: 'general', type: 'general' },
            },
          ],
          sessions: [{ approvalScore: 2, gameId: game.id, playedCount: 3, songUrl }],
        },
      }),
    );

    expect(backup.version).toBe(3);
    expect(JSON.stringify(backup)).not.toContain('imageUrl');
    expect(JSON.stringify(backup)).not.toContain('accessToken');
    expect(JSON.stringify(backup)).not.toContain('thumbnail');
    expect(parseBackup(JSON.stringify(backup)).dj).toEqual({
      enabled: true,
      playlists: [{ songUrls: [songUrl], target: { id: 'general', type: 'general' } }],
      sessions: [{ approvalScore: 2, gameId: game.id, playedCount: 3, songUrl }],
    });
  });

  it('omits empty DJ collections and still imports version 2 backups', () => {
    const backup = JSON.parse(
      createBackup({
        ...data,
        dj: {
          enabled: false,
          playlists: [{ songUrls: [], target: { id: 'general', type: 'general' } }],
          sessions: [{ approvalScore: 0, gameId: game.id, playedCount: 0, songUrl }],
        },
      }),
    );
    expect(backup.data).not.toHaveProperty('dj');

    backup.version = 2;
    expect(parseBackup(JSON.stringify(backup))).toEqual(data);
  });

  it('filters single-game DJ history and remaps it to an imported local game ID', () => {
    const transfer = parseGameTransfer(
      createGameTransfer(game, [], [], {
        enabled: true,
        playlists: [],
        sessions: [
          { approvalScore: 1, gameId: game.id, playedCount: 1, songUrl },
          {
            approvalScore: 3,
            gameId: 'another-game',
            playedCount: 4,
            songUrl: 'https://example.com/other',
          },
        ],
      }),
    );

    expect(transfer.dj?.sessions).toEqual([
      { approvalScore: 1, gameId: game.id, playedCount: 1, songUrl },
    ]);

    const remapped = remapDjSessionGameId(transfer.dj?.sessions ?? [], game.id, 'local-game-id');
    expect(remapped).toEqual([
      { approvalScore: 1, gameId: 'local-game-id', playedCount: 1, songUrl },
    ]);
  });
});
