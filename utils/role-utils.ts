import unknownRoleIcon from '@/assets/role-icons/unknown.webp';
import type {
  Player,
  PlayerRoleAssignment,
  Role,
  RoleDisplayMode,
  StoredScript,
} from '@/types/game';
import { APP_USER_ID } from '@/utils/object-id';

export const BOTC_ROLE_CATALOG_URL = 'https://release.botc.app/resources/data/roles.json';
export const BOTC_ROLE_ICON_BASE_URL = 'https://release.botc.app/resources/characters';

const roleEditionDirectories: Record<string, string> = {
  'bad moon rising': 'bmr',
  bmr: 'bmr',
  carousel: 'carousel',
  fabled: 'fabled',
  loric: 'loric',
  snv: 'snv',
  'sects and violets': 'snv',
  tb: 'tb',
  'trouble brewing': 'tb',
};

const officialRoleMetadataById: Record<string, Pick<Role, 'edition' | 'team'>> = {
  beggar: { edition: 'tb', team: 'traveller' },
  fanggu: { edition: 'snv', team: 'demon' },
  godfather: { edition: 'bmr', team: 'minion' },
  gunslinger: { edition: 'tb', team: 'traveller' },
  harlot: { edition: 'snv', team: 'traveller' },
  mutant: { edition: 'snv', team: 'outsider' },
  scapegoat: { edition: 'tb', team: 'townsfolk' },
  thief: { edition: 'tb', team: 'traveller' },
};

const alignedGoodTeams = new Set(['outsider', 'townsfolk']);
const alignedEvilTeams = new Set(['demon', 'minion']);

function getRoleEdition(role: Role) {
  return role.edition ?? officialRoleMetadataById[role.id]?.edition;
}

function getRoleTeam(role: Role) {
  return (role.team ?? officialRoleMetadataById[role.id]?.team)?.toLocaleLowerCase() ?? '';
}

const GENERIC_CHARACTER_TYPES = [
  'Demon',
  'Evil',
  'Good',
  'Minion',
  'Outsider',
  'Townsfolk',
  'Traveller',
] as const;

export const GENERIC_CHARACTER_TYPE_ROLES: Role[] = GENERIC_CHARACTER_TYPES.map(
  (characterType) => ({
    id: `generic_${characterType.toLowerCase()}`,
    imageUrl: `${BOTC_ROLE_ICON_BASE_URL}/generic/${characterType.toLowerCase()}.webp`,
    name: characterType,
    team: characterType.toLowerCase(),
  }),
);

const GENERIC_CHARACTER_TYPE_ALIASES: Record<string, string[]> = {
  Demon: ['Demons'],
  Evil: ['Evils'],
  Good: ['Goods'],
  Minion: ['Minions'],
  Outsider: ['Outsiders'],
  Townsfolk: ['Townsfolks'],
  Traveller: ['Travellers', 'Traveler', 'Travelers'],
};

export const GENERIC_CHARACTER_TYPE_ROLE_REFERENCES: Role[] = GENERIC_CHARACTER_TYPE_ROLES.flatMap(
  (role) => {
    const aliases = GENERIC_CHARACTER_TYPE_ALIASES[role.name] ?? [];
    return [role, ...aliases.map((name) => ({ ...role, name }))];
  },
);

const EMPTY_ROLE_DISPLAY: RoleDisplay = {
  kind: undefined,
  roleIds: [],
  roles: [],
};

export const GENERIC_KILLER_ROLES: Role[] = [
  {
    id: 'generic_unknown',
    imageSource: unknownRoleIcon,
    name: 'Unknown',
  },
  ...GENERIC_CHARACTER_TYPE_ROLES.filter(({ name }) => name === 'Demon' || name === 'Evil'),
];

export function getRoleIconUrl(role: Role) {
  const imageUrl = getRoleImageUrl(role);
  if (imageUrl) {
    return imageUrl;
  }

  if (!getRoleEdition(role) && !role.imageUrls?.length) {
    return undefined;
  }

  const directory = getRoleEditionDirectory(role);
  const alignment = getRoleAlignment(role);
  const filename = `${role.id}${alignment ? `_${alignment}` : ''}.webp`;

  return `${BOTC_ROLE_ICON_BASE_URL}/${directory}/${filename}`;
}

