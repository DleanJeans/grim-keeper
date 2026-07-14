import { createStoredScript, type RemoteScript } from '@/utils/script-service';

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
        'script-42',
      ),
    ).toMatchObject({
      id: 'script-42',
      remoteId: 42,
      name: 'Trouble Brewing',
      roles: [{ id: 'imp', name: 'Imp', team: 'demon', edition: 'tb' }],
    });
  });
});
