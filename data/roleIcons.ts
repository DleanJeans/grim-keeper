/**
 * Blood on the Clocktower official character icons.
 * URL format: https://release.botc.app/resources/characters/{edition}/{id}_{alignment}.webp
 *
 * Dynamically loads from roles.json when available, falls back to static mapping.
 */

const BASE = 'https://release.botc.app/resources/characters';
const ROLES_URL = 'https://release.botc.app/resources/data/roles.json';
const NIGHTSHEET_URL =
  'https://release.botc.app/resources/data/nightsheet.json';
const CACHE_KEY = 'grim-keeper-role-data';

import { platformGetItem, platformSetItem } from '../utils/platformStorage';

// ── Module-level dynamic cache ──
let _dynamicRoles: any[] | null = null;
let _dynamicNightsheet: {
  firstNight: string[];
  otherNight: string[];
} | null = null;
let _editionMap: Record<string, string> = {};

// Try loading from cache synchronously at module init
function initFromCache() {
  try {
    const raw = platformGetItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      _dynamicRoles = cached.roles;
      _dynamicNightsheet = cached.nightsheet;
      buildEditionMap();
    }
  } catch {}
}
initFromCache();

/**
 * Preload role data from the official API. Call once at app startup.
 * Caches in localStorage for offline use.
 */
export async function preloadRoleData(): Promise<void> {
  const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
  const headers = {
    'User-Agent': UA,
  };

  // Try cache first
  try {
    const raw = platformGetItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (Date.now() - cached.ts < 86400000) {
        // 24h TTL
        _dynamicRoles = cached.roles;
        _dynamicNightsheet = cached.nightsheet;
        buildEditionMap();
        return;
      }
    }
  } catch {}

  // Fetch from API
  try {
    const [rolesRes, nightRes] = await Promise.all([
      fetch(ROLES_URL, {
        headers,
      }),
      fetch(NIGHTSHEET_URL, {
        headers,
      }),
    ]);
    if (rolesRes.ok && nightRes.ok) {
      _dynamicRoles = await rolesRes.json();
      _dynamicNightsheet = await nightRes.json();
      buildEditionMap();
      // Cache for offline use
      await platformSetItem(
        CACHE_KEY,
        JSON.stringify({
          ts: Date.now(),
          roles: _dynamicRoles,
          nightsheet: _dynamicNightsheet,
        }),
      );
    }
  } catch {
    // Silently use static fallbacks
  }
}

function buildEditionMap() {
  _editionMap = {};
  if (!_dynamicRoles) return;
  for (const role of _dynamicRoles) {
    _editionMap[role.id.toLowerCase()] = role.edition || 'tb';
  }
}

function getEdition(roleId: string): string {
  if (_dynamicRoles) {
    return _editionMap[roleId.toLowerCase()] || 'tb';
  }
  // Static fallback
  const staticMap: Record<string, string> = {
    washerwoman: 'tb',
    librarian: 'tb',
    investigator: 'tb',
    chef: 'tb',
    empath: 'tb',
    fortuneteller: 'tb',
    undertaker: 'tb',
    monk: 'tb',
    soldier: 'tb',
    ravenkeeper: 'tb',
    virgin: 'tb',
    slayer: 'tb',
    mayor: 'tb',
    drunk: 'tb',
    recluse: 'tb',
    saint: 'tb',
    butler: 'tb',
    poisoner: 'tb',
    spy: 'tb',
    scarletwoman: 'tb',
    baron: 'tb',
    imp: 'tb',
    grandmother: 'bmr',
    sailor: 'bmr',
    chambermaid: 'bmr',
    exorcist: 'bmr',
    innkeeper: 'bmr',
    gambler: 'bmr',
    gossip: 'bmr',
    courtier: 'bmr',
    professor: 'bmr',
    minstrel: 'bmr',
    tealady: 'bmr',
    pacifist: 'bmr',
    fool: 'bmr',
    tinker: 'bmr',
    moonchild: 'bmr',
    godfather: 'bmr',
    assassin: 'bmr',
    devilsadvocate: 'bmr',
    mastermind: 'bmr',
    zombuul: 'bmr',
    shabaloth: 'bmr',
    po: 'bmr',
    dreamer: 'snv',
    snakecharmer: 'snv',
    mathematician: 'snv',
    flowergirl: 'snv',
    towncrier: 'snv',
    oracle: 'snv',
    savant: 'snv',
    seamstress: 'snv',
    philosopher: 'snv',
    artist: 'snv',
    juggler: 'snv',
    sage: 'snv',
    mutant: 'snv',
    sweetheart: 'snv',
    barber: 'snv',
    klutz: 'snv',
    eviltwin: 'snv',
    witch: 'snv',
    cerenovus: 'snv',
    pithag: 'snv',
    fanggu: 'snv',
    vigormortis: 'snv',
    nodashii: 'snv',
    vortox: 'snv',
    steward: 'carousel',
    knight: 'carousel',
    noble: 'carousel',
    shugenja: 'carousel',
    pixie: 'carousel',
    bountyhunter: 'carousel',
    highpriestess: 'carousel',
    balloonist: 'carousel',
    general: 'carousel',
    preacher: 'carousel',
    villageidiot: 'carousel',
    king: 'carousel',
    cultleader: 'carousel',
    lycanthrope: 'carousel',
    acrobat: 'carousel',
    alsaahir: 'carousel',
    engineer: 'carousel',
    nightwatchman: 'carousel',
    huntsman: 'carousel',
    fisherman: 'carousel',
    princess: 'carousel',
    amnesiac: 'carousel',
  };
  return staticMap[roleId.toLowerCase()] || 'tb';
}