export function getRoleIconUrlForAlignment(role: Role, alignment: 'g' | 'e') {
  const imageUrl = getRoleImageUrlForAlignment(role, alignment);
  if (imageUrl) {
    return imageUrl;
  }

  if (!getRoleEdition(role) && !role.imageUrls?.length) {
    return undefined;
  }

  const directory = getRoleEditionDirectory(role);

  return `${BOTC_ROLE_ICON_BASE_URL}/${directory}/${role.id}_${alignment}.webp`;
}

export function getRoleAlignment(role: Role): 'g' | 'e' | undefined {
  const team = getRoleTeam(role);

  if (alignedGoodTeams.has(team)) {
    return 'g';
  }

  if (alignedEvilTeams.has(team)) {
    return 'e';
  }

  return undefined;
}

export function isTravelerRole(role: Role) {
  return getRoleTeam(role) === 'traveller';
}

export function isFlowerGirlRole(role: Role) {
  const normalizedId = role.id.toLocaleLowerCase().replace(/[^a-z]/g, '');
  const normalizedName = role.name.toLocaleLowerCase().replace(/[^a-z]/g, '');

  return normalizedId === 'flowergirl' || normalizedName === 'flowergirl';
}

export function getTravelerClaimRoles(role: Role): Role[] {
  return [
    {
      ...role,
      id: `${role.id}_good`,
      imageUrl: getRoleIconUrlForAlignment(role, 'g'),
      imageUrls: undefined,
      name: `Good ${role.name}`,
      team: 'traveller',
    },
    {
      ...role,
      id: `${role.id}_evil`,
      imageUrl: getRoleIconUrlForAlignment(role, 'e'),
      imageUrls: undefined,
      name: `Evil ${role.name}`,
      team: 'traveller',
    },
  ];
}

export function canRoleKill(role: Role) {
  const ability = role.ability?.toLocaleLowerCase() ?? '';

  return (
    /\b(?:choose(?:s)?|select(?:s)?|nominate(?:s)?|pick(?:s)?)\b[\s\S]{0,100}\b(?:a|another|one|target|\d+)?\s*players?\b[\s\S]{0,180}\b(?:die|dies|executed|killed|kill)\b/.test(
      ability,
    ) || /\b(?:a|another|one) player (?:die|dies|is killed|is dead)\b/.test(ability)
  );
}

export function getRolesWithKillAbility(roles: Role[], catalog: Role[] = []) {
  return mergeScriptRoles(roles, catalog).filter(canRoleKill);
}

export function getKillerRoleOptions(roles: Role[], catalog: Role[] = []) {
  const scriptRoles = mergeScriptRoles(roles, catalog);
  const killerRoles = getRolesWithKillAbility(roles, catalog);
  const demonRoleCount = scriptRoles.filter(
    (role) => role.team?.toLocaleLowerCase() === 'demon',
  ).length;
  const evilKillerRoleCount = killerRoles.filter((role) =>
    alignedEvilTeams.has(role.team?.toLocaleLowerCase() ?? ''),
  ).length;

  return [
    ...GENERIC_KILLER_ROLES.filter((role) => {
      if (role.id === 'generic_demon') {
        return demonRoleCount > 1;
      }

      if (role.id === 'generic_evil') {
        return evilKillerRoleCount > 1;
      }

      return true;
    }),
    ...killerRoles,
  ];
}

export function getRoleAssignmentForDay(
  assignments: PlayerRoleAssignment[] | undefined,
  day: number,
  kind?: PlayerRoleAssignment['kind'],
) {
  const dayAssignments = (assignments ?? []).filter((assignment) => assignment.day === day);
  if (kind) {
    return getLatestAssignment(dayAssignments, kind);
  }

  return (
    getLatestAssignment(dayAssignments, 'confirm') ?? getLatestAssignment(dayAssignments, 'claim')
  );
}

