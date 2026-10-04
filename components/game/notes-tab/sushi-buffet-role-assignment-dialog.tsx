import { Search } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RolePicker } from '@/components/game/notes-tab/role-picker';
import { Text, TextInput } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { PlayerRoleAssignment } from '@/types/game';
import {
  getRoleIdsMentionedByOtherPlayersForDay,
  getRoleOwnerNamesForDay,
  getRolesByIds,
} from '@/utils/role-utils';

export function SushiBuffetRoleAssignmentDialog() {
  const {
    activeDay,
    activePhase,
    focusedPlayer,
    game,
    handleToggleRoleAssignment,
    players,
    roleAssignmentKind,
    roleAssignmentRoleIds,
    showRoles,
  } = useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const [searchQuery, setSearchQuery] = useState('');
  const assignmentKey = `${focusedPlayer?.id ?? ''}:${activeDay}:${activePhase}:${roleAssignmentKind ?? ''}`;

  useEffect(() => {
    if (assignmentKey) {
      setSearchQuery('');
    }
  }, [assignmentKey]);

  const mentionedRoleIds = useMemo(
    () =>
      new Set(
        getRoleIdsMentionedByOtherPlayersForDay(players, focusedPlayer?.id, activeDay, activePhase),
      ),
    [activeDay, activePhase, focusedPlayer?.id, players],
  );

  const roles = useMemo(() => {
    if (!game.script) {
      return [];
    }

    const scriptRolesById = new Map(game.script.roles.map((role) => [role.id, role]));
    const enabledRoleIds = new Set(game.sushiRoleIds ?? game.script.roles.map((role) => role.id));
    const alwaysAvailableRoleIds = new Set([...roleAssignmentRoleIds, ...mentionedRoleIds]);
    const candidateRoles = game.script.roles.filter(
      (role) => enabledRoleIds.has(role.id) || alwaysAvailableRoleIds.has(role.id),
    );
    const missingRoleIds = [...alwaysAvailableRoleIds].filter(
      (roleId) => !scriptRolesById.has(roleId),
    );

    return [
      ...candidateRoles,
      ...getRolesByIds(missingRoleIds, [...game.script.roles, ...roleCatalog]),
    ].filter(
      (role, index, candidateList) =>
        candidateList.findIndex((candidate) => candidate.id === role.id) === index,
    );
  }, [game.script, game.sushiRoleIds, mentionedRoleIds, roleAssignmentRoleIds, roleCatalog]);

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const selectedRoleIds = new Set(roleAssignmentRoleIds);
  const filteredRoles = roles.filter((role) => {
    const alwaysAvailable = mentionedRoleIds.has(role.id) || selectedRoleIds.has(role.id);
    const matchesSearch =
      role.name.toLocaleLowerCase().includes(normalizedQuery) ||
      role.id.toLocaleLowerCase().includes(normalizedQuery);

    return alwaysAvailable || (normalizedQuery.length > 0 && matchesSearch);
  });
  const roleOwnerNames = showRoles
    ? getRoleOwnerNamesForDay(players, activeDay, roles, activePhase)
    : undefined;

  return (
    <View style={styles.container}>
      <Text selectable style={styles.label}>
        Search Sushi Buffet roles
      </Text>
      <View style={styles.searchInputContainer}>
        <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
        <TextInput
          accessibilityLabel="Search Sushi Buffet roles"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setSearchQuery}
          placeholder="Search by role name or ID"
          placeholderTextColor={colors.textSubtle}
          returnKeyType="search"
          style={styles.searchInput}
          value={searchQuery}
        />
      </View>
      {filteredRoles.length > 0 ? (
        <RolePicker
          description={`Tap a role to ${getRoleAssignmentLabel(roleAssignmentKind)} or clear it.`}
          onToggleRole={handleToggleRoleAssignment}
          roles={filteredRoles}
          roleOwnerNames={roleOwnerNames}
          selectedRoleIds={roleAssignmentRoleIds}
          scriptId={game.script?.id}
        />
      ) : !normalizedQuery ? (
        <Text selectable style={styles.message}>
          {roles.length > 0
            ? 'Type to search the enabled roles. Roles used by other players and selected roles stay available.'
            : 'No roles are enabled. Type a role name or ID to check the current selection.'}
        </Text>
      ) : (
        <Text selectable style={styles.message}>
          No matching enabled roles.
        </Text>
      )}
    </View>
  );
}

function getRoleAssignmentLabel(kind: PlayerRoleAssignment['kind'] | null) {
  return kind ? kind.charAt(0).toLocaleUpperCase() + kind.slice(1).toLocaleLowerCase() : 'assign';
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 2,
    paddingVertical: 9,
  },
  searchInputContainer: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
});