/**
 * Get the official icon URL for a role.
 */
export function getRoleIconUrl(roleId: string, team: string): string {
  const offId = roleId.toLowerCase();
  const edition = getEdition(offId);
  const suffix =
    team === 'townsfolk' || team === 'outsider'
      ? '_g'
      : team === 'minion' || team === 'demon'
        ? '_e'
        : '';
  return `${BASE}/${edition}/${offId}${suffix}.webp`;
}

/**
 * Get a fallback emoji per team.
 */
export function getTeamEmoji(team: string): string {
  switch (team) {
    case 'townsfolk':
      return '👤';
    case 'outsider':
      return '❓';
    case 'minion':
      return '👹';
    case 'demon':
      return '😈';
    case 'fabled':
      return '⭐';
    case 'traveller':
      return '🧳';
    default:
      return '❓';
  }
}

/**
 * Night order — dynamically loaded with static fallback.
 */
export function getNightOrder(): {
  firstNight: string[];
  otherNight: string[];
} {
  if (_dynamicNightsheet) return _dynamicNightsheet;
  // Static fallback
  return {
    firstNight: [
      'dusk',
      'angel',
      'buddhist',
      'toymaker',
      'stormcatcher',
      'wraith',
      'lordoftyphon',
      'kazali',
      'apprentice',
      'barista',
      'bureaucrat',
      'thief',
      'boffin',
      'philosopher',
      'alchemist',
      'poppygrower',
      'yaggababble',
      'magician',
      'tor',
      'minioninfo',
      'snitch',
      'lunatic',
      'summoner',
      'demoninfo',
      'king',
      'sailor',
      'marionette',
      'engineer',
      'preacher',
      'lilmonsta',
      'lleech',
      'xaan',
      'poisoner',
      'widow',
      'courtier',
      'wizard',
      'snakecharmer',
      'godfather',
      'organgrinder',
      'devilsadvocate',
      'eviltwin',
      'witch',
      'cerenovus',
      'fearmonger',
      'harpy',
      'mezepheles',
      'pukka',
      'pixie',
      'huntsman',
      'damsel',
      'amnesiac',
      'washerwoman',
      'librarian',
      'investigator',
      'chef',
      'empath',
      'fortuneteller',
      'butler',
      'grandmother',
      'clockmaker',
      'dreamer',
      'seamstress',
      'steward',
      'knight',
      'noble',
      'balloonist',
      'shugenja',
      'villageidiot',
      'bountyhunter',
      'nightwatchman',
      'cultleader',
      'spy',
      'ogre',
      'highpriestess',
      'general',
      'chambermaid',
      'mathematician',
      'dawn',
      'leviathan',
      'vizier',
    ],
    otherNight: [
      'dusk',
      'duchess',
      'toymaker',
      'wraith',
      'cacklejack',
      'barista',
      'bureaucrat',
      'thief',
      'harlot',
      'bonecollector',
      'philosopher',
      'poppygrower',
      'sailor',
      'engineer',
      'preacher',
      'xaan',
      'poisoner',
      'courtier',
      'innkeeper',
      'wizard',
      'gambler',
      'acrobat',
      'snakecharmer',
      'monk',
      'organgrinder',
      'devilsadvocate',
      'witch',
      'cerenovus',
      'pithag',
      'fearmonger',
      'harpy',
      'mezepheles',
      'scarletwoman',
      'summoner',
      'lunatic',
      'exorcist',
      'lycanthrope',
      'princess',
      'legion',
      'imp',
      'zombuul',
      'pukka',
      'shabaloth',
      'po',
      'fanggu',
      'nodashii',
      'vortox',
      'lordoftyphon',
      'vigormortis',
      'ojo',
      'alhadikhia',
      'lleech',
      'lilmonsta',
      'yaggababble',
      'kazali',
      'assassin',
      'godfather',
      'gossip',
      'hatter',
      'barber',
      'sweetheart',
      'plaguedoctor',
      'sage',
      'banshee',
      'professor',
      'choirboy',
      'huntsman',
      'damsel',
      'amnesiac',
      'farmer',
      'tinker',
      'moonchild',
      'grandmother',
      'tor',
      'ravenkeeper',
      'empath',
      'fortuneteller',
      'undertaker',
      'dreamer',
      'flowergirl',
      'towncrier',
      'oracle',
      'seamstress',
      'juggler',
      'balloonist',
      'villageidiot',
      'king',
      'bountyhunter',
      'nightwatchman',
      'cultleader',
      'butler',
      'spy',
      'highpriestess',
      'general',
      'chambermaid',
      'mathematician',
      'riot',
      'dawn',
      'leviathan',
    ],
  };
}

// Re-export for backward compatibility
export const NIGHT_ORDER = getNightOrder();

export function toOfficialRoleId(id: string): string {
  return id.toLowerCase();
}

/**
 * Returns the full roles array from the dynamic load (or empty if not loaded yet).
 */
export function getDynamicRoles(): any[] {
  return _dynamicRoles || [];
}

/**
 * Get all unique editions from dynamic roles.
 */
export function getDynamicEditions(): string[] {
  if (!_dynamicRoles) return [];
  const editions = new Set<string>();
  for (const role of _dynamicRoles) {
    if (role.edition) editions.add(role.edition);
  }
  return Array.from(editions).sort();
}
