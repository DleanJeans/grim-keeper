import type {
  Conversation,
  GamePhase,
  Player,
  PlayerDayNote,
  Role,
  RoleInfoEntry,
} from '@/types/game';
import { getDeathPhase, getEventPhaseIndex } from '@/utils/game-phase-utils';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';
import { getRoleDisplayForDayOrPrevious } from '@/utils/role-utils';

export type RoleInfoRoleFilter =
  | 'any'
  | 'demon'
  | 'evil'
  | 'good'
  | 'minion'
  | 'outsider'
  | 'townsfolk';

type RoleInfoSlotBase = { id: string; label: string };

export type RoleInfoSlot =
  | (RoleInfoSlotBase & { kind: 'player' })
  | (RoleInfoSlotBase & { kind: 'role'; filter: RoleInfoRoleFilter })
  | (RoleInfoSlotBase & { kind: 'number'; max: number; min: number })
  | (RoleInfoSlotBase & { kind: 'choice'; choices: string[] })
  | (RoleInfoSlotBase & { kind: 'text' });

export type RoleInfoTemplate = {
  /** Show the alive neighbors of the role's owner for each phase. */
  autoNeighbors?: boolean;
  /** Show the player executed the day before each night. */
  autoExecuted?: boolean;
  slots: RoleInfoSlot[];
};

type SlotSpec = DistributiveOmit<RoleInfoSlot, 'id'>;
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

const YES_NO = ['Yes', 'No'];
const GOOD_EVIL = ['Good', 'Evil'];

const player = (label = 'Player'): SlotSpec => ({ kind: 'player', label });
const role = (label: string, filter: RoleInfoRoleFilter = 'any'): SlotSpec => ({
  filter,
  kind: 'role',
  label,
});
const num = (label: string, max: number, min = 0): SlotSpec => ({
  kind: 'number',
  label,
  max,
  min,
});
const yesNo = (label: string): SlotSpec => ({ choices: YES_NO, kind: 'choice', label });
const choice = (label: string, choices: string[]): SlotSpec => ({ choices, kind: 'choice', label });
const text = (label: string): SlotSpec => ({ kind: 'text', label });

const learnsPair = (filter: RoleInfoRoleFilter, label: string) => [
  role(label, filter),
  player('Player 1'),
  player('Player 2'),
];

/** Keyed by normalized role id (lowercase letters only). Empty lists are passive roles. */
type RoleInfoSpec = SlotSpec[] | { executed?: true; neighbors?: true; slots: SlotSpec[] };