export function getAssignedRoleIdsForDay(
  assignments: PlayerRoleAssignment[] | undefined,
  day: number,
) {
  return [
    ...(getRoleAssignmentForDay(assignments, day, 'claim')?.roleIds ?? []),
    ...(getRoleAssignmentForDay(assignments, day, 'confirm')?.roleIds ?? []),
  ].filter((roleId, index, roleIds) => roleIds.indexOf(roleId) === index);
}

export function getRoleAssignmentForDayOrPrevious(
  assignments: PlayerRoleAssignment[] | undefined,
  day: number,
  kind: PlayerRoleAssignment['kind'],
) {
  const eligibleAssignments = (assignments ?? []).filter(
    (assignment) => assignment.kind === kind && assignment.day <= day,
  );
  const latestDay = Math.max(...eligibleAssignments.map((assignment) => assignment.day));

  return latestDay > 0 ? getRoleAssignmentForDay(eligibleAssignments, latestDay, kind) : undefined;
}

export function getAssignedRoleIdsForDayOrPrevious(
  assignments: PlayerRoleAssignment[] | undefined,
  day: number,
) {
  return [
    ...(getRoleAssignmentForDayOrPrevious(assignments, day, 'claim')?.roleIds ?? []),
    ...(getRoleAssignmentForDayOrPrevious(assignments, day, 'confirm')?.roleIds ?? []),
  ].filter((roleId, index, roleIds) => roleIds.indexOf(roleId) === index);
}

export function getRoleNames(roleIds: string[], roles: Role[]) {
  return getRolesByIds(roleIds, roles).map((role) => role.name);
}

export function getRoleOwnerNamesForDay(players: Player[], day: number, roles: Role[]) {
  const roleOwnerNames: Record<string, string[]> = Object.fromEntries(
    roles.map((role) => [role.id, []]),
  );

  for (const player of [...players].sort((first, second) => first.seat - second.seat)) {
    const roleDisplay = getRoleDisplayForDayOrPrevious(player.roleAssignments, day, roles);

    for (const roleId of roleDisplay.roleIds) {
      roleOwnerNames[roleId]?.push(player.name);
    }
  }

  return roleOwnerNames;
}

export type RumorAboutPlayer = {
  /** The player who owns the rumor assignment. For an anonymous rumor this is the subject. */
  sourcePlayer: Player;
  /** The rumor assignment (always kind === 'rumor'). */
  assignment: PlayerRoleAssignment;
  /** The role(s) the source claims the subject has. */
  roles: Role[];
};

export type RumorMapDisplay = RumorAboutPlayer & {
  subjectPlayer: Player;
};

export type RoleDisplay = {
  kind: PlayerRoleAssignment['kind'] | undefined;
  roleIds: string[];
  roles: Role[];
};

/**
 * Returns all rumor assignments for the given day where the target player is
 * the subject (i.e. someone reported that this player is one of the roles).
 * Used to surface "Rumor" rows on the subject player's note row in addition
 * to the source player's own row.
 */
export function getRumorAboutPlayerForDay(
  players: Player[],
  subjectPlayerId: string,
  day: number,
  roles: Role[],
): RumorAboutPlayer[] {
  const results: RumorAboutPlayer[] = [];

  for (const source of players) {
    if (source.id === subjectPlayerId) {
      continue;
    }
    const rumor = getLatestRumor(source.roleAssignments, day, subjectPlayerId);
    if (!rumor) {
      continue;
    }
    const rumorRoles = getRolesByIds(rumor.roleIds, roles);
    results.push({ assignment: rumor, roles: rumorRoles, sourcePlayer: source });
  }

  return results;
}

