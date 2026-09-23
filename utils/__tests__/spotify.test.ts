import { parseSpotifySong, parseYouTubeVideoId, resolveDjSongMetadata } from '@/utils/spotify';

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