const ROLE_INFO_SPECS: Record<string, RoleInfoSpec> = {
  // Trouble Brewing — Townsfolk
  washerwoman: learnsPair('townsfolk', 'Townsfolk'),
  librarian: learnsPair('outsider', 'Outsider'),
  investigator: learnsPair('minion', 'Minion'),
  chef: [num('Pairs', 6)],
  empath: { neighbors: true, slots: [num('Evil', 2)] },
  fortuneteller: [player('Player 1'), player('Player 2'), yesNo('Demon?')],
  undertaker: { executed: true, slots: [role('Executed')] },
  monk: [player('Protected')],
  ravenkeeper: [player('Chosen'), role('Character')],
  virgin: [player('Nominator'), yesNo('Executed?')],
  slayer: [player('Shot'), yesNo('Died?')],
  soldier: [],
  mayor: [],
  // Trouble Brewing — Outsiders
  butler: [player('Master')],
  drunk: [],
  recluse: [],
  saint: [],
  // Trouble Brewing — Minions
  poisoner: [player('Poisoned')],
  spy: [text('Grimoire')],
  scarletwoman: [],
  baron: [],
  // Trouble Brewing — Demon
  imp: [player('Killed')],

  // Bad Moon Rising — Townsfolk
  grandmother: [player('Grandchild'), role('Character', 'good')],
  sailor: [player('Drinking with')],
  chambermaid: [player('Player 1'), player('Player 2'), num('Woke', 2)],
  exorcist: [player('Chosen')],
  innkeeper: [player('Protected 1'), player('Protected 2')],
  gambler: [player('Player'), role('Guess')],
  gossip: [text('Statement'), yesNo('Died?')],
  courtier: [role('Drunk')],
  professor: [player('Revived')],
  minstrel: [],
  tealady: { neighbors: true, slots: [] },
  pacifist: [],
  fool: [],
  // Bad Moon Rising — Outsiders
  tinker: [],
  moonchild: [player('Chosen')],
  goon: [],
  lunatic: [player('Attacked')],
  // Bad Moon Rising — Minions
  godfather: [role('Outsider 1', 'outsider'), role('Outsider 2', 'outsider'), player('Killed')],
  devilsadvocate: [player('Protected')],
  assassin: [player('Killed')],
  mastermind: [],
  // Bad Moon Rising — Demons
  zombuul: [player('Killed')],
  pukka: [player('Poisoned')],
  shabaloth: [player('Killed 1'), player('Killed 2'), player('Regurgitated')],
  po: [player('Killed 1'), player('Killed 2'), player('Killed 3')],

  // Sects & Violets — Townsfolk
  clockmaker: [num('Steps', 10, 1)],
  dreamer: [player('Player'), role('Good', 'good'), role('Evil', 'evil')],
  snakecharmer: [player('Chosen'), yesNo('Demon?')],
  mathematician: [num('Abnormal', 10)],
  flowergirl: [yesNo('Demon voted?')],
  towncrier: [yesNo('Minion nominated?')],
  oracle: [num('Dead evil', 10)],
  savant: [text('Statement 1'), text('Statement 2')],
  seamstress: [player('Player 1'), player('Player 2'), yesNo('Same team?')],
  philosopher: [role('Became', 'good')],
  artist: [text('Question'), yesNo('Answer')],
  juggler: [
    player('Player 1'),
    role('Guess 1'),
    player('Player 2'),
    role('Guess 2'),
    num('Correct', 5),
  ],
  sage: [player('Player 1'), player('Player 2')],
  // Sects & Violets — Outsiders
  mutant: [],
  sweetheart: [],
  barber: [player('Swap 1'), player('Swap 2')],
  klutz: [player('Chosen')],
  // Sects & Violets — Minions
  eviltwin: [player('Twin'), role('Twin character', 'good')],
  witch: [player('Cursed')],
  cerenovus: [player('Mad'), role('Mad as', 'good')],
  pithag: [player('Changed'), role('Into')],
  // Sects & Violets — Demons
  fanggu: [player('Killed')],
  vigormortis: [player('Killed')],
  nodashii: { neighbors: true, slots: [player('Killed')] },
  vortox: [player('Killed')],

  // Experimental & Carousel — Townsfolk
  acrobat: [player('Chosen')],
  alchemist: [role('Minion ability', 'minion')],
  alsaahir: [text('Guess')],
  amnesiac: [text('Ability'), text('Guess')],
  atheist: [],
  balloonist: [player('Player'), role('Type')],
  banshee: [],
  bountyhunter: [player('Evil')],
  cannibal: [role('Ability')],
  choirboy: [player('Demon')],
  cultleader: [choice('Alignment', GOOD_EVIL)],
  engineer: [role('Changed to', 'evil')],
  farmer: [player('New Farmer')],
  fisherman: [text('Advice')],
  general: [choice('Winning', ['Good', 'Evil', 'Neither'])],
  highpriestess: [player('Speak with')],
  huntsman: [player('Chosen'), yesNo('Damsel?')],
  king: [role('Alive character')],
  knight: [player('Not Demon 1'), player('Not Demon 2')],
  lycanthrope: [player('Killed')],
  magician: [],
  nightwatchman: [player('Learns')],
  noble: [player('Player 1'), player('Player 2'), player('Player 3')],
  pixie: [role('Mad as', 'townsfolk')],
  poppygrower: [],
  preacher: [player('Chosen'), yesNo('Minion?')],
  princess: [],
  shugenja: [choice('Nearest evil', ['Clockwise', 'Anticlockwise'])],
  steward: [player('Good player')],
  villageidiot: [player('Chosen'), choice('Alignment', GOOD_EVIL)],
  bonecollector: [player('Chosen'), role('Ability')],
  // Experimental & Carousel — Outsiders
  damsel: [],
  golem: [player('Nominated')],
  hatter: [],
  heretic: [],
  hermit: [],
  ogre: [player('Friend')],
  plaguedoctor: [],
  politician: [],
  puzzlemaster: [player('Guess'), player('Demon')],
  snitch: [role('Bluff 1'), role('Bluff 2'), role('Bluff 3')],
  zealot: [],
  // Experimental & Carousel — Minions
  boffin: [role('Ability', 'good')],
  boomdandy: [],
  fearmonger: [player('Chosen')],
  goblin: [],
  harpy: [player('Mad'), player('Accused')],
  marionette: [],
  mezepheles: [text('Secret word'), player('Said it')],
  organgrinder: [],
  psychopath: [player('Killed')],
  summoner: [player('Demon'), role('Demon', 'demon')],
  vizier: [],
  widow: [player('Poisoned')],
  wizard: [text('Wish')],
  wraith: [],
  xaan: [num('X', 10, 1)],
  // Experimental & Carousel — Demons
  alhadikhia: [player('Chosen 1'), player('Chosen 2'), player('Chosen 3')],
  kazali: [player('Minion 1'), player('Minion 2')],
  legion: [],
  leviathan: [],
  lilmonsta: [player('Babysitter'), player('Killed')],
  lleech: [player('Host'), player('Killed')],
  lordoftyphon: [player('Killed')],
  ojo: [role('Chosen'), player('Killed')],
  riot: [],
  yaggababble: [text('Phrase'), num('Said', 10)],

  // Travellers
  apprentice: [role('Ability', 'good')],
  barista: [player('Chosen'), choice('Effect', ['Sober', 'Ability twice'])],
  beggar: [player('Gave vote')],
  bishop: [],
  bureaucrat: [player('3 votes')],
  butcher: [],
  cacklejack: [player('Chosen'), role('Changed to')],
  deviant: [],
  gangster: [player('Killed')],
  gnome: [player('Amigo')],
  gunslinger: [player('Shot')],
  harlot: [player('Visited'), role('Character')],
  judge: [player('Pardoned')],
  matron: [],
  scapegoat: [],
  thief: [player('Negative vote')],
  voudon: [],
};

