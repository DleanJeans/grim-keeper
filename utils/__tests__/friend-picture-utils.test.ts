jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));
jest.mock('expo-file-system', () => ({ File: { pickFileAsync: jest.fn() } }));

import {
  getFriendPicture,
  getFriendPictureLookup,
  getSocialPictureSource,
  parsePictureUrl,
} from '@/utils/friend-picture-utils';

describe('getSocialPictureSource', () => {
  it.each([
    ['https://www.facebook.com/zuck', 'Facebook', 'https://unavatar.io/facebook/zuck'],
    ['facebook.com/profile.php?id=1234', 'Facebook', 'https://unavatar.io/facebook/1234'],
    ['instagram.com/someone/', 'Instagram', 'https://unavatar.io/instagram/someone'],
    ['https://twitter.com/jack', 'X', 'https://unavatar.io/x/jack'],
    ['https://t.me/durov', 'Telegram', 'https://unavatar.io/telegram/durov'],
    ['https://www.tiktok.com/@khaby.lame', 'TikTok', 'https://unavatar.io/tiktok/khaby.lame'],
    ['https://bsky.app/profile/pfrazee.com', 'Bluesky', 'https://unavatar.io/bluesky/pfrazee.com'],
    ['https://wa.me/34660021551', 'WhatsApp', 'https://unavatar.io/whatsapp/phone:34660021551'],
    ['+84 912 345 678', 'WhatsApp', 'https://unavatar.io/whatsapp/phone:84912345678'],
    ['dj@example.com', 'Gravatar', 'https://unavatar.io/gravatar/dj%40example.com'],
  ])('reads %s', (input, label, url) => {
    expect(getSocialPictureSource(input)).toEqual({ label, url });
  });

  it.each([
    '',
    'just a name',
    'https://example.com/me',
    'https://www.facebook.com/',
  ])('ignores %p', (input) => {
    expect(getSocialPictureSource(input)).toBeUndefined();
  });
});

describe('getFriendPicture', () => {
  it('prefers the picture chosen by hand', () => {
    expect(getFriendPicture({ picture: 'a', socialPicture: 'b' })).toBe('a');
    expect(getFriendPicture({ socialPicture: 'b' })).toBe('b');
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
  });
});
