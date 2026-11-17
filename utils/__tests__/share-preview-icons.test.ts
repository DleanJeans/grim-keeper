import { zlibSync } from 'fflate';

import type { SharedGame } from '@/utils/share-game-codec';
import { decodePng, loadPreviewIcons } from '@/utils/share-preview-icons';
import { createSharePreviewPng } from '@/utils/share-preview-image';

const sharedGame: SharedGame = {
  c: '2026-11-15T19:00:00.000Z',
  h: 500,
  p: [
    ['DJ', 0, 250, 455],
    ['Alice', 1, 455, 250],
    ['Bob', 2, 250, 45],
    ['Story', -1, 250, 250, 1],
  ],
  r: { id: 'trouble-brewing', remoteId: 178 },
  v: 2,
  w: 500,
};

function makePng(width: number, height: number, pixel: [number, number, number, number]) {
  const rows: number[] = [];
  for (let row = 0; row < height; row += 1) {
    rows.push(row % 2 === 0 ? 0 : 1);
    for (let column = 0; column < width; column += 1) {
      // Odd rows use the Sub filter, so only the first pixel carries the colour.
      rows.push(...(row % 2 === 0 || column === 0 ? pixel : [0, 0, 0, 0]));
    }
  }
  const header = new Uint8Array(13);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, width);
  headerView.setUint32(4, height);
  header[8] = 8;
  header[9] = 6;
  const chunk = (type: string, data: Uint8Array) => {
    const bytes = new Uint8Array(12 + data.length);
    new DataView(bytes.buffer).setUint32(0, data.length);
    bytes.set(
      Array.from(type, (letter) => letter.charCodeAt(0)),
      4,
    );
    bytes.set(data, 8);
    return bytes;
  };
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlibSync(new Uint8Array(rows))),
    chunk('IEND', new Uint8Array(0)),
  ];
  const png = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value));
}

describe('share preview icons', () => {
  it('decodes a PNG with sub filtered rows', () => {
    const icon = decodePng(makePng(3, 2, [10, 20, 30, 255]));

    expect(icon.width).toBe(3);
    expect(Array.from(icon.rgba.subarray(0, 4))).toEqual([10, 20, 30, 255]);
    expect(Array.from(icon.rgba.subarray(16, 20))).toEqual([10, 20, 30, 255]);
    expect(Array.from(icon.rgba.subarray(20, 24))).toEqual([10, 20, 30, 255]);
  });

  it('loads the icons of a script sent by id and draws them into the picture', async () => {
    const icon = makePng(8, 8, [200, 30, 30, 255]);
    const fetched: string[] = [];
    const fetchImpl = async (url: string) => {
      fetched.push(url);
      if (url.includes('botcscripts.com')) {
        return jsonResponse([{ id: '_meta', name: 'TB' }, 'washerwoman', { id: 'imp' }, 'ghost']);
      }
      if (url.includes('roles.json')) {
        return jsonResponse([
          { id: 'washerwoman', image: '/resources/characters/tb/washerwoman_g.webp' },
          { id: 'imp', image: ['https://release.botc.app/resources/characters/tb/imp_e.webp'] },
        ]);
      }
      return new Response(icon);
    };

    const { icons, note } = await loadPreviewIcons(sharedGame, fetchImpl);
    const png = createSharePreviewPng(sharedGame, icons);
    const plain = createSharePreviewPng(sharedGame);

    expect(note).toContain('2 of 2 icons loaded');
    expect(icons).toHaveLength(2);
    expect(fetched.filter((url) => url.startsWith('https://wsrv.nl/'))).toHaveLength(2);
    expect(fetched.join(' ')).toContain(
      encodeURIComponent('https://release.botc.app/resources/characters/tb/washerwoman_g.webp'),
    );
    expect(png).not.toEqual(plain);
  });

  it('leaves icons out when anything fails', async () => {
    const failing = async () => new Response('no', { status: 500 });

    await expect(loadPreviewIcons(sharedGame, failing)).resolves.toMatchObject({ icons: [] });
    await expect(
      loadPreviewIcons({ ...sharedGame, r: undefined, su: ['imp'] }, failing),
    ).resolves.toEqual({ icons: [], note: 'no script to list' });
  });
});