const FALLBACK_TEMPLATE: RoleInfoTemplate = {
  slots: withSlotIds([player('Player'), text('Info')]),
};

const ROLE_INFO_TEMPLATES: Record<string, RoleInfoTemplate> = Object.fromEntries(
  Object.entries(ROLE_INFO_SPECS).map(([roleId, spec]) => [
    roleId,
    Array.isArray(spec)
      ? { slots: withSlotIds(spec) }
      : {
          autoExecuted: spec.executed,
          autoNeighbors: spec.neighbors,
          slots: withSlotIds(spec.slots),
        },
  ]),
);

const NUMBER_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
];

/** Characters whose info is learned on the first night only. */
const START_KNOWING_ROLE_IDS = new Set([
  'chef',
  'clockmaker',
  'grandmother',
  'investigator',
  'knight',
  'librarian',
  'noble',
  'pixie',
  'shugenja',
  'snitch',
  'steward',
  'washerwoman',
  'widow',
]);

/** Characters that wake every night (including the first) and learn or choose something new. */
const EVERY_NIGHT_ROLE_IDS = new Set([
  'balloonist',
  'butler',
  'cerenovus',
  'chambermaid',
  'cultleader',
  'devilsadvocate',
  'dreamer',
  'empath',
  'fearmonger',
  'fortuneteller',
  'general',
  'harpy',
  'highpriestess',
  'lilmonsta',
  'mathematician',
  'poisoner',
  'preacher',
  'pukka',
  'sailor',
  'snakecharmer',
  'villageidiot',
  'witch',
]);

/** Characters whose ability works only once per game, so they get a single row. */
const ONCE_ROLE_IDS = new Set([
  'artist',
  'assassin',
  'bonecollector',
  'choirboy',
  'courtier',
  'engineer',
  'fisherman',
  'huntsman',
  'nightwatchman',
  'philosopher',
  'professor',
  'ravenkeeper',
  'seamstress',
  'slayer',
  'virgin',
  'wizard',
]);

/** Characters that act each night except the first (night* on the night sheet). */
const OTHER_NIGHTS_ROLE_IDS = new Set([
  'acrobat',
  'alhadikhia',
  'assassin',
  'bonecollector',
  'choirboy',
  'exorcist',
  'fanggu',
  'flowergirl',
  'gambler',
  'gossip',
  'imp',
  'innkeeper',
  'king',
  'lordoftyphon',
  'lycanthrope',
  'monk',
  'nodashii',
  'ojo',
  'oracle',
  'pithag',
  'po',
  'professor',
  'ravenkeeper',
  'shabaloth',
  'towncrier',
  'undertaker',
  'vigormortis',
  'vortox',
  'zombuul',
]);

const goodTeams = new Set(['townsfolk', 'outsider']);
const evilTeams = new Set(['minion', 'demon']);

export function normalizeRoleInfoId(roleId: string) {
  return roleId.toLocaleLowerCase().replace(/[^a-z]/g, '');
}

