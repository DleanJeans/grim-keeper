import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Player, Role, StoredScript } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import {
  getRoleAssignmentForDay,
  getRoleAssignmentForDayOrPrevious,
  getRolesByIds,
  isTravelerRole,
} from '@/utils/role-utils';

type FriendGamesListProps = {
  games: Game[];
  friendName: string;
  roleCatalog: Role[];
  scripts: StoredScript[];
};

type GameEntry = {
  game: Game;
  playerId: string;
  claimedRoleIds: string[];
  playedRoleIds: string[];
};

export function FriendGamesList({ games, friendName, roleCatalog, scripts }: FriendGamesListProps) {
  const entries = useMemo(
    () => collectEntries(games, friendName, roleCatalog, scripts),
    [friendName, games, roleCatalog, scripts],
  );

  if (entries.length === 0) {
    return (
      <Text selectable style={{ color: colors.textMuted, fontSize: 15 }}>
        No games yet.
      </Text>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {entries.map((entry) => (
        <FriendGameRow key={entry.game.id} entry={entry} />
      ))}
    </View>
  );
}

function FriendGameRow({ entry }: { entry: GameEntry }) {
  const { game, playerId, claimedRoleIds, playedRoleIds } = entry;
  const scriptName = game.script?.name ?? 'Untitled game';
  const formattedDate = formatGameDate(game.createdAt);
  const roles = game.script?.roles ?? [];
  const claimedRoles = getRolesByIds(claimedRoleIds, roles);
  const playedRoles = getRolesByIds(playedRoleIds, roles);

  return (
    <Pressable
      accessibilityHint="Opens this game with this player focused"
      accessibilityLabel={`${scriptName}, ${formattedDate}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/game/[id]', params: { id: game.id, playerId } })}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.surfacePressed : colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
        padding: 12,
      })}
    >
      <View style={{ gap: 2 }}>
        <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>
          {scriptName}
        </Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>
          {formattedDate}
        </Text>
      </View>

      {sameRoles(claimedRoles, playedRoles) || isAllTraveler(playedRoles) ? null : (
        <RoleLine label="Claimed" roles={claimedRoles} />
      )}
      <RoleLine label="Started as" roles={playedRoles} />
    </Pressable>
  );
}

function RoleLine({ label, roles }: { label: string; roles: Role[] }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
      <Text
        selectable
        style={{
          color: colors.textMuted,
          flexShrink: 0,
          fontSize: 11,
          fontWeight: '900',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          width: 78,
        }}
      >
        {label}
      </Text>
      {roles.length === 0 ? (
        <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontStyle: 'italic' }}>
          —
        </Text>
      ) : (
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {roles.map((role) => (
            <RoleReference
              iconSize={18}
              key={role.id}
              role={role}
              textStyle={{ color: colors.text, fontSize: 13, fontWeight: '700' }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function collectEntries(
  games: Game[],
  friendName: string,
  roleCatalog: Role[],
  scripts: StoredScript[],
): GameEntry[] {
  const targetKey = normalizePlayerName(friendName).toLocaleLowerCase();
  const entries: GameEntry[] = [];

  for (const game of games) {
    const player = game.players.find(
      (candidate) =>
        !candidate.isAppUser &&
        normalizePlayerName(candidate.name).toLocaleLowerCase() === targetKey,
    );

    if (!player) {
      continue;
    }

    const roles = resolveGameRoles(game, roleCatalog, scripts);
    entries.push({
      game,
      playerId: player.id,
      claimedRoleIds: collectClaimedRoleIds(player, roles),
      playedRoleIds: collectPlayedRoleIds(player, roles),
    });
  }

  return entries.sort(
    (first, second) =>
      new Date(second.game.createdAt).getTime() - new Date(first.game.createdAt).getTime(),
  );
}

function resolveGameRoles(game: Game, roleCatalog: Role[], scripts: StoredScript[]): Role[] {
  if (game.script?.roles?.length) {
    return game.script.roles;
  }

  if (game.script?.id) {
    const script = scripts.find((candidate) => candidate.id === game.script?.id);
    if (script?.roles?.length) {
      return script.roles;
    }
  }

  return roleCatalog;
}

function collectClaimedRoleIds(player: Player, roles: Role[]): string[] {
  const ids = new Set<string>();
  const claims = (player.roleAssignments ?? []).filter((assignment) => assignment.kind === 'claim');

  for (const assignment of claims) {
    for (const roleId of assignment.roleIds) {
      if (getRolesByIds([roleId], roles).length > 0) {
        ids.add(roleId);
      }
    }
  }

  return [...ids];
}

function collectPlayedRoleIds(player: Player, roles: Role[]): string[] {
  const confirms = (player.roleAssignments ?? [])
    .filter((assignment) => assignment.kind === 'confirm')
    .sort((first, second) => first.day - second.day);

  if (confirms.length === 0) {
    return [];
  }

  const lastDay = confirms[confirms.length - 1].day;
  const finalConfirm = getRoleAssignmentForDay(player.roleAssignments, lastDay, 'confirm');
  if (finalConfirm) {
    return dedupe(finalConfirm.roleIds, roles);
  }

  const fallback = getRoleAssignmentForDayOrPrevious(player.roleAssignments, lastDay, 'confirm');
  return fallback ? dedupe(fallback.roleIds, roles) : [];
}

function dedupe(roleIds: string[], roles: Role[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const roleId of roleIds) {
    if (seen.has(roleId)) {
      continue;
    }

    seen.add(roleId);
    output.push(roleId);
  }

  return output;
}

function sameRoles(first: Role[], second: Role[]) {
  if (first.length !== second.length) {
    return false;
  }

  const ids = new Set(first.map((role) => role.id));
  return second.every((role) => ids.has(role.id));
}

function isAllTraveler(roles: Role[]) {
  return roles.length > 0 && roles.every(isTravelerRole);
}

function formatGameDate(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    weekday: 'long',
    year: 'numeric',
  }).format(date);
}
