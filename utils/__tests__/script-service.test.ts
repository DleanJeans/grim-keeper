import {
  createOfficialCarouselScript,
  createStoredScript,
  fetchOfficialRemoteScripts,
  OFFICIAL_CAROUSEL_SCRIPT_ID,
  type RemoteScript,
} from '@/utils/script-service';

describe('script service', () => {
  it('creates a stored script with role metadata merged from the catalog', () => {
    const remoteScript: RemoteScript = {
      pk: 42,
      name: 'Trouble Brewing',
      version: '1.0.0',
      scriptType: 'Full',
      author: 'The Storyteller',
      content: [],
    };

    expect(
      createStoredScript(
        remoteScript,
        [{ id: '_meta', name: 'Trouble Brewing' }, { id: 'imp' }],
        [{ id: 'imp', name: 'Imp', team: 'demon', edition: 'tb' }],
      ),
    ).toMatchObject({
      id: '42-trouble-brewing',
      remoteId: 42,
      name: 'Trouble Brewing',
      roles: [{ id: 'imp', name: 'Imp', team: 'demon', edition: 'tb' }],
    });
  });

  it('loads only the official base scripts from BotC Scripts', async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            pk: 178,
            name: 'Trouble Brewing',
            version: '1.0.0',
            script_type: 'Full',
            author: 'The Pandemonium Institute',
            content: [],
          },
          {
            pk: 180,
            name: 'Sects and Violets',
            version: '1.0.0',
            script_type: 'Full',
            author: 'The Pandemonium Institute',
            content: [],
          },
          {
            pk: 181,
            name: 'Bad Moon Rising',
            version: '1.0.0',
            script_type: 'Full',
            author: 'The Pandemonium Institute',
            content: [],
          },
          {
            pk: 84,
            name: 'No Greater Joy',
            version: '1.0.0',
            script_type: 'Teensyville',
            author: 'Steven Medway',
            content: [],
          },
        ],
      }),
    } as unknown as Response);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await expect(fetchOfficialRemoteScripts()).resolves.toMatchObject([
        { pk: 178, name: 'Trouble Brewing' },
        { pk: 180, name: 'Sects and Violets' },
        { pk: 181, name: 'Bad Moon Rising' },
      ]);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('author=The%20Pandemonium%20Institute'),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('builds the fourth official script from Carousel role metadata', () => {
    expect(
      createOfficialCarouselScript([
        { id: 'steward', name: 'Steward', edition: 'carousel' },
        { id: 'imp', name: 'Imp', edition: 'tb' },
      ]),
    ).toMatchObject({
      id: OFFICIAL_CAROUSEL_SCRIPT_ID,
      name: 'Carousel',
      roles: [{ id: 'steward', name: 'Steward', edition: 'carousel' }],
    });
  });
});