/** Known characters get their own template; homebrew characters fall back to Player + Info. */
export function getRoleInfoTemplate(role: Pick<Role, 'id'>): RoleInfoTemplate {
  return ROLE_INFO_TEMPLATES[normalizeRoleInfoId(role.id)] ?? FALLBACK_TEMPLATE;
}

export function hasRoleInfo(role: Pick<Role, 'id'>) {
  const template = getRoleInfoTemplate(role);
  return template.slots.length > 0 || template.autoNeighbors === true;
}

/**
 * Start-knowing characters only show on the first night and day; characters that act on other
 * nights only show after them.
 */
export function isRoleInfoShownInPhase(role: Pick<Role, 'id'>, day: number) {
  const roleId = normalizeRoleInfoId(role.id);
  if (START_KNOWING_ROLE_IDS.has(roleId)) return day <= 1;
  if (OTHER_NIGHTS_ROLE_IDS.has(roleId)) return day > 1;
  return true;
}

/**
 * Nights to show one row each for, up to the given day's night, for characters that act every
 * night; undefined for characters shown as a single row. Nights after all of the character's
 * players died are left out, since dead players get no more info.
 */
export function getRoleInfoNights(
  role: Pick<Role, 'id'>,
  day: number,
  owners: Player[] = [],
): number[] | undefined {
  const roleId = normalizeRoleInfoId(role.id);
  const isOtherNights = OTHER_NIGHTS_ROLE_IDS.has(roleId) && !ONCE_ROLE_IDS.has(roleId);
  if (!isOtherNights && !EVERY_NIGHT_ROLE_IDS.has(roleId)) return undefined;

  const firstNight = isOtherNights ? 2 : 1;
  return Array.from(
    { length: Math.max(0, day - firstNight + 1) },
    (_, index) => firstNight + index,
  ).filter((night) => !areAllDead(owners, night, 'night'));
}

/**
 * The first phase a once-per-game character's info was recorded in, meaning its ability was used;
 * undefined for other characters or before it is used.
 */
export function getRoleInfoUsedPhase(role: Pick<Role, 'id'>, roleInfos: RoleInfoEntry[]) {
  if (!ONCE_ROLE_IDS.has(normalizeRoleInfoId(role.id))) return undefined;

  return roleInfos
    .filter((entry) => entry.roleId === role.id && Object.keys(entry.values).length > 0)
    .sort(
      (first, second) =>
        getEventPhaseIndex(first.day, first.phase) - getEventPhaseIndex(second.day, second.phase),
    )[0];
}

/** Whether an every-night character's players are all dead, so it gets no more info. */
export function isRoleInfoOver(
  role: Pick<Role, 'id'>,
  owners: Player[],
  day: number,
  phase: GamePhase,
) {
  return getRoleInfoNights(role, day) !== undefined && areAllDead(owners, day, phase);
}

/** Players who ever claimed or were confirmed as the role, by seat. */
export function getRoleClaimers(players: Player[], roleId: string) {
  const claimerIds = getRoleClaimerIds(players, roleId);
  return players
    .filter((candidate) => claimerIds.has(candidate.id))
    .sort((first, second) => first.seat - second.seat);
}

/** Characters anyone has claimed, been confirmed as or been rumored as at any point. */
export function getMentionedRoleIds(players: Player[]) {
  return new Set(
    players.flatMap((candidate) =>
      (candidate.roleAssignments ?? [])
        .filter((assignment) => assignment.kind !== 'guess')
        .flatMap((assignment) => assignment.roleIds),
    ),
  );
}

export function getRolesForInfoSlot(roles: Role[], filter: RoleInfoRoleFilter) {
  return roles.filter((candidate) => {
    const team = candidate.team?.toLocaleLowerCase() ?? '';
    switch (filter) {
      case 'any':
        return goodTeams.has(team) || evilTeams.has(team);
      case 'good':
        return goodTeams.has(team);
      case 'evil':
        return evilTeams.has(team);
      default:
        return team === filter;
    }
  });
}

export function getNumberChoices(slot: Extract<RoleInfoSlot, { kind: 'number' }>) {
  return Array.from({ length: slot.max - slot.min + 1 }, (_, index) => String(slot.min + index));
}

