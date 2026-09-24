import {
  getCurrentlyPlayingSpotifySong,
  parseSpotifySong,
  parseYouTubeVideoId,
  queueSpotifySong,
  resolveDjSongMetadata,
} from '@/utils/spotify';

describe('DJ provider parsing', () => {
  it('parses Spotify track and episode URLs and URIs', () => {
    expect(parseSpotifySong('spotify:track:abc123')).toEqual({
      id: 'abc123',
      type: 'track',
      uri: 'spotify:track:abc123',
    });
    expect(parseSpotifySong('https://open.spotify.com/episode/episode1?si=test')).toEqual({
      id: 'episode1',
      type: 'episode',
      uri: 'spotify:episode:episode1',
    });
    expect(parseSpotifySong('https://example.com/track/abc123')).toBeUndefined();
  });

  it('parses common YouTube URL shapes', () => {
    expect(parseYouTubeVideoId('https://youtu.be/video-1?t=2')).toBe('video-1');
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=video-2')).toBe('video-2');
    expect(parseYouTubeVideoId('https://youtube.com/shorts/video-3')).toBe('video-3');
    expect(parseYouTubeVideoId('https://example.com/video-4')).toBeUndefined();
  });

  it('uses provider fallbacks when runtime metadata lookup fails', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('offline'));
    globalThis.fetch = fetchMock;

    await expect(resolveDjSongMetadata('https://open.spotify.com/track/track1')).resolves.toEqual({
      provider: 'spotify',
    });
    await expect(resolveDjSongMetadata('https://www.youtube.com/watch?v=video-1')).resolves.toEqual(
      {
        imageUrl: 'https://i.ytimg.com/vi/video-1/hqdefault.jpg',
        provider: 'youtube',
      },
    );
  });

  it('uses Spotify oEmbed title and cover art when available', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        thumbnail_url: 'https://i.scdn.co/image/cover',
        title: 'A song',
      }),
      ok: true,
    });

    await expect(resolveDjSongMetadata('https://open.spotify.com/track/track1')).resolves.toEqual({
      imageUrl: 'https://i.scdn.co/image/cover',
      provider: 'spotify',
      title: 'A song',
    });
  });
});

describe('Spotify queueing', () => {
  const originalClientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
  const originalExpoOs = process.env.EXPO_OS;
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const storage = new Map<string, string>();

  beforeEach(() => {
    process.env.EXPO_OS = 'web';
    process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID = 'client-id';
    storage.clear();
    storage.set(
      'grim-keeper-spotify-auth-v1',
      JSON.stringify({ accessToken: 'access-token', expiresAt: Date.now() + 60_000 }),
    );
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          removeItem: (key: string) => storage.delete(key),
          setItem: (key: string, value: string) => storage.set(key, value),
        },
      },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID = originalClientId;
    process.env.EXPO_OS = originalExpoOs;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
  });

  it('uses the queue endpoint without requiring a subscription profile lookup', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 204 });
    globalThis.fetch = fetchMock;

    await expect(
      queueSpotifySong('https://open.spotify.com/track/track1'),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/player/queue?uri=spotify%3Atrack%3Atrack1',
      { headers: { Authorization: 'Bearer access-token' }, method: 'POST' },
    );
  });

  it('returns the currently playing Spotify track as a normalized song URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: async () => ({ item: { id: 'track1', type: 'track' } }),
      ok: true,
      status: 200,
    });
    globalThis.fetch = fetchMock;

    await expect(getCurrentlyPlayingSpotifySong()).resolves.toBe(
      'https://open.spotify.com/track/track1',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/player?additional_types=track%2Cepisode',
      { headers: { Authorization: 'Bearer access-token' } },
    );
  });

  it('returns no song when Spotify has no active playback', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 204 });

    await expect(getCurrentlyPlayingSpotifySong()).resolves.toBeUndefined();
  });

  it('reports when current playback permission must be granted again', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });

    await expect(getCurrentlyPlayingSpotifySong()).rejects.toMatchObject({ kind: 'permission' });
  });
});
