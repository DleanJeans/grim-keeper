import {
  formatBirthYearShort,
  getCountryFlagEmoji,
  getFriendInfoLookup,
  parseBirthYear,
} from '@/utils/friend-info-utils';

describe('friend info', () => {
  it('parses plausible four-digit years only', () => {
    expect(parseBirthYear('1995', 2026)).toBe(1995);
    expect(parseBirthYear('95', 2026)).toBeUndefined();
    expect(parseBirthYear('2999', 2026)).toBeUndefined();
    expect(parseBirthYear('1800', 2026)).toBeUndefined();
    expect(parseBirthYear('', 2026)).toBeUndefined();
  });

  it('shows the last two digits with a leading zero', () => {
    expect(formatBirthYearShort(1995)).toBe('95');
    expect(formatBirthYearShort(2005)).toBe('05');
  });

  it('builds flag emoji from country codes', () => {
    expect(getCountryFlagEmoji('VN')).toBe('🇻🇳');
  });

  it('looks players up by id, then by name', () => {
    const lookup = getFriendInfoLookup([
      { createdAt: '', id: 'a', name: 'Linh', birthYear: 1995, country: 'VN' },
      { createdAt: '', id: 'b', name: 'Sam' },
    ]);
    expect(lookup({ id: 'a', name: 'x' })).toEqual({ birthYear: 1995, country: 'VN' });
    expect(lookup({ id: 'z', name: 'linh' })?.country).toBe('VN');
    expect(lookup({ id: 'b', name: 'Sam' })).toBeUndefined();
  });
});