/** Latest entry for the role at or before the given phase. */
export function getRoleInfoForPhaseOrPrevious(
  roleInfos: RoleInfoEntry[] | undefined,
  roleId: string,
  day: number,
  phase: GamePhase,
) {
  const phaseIndex = getEventPhaseIndex(day, phase);

  return (roleInfos ?? []).reduce<RoleInfoEntry | undefined>((latest, entry) => {
    if (entry.roleId !== roleId) return latest;

    const entryIndex = getEventPhaseIndex(entry.day, entry.phase);
    if (entryIndex > phaseIndex) return latest;
    if (!latest || entryIndex > getEventPhaseIndex(latest.day, latest.phase)) return entry;

    return latest;
  }, undefined);
}

/**
 * Sets one slot on the role's entry for the given phase. A phase without its own entry starts
 * from the previous entry's values so earlier info carries forward.
 */
export function setRoleInfoValue(
  roleInfos: RoleInfoEntry[] | undefined,
  roleId: string,
  day: number,
  phase: GamePhase,
  slotId: string,
  value: string | undefined,
  updatedAt: string,
  carryForward = true,
): RoleInfoEntry[] {
  const entries = roleInfos ?? [];
  const index = entries.findIndex(
    (entry) => entry.roleId === roleId && entry.day === day && entry.phase === phase,
  );
  const previousValues = carryForward
    ? getRoleInfoForPhaseOrPrevious(entries, roleId, day, phase)?.values
    : undefined;
  const baseValues = index >= 0 ? entries[index].values : (previousValues ?? {});
  const { [slotId]: _previous, ...otherValues } = baseValues;
  const values =
    value === undefined || value === '' ? otherValues : { ...otherValues, [slotId]: value };
  const nextEntry: RoleInfoEntry = { day, phase, roleId, updatedAt, values };

  if (index < 0) {
    return [...entries, nextEntry];
  }

  return entries.map((entry, entryIndex) => (entryIndex === index ? nextEntry : entry));
}

/** Adds the role's inferred entries for phases it has not stored, so inferred infos persist. */
export function seedRoleInfos(
  roleInfos: RoleInfoEntry[] | undefined,
  roleId: string,
  seedEntries: RoleInfoEntry[] | undefined,
): RoleInfoEntry[] | undefined {
  const roleSeeds =
    seedEntries?.filter(
      (seed) =>
        seed.roleId === roleId &&
        !roleInfos?.some(
          (entry) =>
            entry.roleId === roleId && entry.day === seed.day && entry.phase === seed.phase,
        ),
    ) ?? [];
  if (roleSeeds.length === 0) return roleInfos;

  return [...(roleInfos ?? []), ...roleSeeds];
}

/** Rewrites player-slot values; returning undefined drops the value. */
export function mapRoleInfoPlayerIds(
  roleInfos: RoleInfoEntry[] | undefined,
  mapPlayerId: (playerId: string) => string | undefined,
): RoleInfoEntry[] | undefined {
  return roleInfos?.map((entry) => {
    const playerSlotIds = new Set(
      getRoleInfoTemplate({ id: entry.roleId })
        .slots.filter((slot) => slot.kind === 'player')
        .map((slot) => slot.id),
    );

    return {
      ...entry,
      values: Object.fromEntries(
        Object.entries(entry.values).flatMap(([slotId, value]) => {
          if (!playerSlotIds.has(slotId)) return [[slotId, value]];
          const mappedValue = mapPlayerId(value);
          return mappedValue === undefined ? [] : [[slotId, mappedValue]];
        }),
      ),
    };
  });
}

/** Players (by seat) who claim or are confirmed as the role in the given phase. */
export function getRoleInfoOwners(
  players: Player[],
  roleId: string,
  day: number,
  phase: GamePhase,
  roles: Role[],
) {
  return [...players]
    .sort((first, second) => first.seat - second.seat)
    .filter((candidate) =>
      getRoleDisplayForDayOrPrevious(candidate.roleAssignments, day, roles, phase).roleIds.includes(
        roleId,
      ),
    );
}

/** The player executed on the given day, if any. */
export function getExecutedPlayer(players: Player[], day: number) {
  return players.find(
    (candidate) => candidate.death?.kind === 'execution' && candidate.death.day === day,
  );
}

/** The nearest alive non-storyteller players on each side of the given player. */
export function getAliveNeighbors(
  players: Player[],
  playerId: string,
  day: number,
  phase: GamePhase,
): Player[] {
  const seated = players
    .filter((candidate) => !candidate.isStoryteller)
    .sort((first, second) => first.seat - second.seat);
  const ownIndex = seated.findIndex((candidate) => candidate.id === playerId);
  if (ownIndex < 0) return [];

  const findAlive = (direction: -1 | 1) => {
    for (let step = 1; step < seated.length; step += 1) {
      const candidate = seated[(ownIndex + direction * step + seated.length) % seated.length];
      if (!isPlayerCurrentlyDead(candidate, day, phase)) return candidate;
    }
    return undefined;
  };

  const left = findAlive(-1);
  const right = findAlive(1);
  if (!left || !right) return left ? [left] : right ? [right] : [];

  return left.id === right.id ? [left] : [left, right];
}

