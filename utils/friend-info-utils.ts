import type { Friend } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { COUNTRIES } from '@/utils/countries';

const MIN_BIRTH_YEAR = 1900;
const REGIONAL_INDICATOR_BASE = 0x1f1e6 - 'A'.charCodeAt(0);

export type FriendInfo = Pick<Friend, 'birthYear' | 'country'>;

/** A typed birth year as a number, or undefined if it is empty or not a plausible year. */
export function parseBirthYear(input: string, currentYear = new Date().getFullYear()) {
  const text = input.trim();
  if (!/^\d{4}$/.test(text)) {
    return undefined;
  }
  const year = Number(text);
  return year >= MIN_BIRTH_YEAR && year <= currentYear ? year : undefined;
}

/** The last two digits of a birth year, as shown on the token. */
export function formatBirthYearShort(year: number) {
  return String(year % 100).padStart(2, '0');
}

export function getCountryName(code: string | undefined) {
  return COUNTRIES.find((country) => country.code === code)?.name;
}

/** The flag emoji of a country code (two regional indicator symbols). */
export function getCountryFlagEmoji(code: string) {
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split('')
      .map((letter) => REGIONAL_INDICATOR_BASE + letter.charCodeAt(0)),
  );
}

/** Birth year and country by friend id and by lower-cased name, for players on the map. */
export function getFriendInfoLookup(friends: Friend[]) {
  const byId = new Map<string, FriendInfo>();
  const byName = new Map<string, FriendInfo>();
  for (const friend of friends) {
    if (friend.birthYear || friend.country) {
      const info = { birthYear: friend.birthYear, country: friend.country };
      byId.set(friend.id, info);
      byName.set(normalizePlayerName(friend.name).toLocaleLowerCase(), info);
    }
  }
  return (player: { id: string; name: string }): FriendInfo | undefined =>
    byId.get(player.id) ?? byName.get(normalizePlayerName(player.name).toLocaleLowerCase());
}