export function getLatestRumorAboutPlayerForDayOrPrevious(
  players: Player[],
  subjectPlayerId: string,
  day: number,
  roles: Role[],
): RumorAboutPlayer | undefined {
  let latest: { assignment: PlayerRoleAssignment; sourcePlayer: Player } | undefined;

  for (const sourcePlayer of players) {
    for (const assignment of sourcePlayer.roleAssignments ?? []) {
      if (
        assignment.kind !== 'rumor' ||
        assignment.subjectPlayerId !== subjectPlayerId ||
        assignment.day > day
      ) {
        continue;
      }

      if (!latest || isLaterAssignment(assignment, latest.assignment)) {
        latest = { assignment, sourcePlayer };
      }
    }
  }

  if (!latest || latest.assignment.roleIds.length === 0) {
    return undefined;
  }

  return {
    assignment: latest.assignment,
    roles: getRolesByIds(latest.assignment.roleIds, roles),
    sourcePlayer: latest.sourcePlayer,
  };
}

export function getLatestRumorMapDisplaysForDayOrPrevious(
  players: Player[],
  day: number,
  roles: Role[],
): RumorMapDisplay[] {
  return players.flatMap((subjectPlayer) => {
    const rumor = getLatestRumorAboutPlayerForDayOrPrevious(players, subjectPlayer.id, day, roles);
    return rumor && rumor.sourcePlayer.id !== subjectPlayer.id ? [{ ...rumor, subjectPlayer }] : [];
  });
}

export function getRoleDisplayForMode(
  player: Player,
  players: Player[],
  day: number,
  roles: Role[],
  mode: RoleDisplayMode,
): RoleDisplay {
  if (mode === 'all') {
    for (const priorityMode of ['confirm', 'claim', 'rumor', 'guess'] as const) {
      const roleDisplay = getRoleDisplayForMode(player, players, day, roles, priorityMode);
      if (roleDisplay.roleIds.length > 0) {
        return roleDisplay;
      }
    }

    return EMPTY_ROLE_DISPLAY;
  }

  const confirmedAssignment = getRoleAssignmentForDayOrPrevious(
    player.roleAssignments,
    day,
    'confirm',
  );
  if (confirmedAssignment?.roleIds.length) {
    return getRoleDisplayFromAssignment(confirmedAssignment, roles);
  }

  if (mode === 'rumor') {
    const rumor = getLatestRumorAboutPlayerForDayOrPrevious(players, player.id, day, roles);
    return rumor ? getRoleDisplayFromAssignment(rumor.assignment, roles) : EMPTY_ROLE_DISPLAY;
  }

  const assignment = getRoleAssignmentForDayOrPrevious(player.roleAssignments, day, mode);
  return assignment ? getRoleDisplayFromAssignment(assignment, roles) : EMPTY_ROLE_DISPLAY;
}

export function getRolesByIds(roleIds: string[], roles: Role[]) {
  const roleById = new Map(roles.map((role) => [role.id, role]));
  // Seed the lookup with generic character-type roles (Demon, Minion, etc.) so
  // a saved roleId like 'generic_minion' resolves to "Minion" + the matching
  // icon instead of falling through to the "Generic Minion" name formatter.
  for (const role of GENERIC_CHARACTER_TYPE_ROLE_REFERENCES) {
    if (!roleById.has(role.id)) {
      roleById.set(role.id, role);
    }
  }
  return roleIds.map(
    (roleId) =>
      roleById.get(roleId) ??
      getTravelerClaimRoleById(roleId, roles) ?? { id: roleId, name: formatRoleId(roleId) },
  );
}

export function getRolesForDay(
  assignments: PlayerRoleAssignment[] | undefined,
  day: number,
  roles: Role[],
) {
  const assignment = getRoleAssignmentForDay(assignments, day);
  return getRolesForAssignment(assignment, roles);
}

export function getRolesForDayOrPrevious(
  assignments: PlayerRoleAssignment[] | undefined,
  day: number,
  roles: Role[],
) {
  return getRoleDisplayForDayOrPrevious(assignments, day, roles).roles;
}

export type PlayerEffectiveRole = {
  role: Role | null;
  kind: 'confirm' | 'claim' | null;
};