/**
 * Fills info tokens from the players' notes for characters that have no stored info yet, so
 * games saved before the Character info table still show their infos. Notes of every player who
 * claimed or was confirmed as the character are read per phase; nothing is saved.
 */
export function inferRoleInfosFromNotes(
  players: Player[],
  playerDayNotes: PlayerDayNote[] | undefined,
  roleInfos: RoleInfoEntry[] | undefined,
  roles: Role[],
): RoleInfoEntry[] {
  if (!playerDayNotes?.length) return [];

  const storedRoleIds = new Set((roleInfos ?? []).map((entry) => entry.roleId));
  const seatedPlayers = players
    .filter((candidate) => !candidate.isStoryteller)
    .sort((first, second) => first.seat - second.seat);
  const inferred: RoleInfoEntry[] = [];

  for (const role of roles) {
    if (storedRoleIds.has(role.id)) continue;

    // Kill tokens come from recorded deaths instead (see inferNightKills).
    const slots = getRoleInfoTemplate(role).slots.filter((slot) => !isKillSlot(slot));
    if (!slots.some((slot) => slot.kind !== 'text')) continue;

    const owners = seatedPlayers.filter((candidate) =>
      candidate.roleAssignments?.some(
        (assignment) =>
          (assignment.kind === 'claim' || assignment.kind === 'confirm') &&
          assignment.roleIds.includes(role.id),
      ),
    );
    const entriesByPhase = new Map<string, RoleInfoEntry>();

    // Night notes go first so they win their own night over the next day's notes.
    const ownerNotes = [...playerDayNotes].sort(
      (first, second) => Number(first.phase !== 'night') - Number(second.phase !== 'night'),
    );

    for (const owner of owners) {
      for (const dayNote of ownerNotes) {
        if (dayNote.playerId !== owner.id) continue;

        const text = dayNote.notes.map((note) => note.text).join('\n');
        const otherPlayers = seatedPlayers.filter((candidate) => candidate.id !== owner.id);
        const otherRoles = roles.filter((candidate) => candidate.id !== role.id);
        const values = parseRoleInfoValues(text, slots, otherPlayers, otherRoles);
        if (Object.keys(values).length === 0) continue;

        // A day's notes usually record what was learned the night before, so they fill both.
        const phases: GamePhase[] = dayNote.phase === 'night' ? ['night'] : ['night', 'day'];
        for (const phase of phases) {
          const key = `${dayNote.day}-${phase}`;
          if (entriesByPhase.has(key)) continue;

          entriesByPhase.set(key, {
            day: dayNote.day,
            phase,
            roleId: role.id,
            updatedAt: dayNote.updatedAt,
            values,
          });
        }
      }
    }

    inferred.push(...entriesByPhase.values());
  }

  return inferred;
}

/** Infos inferred from notes and recorded night deaths; nothing is saved. */
export function inferRoleInfos(
  players: Player[],
  playerDayNotes: PlayerDayNote[] | undefined,
  roleInfos: RoleInfoEntry[] | undefined,
  roles: Role[],
  conversations: Conversation[] = [],
): RoleInfoEntry[] {
  const fromNotes = inferRoleInfosFromNotes(players, playerDayNotes, roleInfos, roles);
  const known = [...(roleInfos ?? []), ...fromNotes];
  // Recorded game events beat notes for the same phase.
  const fromEvents = [
    ...inferNightKills(players, known, roles),
    ...inferVirginNominations(players, conversations, known, roles),
  ];
  const eventPhases = new Set(fromEvents.map(getEntryPhaseKey));

  return [...fromNotes.filter((entry) => !eventPhases.has(getEntryPhaseKey(entry))), ...fromEvents];
}

/**
 * Fills the Virgin's tokens from the first nomination of a player claiming or confirmed as the
 * Virgin: the nominator, and whether they were executed that day.
 */
