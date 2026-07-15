import type { Player, PlayerRoleAssignment, Role, StoredScript } from '@/types/game';

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

const alignedGoodTeams = new Set(['outsider', 'townsfolk']);
const alignedEvilTeams = new Set(['demon', 'minion']);

export const GENERIC_KILLER_ROLES: Role[] = [
  {
    id: 'generic_demon',
    imageUrl: `${BOTC_ROLE_ICON_BASE_URL}/generic/demon.webp`,
    name: 'Demon',
    team: 'demon',
  },
  {
    id: 'generic_evil',
    imageUrl: `${BOTC_ROLE_ICON_BASE_URL}/generic/evil.webp`,
    name: 'Evil',
    team: 'minion',
  },
  {
    id: 'generic_unknown',
    imageUrl: `${BOTC_ROLE_ICON_BASE_URL}/generic/unknown.webp`,
    name: 'Unknown',
  },
];

export function getRoleIconUrl(role: Role) {
  if (role.imageUrl) {
    return role.imageUrl;
  }

  const directory = getRoleEditionDirectory(role);
  const alignment = getRoleAlignment(role);
  const filename = `${role.id}${alignment ? `_${alignment}` : ''}.webp`;

  return `${BOTC_ROLE_ICON_BASE_URL}/${directory}/${filename}`;
}

export function getRoleIconUrlForAlignment(role: Role, alignment: 'g' | 'e') {
  const directory = getRoleEditionDirectory(role);

  return `${BOTC_ROLE_ICON_BASE_URL}/${directory}/${role.id}_${alignment}.webp`;
}

export function getRoleAlignment(role: Role): 'g' | 'e' | undefined {
  if (alignedGoodTeams.has(role.team ?? '')) {
    return 'g';
  }

  if (alignedEvilTeams.has(role.team ?? '')) {
    return 'e';
  }

  return undefined;
}

export function isTravelerRole(role: Role) {
  return role.team?.toLocaleLowerCase() === 'traveller';
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
      name: `Good ${role.name}`,
      team: 'traveller',
    },
    {
      ...role,
      id: `${role.id}_evil`,
      imageUrl: getRoleIconUrlForAlignment(role, 'e'),
      name: `Evil ${role.name}`,
      team: 'traveller',
    },
  ];
}

export function canRoleKill(role: Role) {
  const ability = role.ability?.toLocaleLowerCase() ?? '';

  return (
    /\b(?:choose|select|nominate|pick)\b[\s\S]{0,100}\b(?:a|another|one|target)?\s*player\b[\s\S]{0,100}\b(?:die|dies|killed|kill)\b/.test(
      ability,
    ) || /\b(?:a|another|one) player (?:die|dies|is killed|is dead)\b/.test(ability)
  );
}

export function getRolesWithKillAbility(roles: Role[], catalog: Role[] = []) {
  return mergeScriptRoles(roles, catalog).filter(canRoleKill);
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

export function getRolesByIds(roleIds: string[], roles: Role[]) {
  const roleById = new Map(roles.map((role) => [role.id, role]));
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

export function getRoleDisplayForDayOrPrevious(
  assignments: PlayerRoleAssignment[] | undefined,
  day: number,
  roles: Role[],
) {
  const eligibleAssignments = (assignments ?? []).filter((assignment) => assignment.day <= day);
  const latestDay = Math.max(...eligibleAssignments.map((assignment) => assignment.day));
  const assignment =
    latestDay > 0 ? getRoleAssignmentForDay(eligibleAssignments, latestDay) : undefined;

  return {
    kind: assignment?.kind,
    roleIds: assignment?.roleIds ?? [],
    roles: getRolesForAssignment(assignment, roles),
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

export function normalizeRoleCatalog(content: unknown) {
  return mergeScriptRoles(content, []);
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

function getRoleEditionDirectory(role: Role) {
  const edition = roleEditionDirectories[(role.edition ?? '').toLocaleLowerCase()];
  if (edition) {
    return edition;
  }

  const team = role.team?.toLocaleLowerCase();
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
    imageUrl:
      (typeof candidate.image === 'string' && candidate.image) ||
      (typeof candidate.imageUrl === 'string' && candidate.imageUrl) ||
      catalogRole?.imageUrl,
  };

  return role;
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