/**
 * Resolves a single "current" role for a player, used by surfaces that only
 * need one icon per player (e.g. the saved-game role row). Mirrors the
 * confirm-overrides-claim priority of `getRoleDisplayForDayOrPrevious`, but
 * collapses multi-role assignments down to the first role id and returns
 * `null` when the player has neither a confirm nor a claim.
 */
export function getEffectiveRoleForPlayer(
  player: Player,
  roles: Role[],
  activeDay: number,
): PlayerEffectiveRole {
  const confirmed = getRoleAssignmentForDayOrPrevious(player.roleAssignments, activeDay, 'confirm');
  if (confirmed?.roleIds.length) {
    const [role] = getRolesByIds([confirmed.roleIds[0]], roles);
    return { role, kind: 'confirm' };
  }

  const claimed = getRoleAssignmentForDayOrPrevious(player.roleAssignments, activeDay, 'claim');
  if (claimed?.roleIds.length) {
    const [role] = getRolesByIds([claimed.roleIds[0]], roles);
    return { role, kind: 'claim' };
  }

  return { role: null, kind: null };
}

/**
 * Returns a sort index for a player based on their effective role's team,
 * with the app user pinned to bucket 0. Used to order the saved-game role
 * row: app user, then townsfolk, outsiders, minions, demons, then unknown.
 */
export function getPlayerRoleBucket(player: Player, roles: Role[], activeDay: number): number {
  if (player.id === APP_USER_ID) {
    return 0;
  }

  const team = getEffectiveRoleForPlayer(player, roles, activeDay).role?.team?.toLocaleLowerCase();
  switch (team) {
    case 'townsfolk':
      return 1;
    case 'outsider':
      return 2;
    case 'minion':
      return 3;
    case 'demon':
      return 4;
    default:
      return 5;
  }
}

export function getRoleDisplayForDayOrPrevious(
  assignments: PlayerRoleAssignment[] | undefined,
  day: number,
  roles: Role[],
) {
  const confirmedAssignment = getRoleAssignmentForDayOrPrevious(assignments, day, 'confirm');
  const claimedAssignment = getRoleAssignmentForDayOrPrevious(assignments, day, 'claim');
  const assignment = confirmedAssignment?.roleIds.length ? confirmedAssignment : claimedAssignment;

  return {
    kind: assignment?.kind,
    roleIds: assignment?.roleIds ?? [],
    roles: getRolesForAssignment(assignment, roles),
  };
}

function getRoleDisplayFromAssignment(
  assignment: PlayerRoleAssignment,
  roles: Role[],
): RoleDisplay {
  return {
    kind: assignment.kind,
    roleIds: assignment.roleIds,
    roles: getRolesByIds(assignment.roleIds, roles),
  };
}

function getRolesForAssignment(assignment: PlayerRoleAssignment | undefined, roles: Role[]) {
  if (!assignment) {
    return [];
  }

  const rolesById = new Map(roles.map((role) => [role.id, role]));
  return assignment.roleIds.flatMap((roleId) => {
    const role = rolesById.get(roleId) ?? getTravelerClaimRoleById(roleId, roles);
    return role ? [role] : [];
  });
}

function getTravelerClaimRoleById(roleId: string, roles: Role[]) {
  const match = /^(.*)_(good|evil)$/.exec(roleId);
  if (!match) {
    return undefined;
  }

  const travelerRole = roles.find((role) => role.id === match[1] && isTravelerRole(role));
  return travelerRole
    ? getTravelerClaimRoles(travelerRole).find((role) => role.id === roleId)
    : undefined;
}

export function mergeScriptRoles(content: unknown, catalog: Role[]): Role[] {
  if (!Array.isArray(content)) {
    return [];
  }

  const catalogById = new Map(catalog.map((role) => [role.id, role]));
  const rolesById = new Map<string, Role>();

  for (const item of content) {
    const role = normalizeRole(item, catalogById);
    if (role) {
      rolesById.set(role.id, role);
    }
  }

  return [...rolesById.values()];
}