export function inferVirginNominations(
  players: Player[],
  conversations: Conversation[],
  roleInfos: RoleInfoEntry[],
  roles: Role[],
): RoleInfoEntry[] {
  const entries: RoleInfoEntry[] = [];

  for (const role of roles) {
    if (normalizeRoleInfoId(role.id) !== 'virgin') continue;

    const virginIds = getRoleClaimerIds(players, role.id);
    const nomination = conversations
      .filter(
        (conversation) =>
          conversation.kind === 'nomination' &&
          conversation.participantIds.some(
            (playerId) => playerId !== conversation.initiatorId && virginIds.has(playerId),
          ),
      )
      .sort(
        (first, second) =>
          first.day - second.day || first.createdAt.localeCompare(second.createdAt),
      )[0];
    if (!nomination) continue;

    const isStored = roleInfos.some(
      (entry) =>
        entry.roleId === role.id &&
        entry.day === nomination.day &&
        entry.phase === 'day' &&
        Object.keys(entry.values).length > 0,
    );
    if (isStored) continue;

    const nominator = players.find((candidate) => candidate.id === nomination.initiatorId);
    if (!nominator) continue;

    const executed =
      nominator.death?.kind === 'execution' && nominator.death.day === nomination.day;
    entries.push({
      day: nomination.day,
      phase: 'day',
      roleId: role.id,
      updatedAt: nomination.createdAt,
      values: { '0': nominator.id, '1': executed ? 'Yes' : 'No' },
    });
  }

  return entries;
}

/**
 * Fills kill tokens with the players who died that night. A death credited to a character or its
 * player goes to that character; an uncredited night death goes to the Demons. Nights the role
 * already has stored info for are left alone.
 */
export function inferNightKills(
  players: Player[],
  roleInfos: RoleInfoEntry[],
  roles: Role[],
): RoleInfoEntry[] {
  const nightDeaths = players
    .filter((candidate) => candidate.death && getDeathPhase(candidate.death) === 'night')
    .sort((first, second) => first.seat - second.seat);
  const entries: RoleInfoEntry[] = [];

  for (const role of roles) {
    const killSlots = getRoleInfoTemplate(role).slots.filter(isKillSlot);
    if (killSlots.length === 0) continue;

    const ownerIds = getRoleClaimerIds(players, role.id);
    const isDemon = role.team?.toLocaleLowerCase() === 'demon';
    const victimsByDay = new Map<number, Player[]>();

    for (const victim of nightDeaths) {
      const death = victim.death;
      if (!death) continue;

      const killerPlayerIds = [
        ...(death.killerPlayerIds ?? []),
        ...(death.killerPlayerId ? [death.killerPlayerId] : []),
      ];
      const killerRoleIds = death.killerRoleIds ?? [];
      const isCredited = killerPlayerIds.length > 0 || killerRoleIds.length > 0;
      const isKiller = isCredited
        ? killerRoleIds.includes(role.id) || killerPlayerIds.some((id) => ownerIds.has(id))
        : isDemon;
      if (!isKiller) continue;

      victimsByDay.set(death.day, [...(victimsByDay.get(death.day) ?? []), victim]);
    }

    for (const [day, victims] of victimsByDay) {
      const hasStoredNight = roleInfos.some(
        (entry) =>
          entry.roleId === role.id &&
          entry.day === day &&
          entry.phase === 'night' &&
          killSlots.some((slot) => entry.values[slot.id] !== undefined),
      );
      if (hasStoredNight) continue;

      const previous = getRoleInfoForPhaseOrPrevious(roleInfos, role.id, day, 'night');
      const values = Object.fromEntries(
        Object.entries(previous?.values ?? {}).filter(
          ([slotId]) => !killSlots.some((slot) => slot.id === slotId),
        ),
      );
      killSlots.forEach((slot, index) => {
        if (victims[index]) values[slot.id] = victims[index].id;
      });

      entries.push({
        day,
        phase: 'night',
        roleId: role.id,
        updatedAt: victims[0].death?.updatedAt ?? '',
        values,
      });
    }
  }

  return entries;
}

/**
 * Reads token values from note text: character and player names fill their tokens in the order
 * they appear, numbers and choices take their first match. Free-text tokens stay empty.
 */
