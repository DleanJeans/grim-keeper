import type { PlayerRoleAssignment, Role, StoredScript } from '@/types/game';

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

export function getRoleIconUrl(role: Role) {
  if (role.imageUrl) {
    return role.imageUrl;
  }

  const directory = getRoleEditionDirectory(role);
  const alignment = getRoleAlignment(role);
  const filename = `${role.id}${alignment ? `_${alignment}` : ''}.webp`;

  return `${BOTC_ROLE_ICON_BASE_URL}/${directory}/${filename}`;
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

export function getRoleAssignmentForDay(
  assignments: PlayerRoleAssignment[] | undefined,
  day: number,
) {
  const dayAssignments = (assignments ?? []).filter((assignment) => assignment.day === day);
  return (
    getLatestAssignment(dayAssignments, 'confirm') ?? getLatestAssignment(dayAssignments, 'claim')
  );
}

export function getRoleNames(roleIds: string[], roles: Role[]) {
  return getRolesByIds(roleIds, roles).map((role) => role.name);
}

export function getRolesByIds(roleIds: string[], roles: Role[]) {
  const roleById = new Map(roles.map((role) => [role.id, role]));
  return roleIds.map(
    (roleId) => roleById.get(roleId) ?? { id: roleId, name: formatRoleId(roleId) },
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
    roles: getRolesForAssignment(assignment, roles),
  };
}

function getRolesForAssignment(assignment: PlayerRoleAssignment | undefined, roles: Role[]) {
  if (!assignment) {
    return [];
  }

  const rolesById = new Map(roles.map((role) => [role.id, role]));
  return assignment.roleIds.flatMap((roleId) => {
    const role = rolesById.get(roleId);
    return role ? [role] : [];
  });
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
    id,
    name:
      (typeof candidate.name === 'string' && candidate.name) ||
      catalogRole?.name ||
      formatRoleId(id),
    team: (typeof candidate.team === 'string' && candidate.team) || catalogRole?.team,
    edition: (typeof candidate.edition === 'string' && candidate.edition) || catalogRole?.edition,
    imageUrl:
      (typeof candidate.image === 'string' && candidate.image) ||
      (typeof candidate.imageUrl === 'string' && candidate.imageUrl) ||
      catalogRole?.imageUrl,
  };

  return role;
}

function formatRoleId(roleId: string) {
  return roleId
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (character) => character.toLocaleUpperCase());
}
