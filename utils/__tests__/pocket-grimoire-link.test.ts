import { pocketGrimoireLinkToScriptJson } from '@/utils/pocket-grimoire-link';

describe('pocketGrimoireLinkToScriptJson', () => {
  it('reads the characters of a sheet link', () => {
    const link =
      'https://www.pocketgrimoire.co.uk/en_GB/sheet?characters=noble%2Cwasherwoman%2Cimp%2Cimp';

    expect(JSON.parse(pocketGrimoireLinkToScriptJson(link) ?? '')).toEqual([
      { id: '_meta', name: 'Pocket Grimoire script' },
      'noble',
      'washerwoman',
      'imp',
    ]);
  });

  it('uses the link name or the fallback name', () => {
    const link = 'https://www.pocketgrimoire.co.uk/en_GB/sheet?characters=imp';

    expect(pocketGrimoireLinkToScriptJson(`${link}&name=Mine`)).toContain('"Mine"');
    expect(pocketGrimoireLinkToScriptJson(link, 'Custom')).toContain('"Custom"');
  });

  it('ignores anything else', () => {
    expect(pocketGrimoireLinkToScriptJson('[]')).toBeNull();
    expect(pocketGrimoireLinkToScriptJson('https://example.com/sheet?characters=imp')).toBeNull();
    expect(
      pocketGrimoireLinkToScriptJson('https://www.pocketgrimoire.co.uk/en_GB/sheet'),
    ).toBeNull();
  });
});