export function parseRoleInfoValues(
  text: string,
  slots: RoleInfoSlot[],
  players: Player[],
  roles: Role[],
): Record<string, string> {
  const normalizedText = text.toLocaleLowerCase().replace(/[\u2018\u2019]/g, "'");
  const mentions = getNameMentions(normalizedText, [
    ...roles.map((candidate) => ({
      id: candidate.id,
      kind: 'role' as const,
      name: candidate.name,
    })),
    ...players.map((candidate) => ({
      id: candidate.id,
      kind: 'player' as const,
      name: candidate.name,
    })),
  ]);
  const usedMentions = new Set<NameMention>();
  const values: Record<string, string> = {};

  for (const slot of slots) {
    let value: string | undefined;

    switch (slot.kind) {
      case 'player':
      case 'role': {
        const allowedRoleIds =
          slot.kind === 'role'
            ? new Set(getRolesForInfoSlot(roles, slot.filter).map((candidate) => candidate.id))
            : undefined;
        const mention = mentions.find(
          (candidate) =>
            !usedMentions.has(candidate) &&
            candidate.kind === slot.kind &&
            (!allowedRoleIds || allowedRoleIds.has(candidate.id)),
        );
        if (mention) {
          usedMentions.add(mention);
          value = mention.id;
        }
        break;
      }
      case 'number':
        value = findNumber(normalizedText, slot.min, slot.max);
        break;
      case 'choice':
        value = slot.choices
          .map((option) => ({
            index: findWord(normalizedText, option.toLocaleLowerCase()),
            option,
          }))
          .filter(({ index }) => index >= 0)
          .sort((first, second) => first.index - second.index)[0]?.option;
        break;
      case 'text':
        break;
    }

    if (value !== undefined) values[slot.id] = value;
  }

  return values;
}

type NameMention = { end: number; id: string; kind: 'player' | 'role'; start: number };

/** Whole-word name matches in reading order; longer names win where matches overlap. */
function getNameMentions(
  text: string,
  names: { id: string; kind: NameMention['kind']; name: string }[],
): NameMention[] {
  const candidates: NameMention[] = [];

  for (const { id, kind, name } of names) {
    const needle = name
      .trim()
      .toLocaleLowerCase()
      .replace(/[\u2018\u2019]/g, "'");
    if (!needle) continue;

    let start = findWord(text, needle);
    while (start >= 0) {
      candidates.push({ end: start + needle.length, id, kind, start });
      start = findWord(text, needle, start + needle.length);
    }
  }

  const accepted: NameMention[] = [];
  const bySize = [...candidates].sort(
    (first, second) => second.end - second.start - (first.end - first.start),
  );
  for (const candidate of bySize) {
    const overlaps = accepted.some(
      (other) => candidate.start < other.end && other.start < candidate.end,
    );
    if (!overlaps) accepted.push(candidate);
  }

  return accepted.sort((first, second) => first.start - second.start);
}

function findNumber(text: string, min: number, max: number) {
  const pattern = new RegExp(`\\b(\\d+|${NUMBER_WORDS.join('|')})\\b`, 'g');
  for (const match of text.matchAll(pattern)) {
    const wordIndex = NUMBER_WORDS.indexOf(match[1]);
    const value = wordIndex >= 0 ? wordIndex : Number(match[1]);
    if (value >= min && value <= max) return String(value);
  }
  return undefined;
}

/** Index of the next whole-word occurrence of the needle, or -1. */
function findWord(text: string, needle: string, fromIndex = 0) {
  let index = text.indexOf(needle, fromIndex);
  while (index >= 0) {
    if (!isWordChar(text[index - 1]) && !isWordChar(text[index + needle.length])) return index;
    index = text.indexOf(needle, index + 1);
  }
  return -1;
}

function isWordChar(char: string | undefined) {
  return char !== undefined && (/[0-9_]/.test(char) || char.toLowerCase() !== char.toUpperCase());
}

function areAllDead(players: Player[], day: number, phase: GamePhase) {
  return (
    players.length > 0 && players.every((candidate) => isPlayerCurrentlyDead(candidate, day, phase))
  );
}

function getEntryPhaseKey(entry: RoleInfoEntry) {
  return `${entry.roleId}-${entry.day}-${entry.phase}`;
}

/** Players who ever claimed or were confirmed as the role. */
function getRoleClaimerIds(players: Player[], roleId: string) {
  return new Set(
    players
      .filter((candidate) =>
        candidate.roleAssignments?.some(
          (assignment) =>
            (assignment.kind === 'claim' || assignment.kind === 'confirm') &&
            assignment.roleIds.includes(roleId),
        ),
      )
      .map((candidate) => candidate.id),
  );
}

function isKillSlot(slot: RoleInfoSlot) {
  return slot.kind === 'player' && slot.label.startsWith('Killed');
}

function withSlotIds(specs: SlotSpec[]): RoleInfoSlot[] {
  return specs.map((spec, index) => ({ ...spec, id: String(index) }) as RoleInfoSlot);
}
