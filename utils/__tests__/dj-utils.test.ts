import type { DjPlaylist, DjSessionSong } from '@/types/dj';
import type { Friend, Game, Role } from '@/types/game';
import {
  addDjSong,
  adjustDjApproval,
  getDjGameSources,
  getDjSongStats,
  getDjSongsForSources,
  recordDjPlayed,
  remapDjFriendTarget,
  serializeDjData,
} from '@/utils/dj-utils';
import { APP_USER_ID } from '@/utils/object-id';

const role: Role = { id: 'fortune-teller', name: 'Fortune Teller', team: 'townsfolk' };
const friend: Friend = { createdAt: '2026-09-01T00:00:00.000Z', id: 'alice', name: 'Alice' };

describe('DJ data helpers', () => {
  it('normalizes URLs, deduplicates songs, and removes an empty playlist', () => {
    const target = { id: 'alice', type: 'friend' as const };
    let playlists: DjPlaylist[] = [];

    playlists = addDjSong(playlists, target, ' https://example.com/song ');
    playlists = addDjSong(playlists, target, 'https://example.com/song');

    expect(playlists).toEqual([{ songUrls: ['https://example.com/song'], target }]);

    const serialized = serializeDjData({ enabled: false, playlists, sessions: [] });
    expect(serialized?.playlists).toEqual(playlists);
  });

  it('omits empty playlists and zero-stat session rows from persisted data', () => {
    const serialized = serializeDjData({
      enabled: false,
      playlists: [
        { songUrls: [], target: { id: 'general', type: 'general' } },
        { songUrls: ['https://example.com/song'], target: { id: 'general', type: 'general' } },
      ],
      sessions: [
        {
          approvalScore: 0,
          gameId: 'game-1',
          playedCount: 0,
          songUrl: 'https://example.com/unused',
        },
        {
          approvalScore: -1,
          gameId: 'game-1',
          playedCount: 1,
          songUrl: 'https://example.com/song',
        },
      ],
    });

    expect(serialized?.playlists).toHaveLength(1);
    expect(serialized?.sessions).toEqual([
      { approvalScore: -1, gameId: 'game-1', playedCount: 1, songUrl: 'https://example.com/song' },
    ]);
    expect(serializeDjData({ enabled: false, playlists: [], sessions: [] })).toBeUndefined();
  });

  it('increments played counts and aggregates positive and negative approval', () => {
    let sessions: DjSessionSong[] = [];
    sessions = recordDjPlayed(sessions, 'game-1', 'https://example.com/song');
    sessions = recordDjPlayed(sessions, 'game-1', 'https://example.com/song');
    sessions = recordDjPlayed(sessions, 'game-2', 'https://example.com/song');
    sessions = adjustDjApproval(sessions, 'game-1', 'https://example.com/song', 1);
    sessions = adjustDjApproval(sessions, 'game-2', 'https://example.com/song', -1);

    expect(getDjSongStats(sessions, 'https://example.com/song')).toEqual({
      approvalScore: 0,
      gameCount: 2,
      playedCount: 3,
    });
  });

  it('aggregates game sources and merges duplicate songs with source labels', () => {
    const game: Game = {
      activeDay: 2,
      conversations: [],
      createdAt: '2026-09-01T00:00:00.000Z',
      id: 'game-1',
      players: [
        { id: APP_USER_ID, name: 'Keeper', seat: 0 },
        {
          id: friend.id,
          name: friend.name,
          roleAssignments: [
            {
              day: 1,
              kind: 'confirm',
              roleIds: [role.id],
              updatedAt: '2026-09-01T00:00:00.000Z',
            },
          ],
          seat: 1,
        },
      ],
      script: {
        id: 'script-1',
        name: 'Trouble Brewing',
        roles: [role],
        updatedAt: '2026-09-01T00:00:00.000Z',
        version: '1',
      },
      scriptId: 'script-1',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };
    const sources = getDjGameSources(game, [role], [friend]);
    const songUrl = 'https://example.com/song';
    const playlists = sources
      .slice(0, 3)
      .map((source) => ({ songUrls: [songUrl], target: source.target }));

    expect(sources.map((source) => source.label)).toEqual([
      'General',
      'Trouble Brewing',
      'Alice',
      'Fortune Teller',
    ]);
    expect(getDjSongsForSources(playlists, sources)).toEqual([
      { labels: ['General', 'Trouble Brewing', 'Alice'], songUrl },
    ]);
  });

  it('remaps friend playlist targets after a friend rename', () => {
    const playlists: DjPlaylist[] = [
      { songUrls: ['https://example.com/song'], target: { id: 'old-alice', type: 'friend' } },
      { songUrls: ['https://example.com/song-3'], target: { id: 'new-alice', type: 'friend' } },
      { songUrls: ['https://example.com/song-2'], target: { id: 'role', type: 'character' } },
    ];

    expect(remapDjFriendTarget(playlists, 'old-alice', 'new-alice')).toEqual([
      {
        songUrls: ['https://example.com/song', 'https://example.com/song-3'],
        target: { id: 'new-alice', type: 'friend' },
      },
      { songUrls: ['https://example.com/song-2'], target: { id: 'role', type: 'character' } },
    ]);
  });
});