export function mergeRoleCatalogMetadata(roles: Role[], catalog: Role[]): Role[] {
  const catalogById = new Map<string, Role>();

  for (const role of catalog) {
    if (!catalogById.has(role.id)) {
      catalogById.set(role.id, role);
    }
  }

  return roles.map((role) => {
    const catalogRole = catalogById.get(role.id);
    if (!catalogRole) {
      return role;
    }

    return {
      ...catalogRole,
      ...role,
      ability: role.ability ?? catalogRole.ability,
      edition: role.edition ?? catalogRole.edition,
      imageSource: role.imageSource ?? catalogRole.imageSource,
      imageUrl: catalogRole.imageUrl ?? role.imageUrl,
      imageUrls: catalogRole.imageUrls ?? role.imageUrls,
      name: role.name || catalogRole.name,
      notes: role.notes ?? catalogRole.notes,
      team: role.team ?? catalogRole.team,
    };
  });
}

export function normalizeRoleCatalog(content: unknown) {
  return mergeScriptRoles(content, []);
}

export function parseRoleIconCatalog(content: string): Role[] {
  const rolesById = new Map<
    string,
    { base?: string; edition: string; evil?: string; good?: string }
  >();
  const iconPattern =
    /(?:href|src)=["'](?:https?:\/\/[^"']+)?\/resources\/characters\/([^/"']+)\/([^/"']+)\.webp["']/g;

  for (const match of content.matchAll(iconPattern)) {
    const [, edition, filename] = match;
    const alignmentMatch = /^(.*?)(?:_([gen]))?$/.exec(filename);
    const roleId = alignmentMatch?.[1];
    const alignment = alignmentMatch?.[2];

    if (!roleId) {
      continue;
    }

    const iconUrl = `${BOTC_ROLE_ICON_BASE_URL}/${edition}/${filename}.webp`;
    const current = rolesById.get(roleId) ?? { edition };
    if (current.edition === 'generic' && edition !== 'generic') {
      current.edition = edition;
    }

    if (alignment === 'e') {
      current.evil = iconUrl;
    } else if (alignment === 'g') {
      current.good = iconUrl;
    } else {
      current.base = iconUrl;
    }

    rolesById.set(roleId, current);
  }

  return [...rolesById].map(([id, { base, edition, evil, good }]) => {
    const imageUrls = [base, good, evil].filter((url): url is string => !!url);

    return {
      edition,
      id,
      imageUrl: imageUrls.length === 1 ? imageUrls[0] : undefined,
      imageUrls: imageUrls.length > 1 ? imageUrls : undefined,
      name: formatRoleId(id),
    };
  });
}

export function addRoleToScript(script: StoredScript, role: Role): StoredScript {
  if (script.roles.some((scriptRole) => scriptRole.id === role.id)) {
    return script;
  }

  return {
    ...script,
    roles: [...script.roles, role],
    updatedAt: new Date().toISOString(),
  };
}

export function removeRoleFromScript(script: StoredScript, roleId: string): StoredScript {
  return {
    ...script,
    roles: script.roles.filter((role) => role.id !== roleId),
    updatedAt: new Date().toISOString(),
  };
}

function getLatestAssignment(
  assignments: PlayerRoleAssignment[],
  kind: PlayerRoleAssignment['kind'],
) {
  return assignments
    .filter((assignment) => assignment.kind === kind)
    .reduce<PlayerRoleAssignment | undefined>(
      (latest, assignment) =>
        latest && latest.updatedAt > assignment.updatedAt ? latest : assignment,
      undefined,
    );
}

function isLaterAssignment(assignment: PlayerRoleAssignment, current: PlayerRoleAssignment) {
  return (
    assignment.day > current.day ||
    (assignment.day === current.day && assignment.updatedAt > current.updatedAt)
  );
}

function getLatestRumor(
  assignments: PlayerRoleAssignment[] | undefined,
  day: number,
  subjectPlayerId: string,
) {
  return (assignments ?? [])
    .filter(
      (assignment): assignment is PlayerRoleAssignment =>
        assignment.kind === 'rumor' &&
        assignment.day === day &&
        assignment.subjectPlayerId === subjectPlayerId,
    )
    .reduce<PlayerRoleAssignment | undefined>(
      (latest, assignment) =>
        latest && latest.updatedAt > assignment.updatedAt ? latest : assignment,
      undefined,
    );
}

function getRoleEditionDirectory(role: Role) {
  const edition = roleEditionDirectories[getRoleEdition(role)?.toLocaleLowerCase() ?? ''];
  if (edition) {
    return edition;
  }

  const team = getRoleTeam(role);
  if (
    team &&
    ['demon', 'fabled', 'loric', 'minion', 'outsider', 'townsfolk', 'traveller'].includes(team)
  ) {
    return `generic`;
  }

  return 'generic';
}

function normalizeRole(item: unknown, catalogById: Map<string, Role>): Role | undefined {
  const rawRole = typeof item === 'string' ? { id: item } : item;

  if (!rawRole || typeof rawRole !== 'object') {
    return undefined;
  }

  const candidate = rawRole as Record<string, unknown>;
  const id = typeof candidate.id === 'string' ? candidate.id : '';

  if (!id || id === '_meta') {
    return undefined;
  }

  const catalogRole = catalogById.get(id);
  const imageUrls = catalogRole
    ? catalogRole.imageUrls
    : (normalizeImageUrls(candidate.image) ?? normalizeImageUrls(candidate.imageUrl));
  const role: Role = {
    ability: (typeof candidate.ability === 'string' && candidate.ability) || catalogRole?.ability,
    id,
    name:
      (typeof candidate.name === 'string' && candidate.name) ||
      catalogRole?.name ||
      formatRoleId(id),
    notes: normalizeRoleNotes(candidate.notes) ?? catalogRole?.notes,
    team: (typeof candidate.team === 'string' && candidate.team) || catalogRole?.team,
    edition: (typeof candidate.edition === 'string' && candidate.edition) || catalogRole?.edition,
    imageUrl: catalogRole
      ? catalogRole.imageUrl
      : imageUrls?.length === 1
        ? imageUrls[0]
        : undefined,
  };

  if (imageUrls) {
    role.imageUrls = imageUrls;
  }

  return role;
}

function getRoleImageUrl(role: Role, alignment?: 'g' | 'e') {
  if (!role.imageUrls?.length) {
    return role.imageUrl;
  }

  if (role.imageUrls.length === 1) {
    return role.imageUrls[0];
  }

  if (isTravelerRole(role)) {
    if (alignment === 'e') {
      return role.imageUrls[2] ?? role.imageUrls[1] ?? role.imageUrls[0];
    }

    if (alignment === 'g') {
      return role.imageUrls[1] ?? role.imageUrls[0];
    }

    return role.imageUrls[0];
  }

  return getRoleAlignment(role) === 'e'
    ? (role.imageUrls[1] ?? role.imageUrls[0])
    : role.imageUrls[0];
}

function getRoleImageUrlForAlignment(role: Role, alignment: 'g' | 'e') {
  if (isTravelerRole(role) && getRoleEdition(role)) {
    const alignmentSuffix = new RegExp(`_${alignment}\\.[^/?#]+(?:[?#].*)?$`);
    return role.imageUrls?.find((imageUrl) => alignmentSuffix.test(imageUrl));
  }

  return getRoleImageUrl(role, alignment);
}

function normalizeImageUrls(value: unknown) {
  const values = Array.isArray(value) ? value : [value];
  const imageUrls = values
    .filter((imageUrl): imageUrl is string => typeof imageUrl === 'string')
    .map((imageUrl) => imageUrl.trim())
    .filter(Boolean);

  return imageUrls.length > 0 ? imageUrls : undefined;
}

function normalizeRoleNotes(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const notes = [...new Set(value.filter((note): note is string => typeof note === 'string'))]
    .map((note) => note.trim())
    .filter(Boolean);

  return notes.length > 0 ? notes : undefined;
}

function formatRoleId(roleId: string) {
  return roleId
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (character) => character.toLocaleUpperCase());
}
