jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));
jest.mock('expo-file-system', () => ({ File: { pickFileAsync: jest.fn() } }));

import {
  getFriendPicture,
  getFriendPictureLookup,
  parsePictureUrl,
} from '@/utils/friend-picture-utils';

describe('getFriendPicture', () => {
  it('returns the friend picture, if any', () => {
    expect(getFriendPicture({ picture: 'a' })).toBe('a');
    expect(getFriendPicture({})).toBeUndefined();
    expect(getFriendPicture(undefined)).toBeUndefined();
  });

  it('looks players up by id, then by name', () => {
    const lookup = getFriendPictureLookup([
      { createdAt: '', id: 'ann', name: 'Ann', picture: 'ann.jpg' },
      { createdAt: '', id: 'bob', name: 'Bob' },
    ]);
    expect(lookup({ id: 'ann', name: 'Whoever' })).toBe('ann.jpg');
    expect(lookup({ id: 'player-1', name: ' ann ' })).toBe('ann.jpg');
    expect(lookup({ id: 'bob', name: 'Bob' })).toBeUndefined();
  });
});

describe('parsePictureUrl', () => {
  it('accepts web and data image links only', () => {
    expect(parsePictureUrl('https://x.test/a.png')).toBe('https://x.test/a.png');
    expect(parsePictureUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
    expect(parsePictureUrl('javascript:alert(1)')).toBeUndefined();
    expect(parsePictureUrl('just text')).toBeUndefined();
  });
});
