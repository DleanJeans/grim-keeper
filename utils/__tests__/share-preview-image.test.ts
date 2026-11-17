import { decodeSharedGame, encodeSharedGame, type SharedGame } from '@/utils/share-game-codec';
import { createSharePreviewPng } from '@/utils/share-preview-image';

const sharedGame: SharedGame = {
  c: '2026-11-15T19:00:00.000Z',
  h: 500,
  p: [
    ['DJ', 0, 250, 455],
    ['Alice Smith', 1, 455, 250],
    ['Alice Jones', 2, 250, 45],
    ['Đức', 3, 45, 250],
    ['山田', 4, 150, 150],
    ['Story', -1, 250, 250, 1],
  ],
  r: { id: 'trouble-brewing', remoteId: 178 },
  v: 2,
  w: 500,
};

describe('share preview image', () => {
  it('draws a PNG for a game, including names the fonts cannot spell', () => {
    const png = createSharePreviewPng(decodeSharedGame(encodeSharedGame(sharedGame)));
    const view = new DataView(png.buffer, png.byteOffset);

    expect(Array.from(png.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(view.getUint32(16)).toBe(1200);
    expect(view.getUint32(20)).toBe(630);
    expect(png.length).toBeGreaterThan(5000);
  });
});
