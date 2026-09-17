import { Search } from 'lucide-react-native';
import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ScriptRoleList, type ScriptRoleSortMode } from '@/components/scripts/script-role-list';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import { getReferencedRoleIdsForDayOrPrevious } from '@/utils/role-utils';

const ROLE_TEAM_FILTERS = [
  { label: 'Townsfolks', team: 'townsfolk' },
  { label: 'Outsiders', team: 'outsider' },
  { label: 'Minions', team: 'minion' },
  { label: 'Demons', team: 'demon' },
] as const;

type SushiBuffetRoleTeam = (typeof ROLE_TEAM_FILTERS)[number]['team'];

export function SushiBuffetScriptRoleList({
  activeDay,
  header,
  players,
  roleCatalog,
  roles,
  scriptId,
}: {
  activeDay: number;
  header: ReactElement;
  players: Player[];
  roleCatalog: Role[];
  roles: Role[];
  scriptId: string;
}) {
  const [onlyReferencedRoles, setOnlyReferencedRoles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<SushiBuffetRoleTeam>('townsfolk');
  const referencedRoleIds = useMemo(
    () => new Set(getReferencedRoleIdsForDayOrPrevious(players, activeDay, roles)),
    [activeDay, players, roles],
  );
  const filteredRoles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return roles.filter((role) => {
      const matchesSearch =
        !normalizedQuery ||
        role.name.toLocaleLowerCase().includes(normalizedQuery) ||
        role.id.toLocaleLowerCase().includes(normalizedQuery);
      const matchesReferencedFilter = !onlyReferencedRoles || referencedRoleIds.has(role.id);

      return matchesSearch && matchesReferencedFilter;
    });
  }, [onlyReferencedRoles, referencedRoleIds, roles, searchQuery]);
  const roleFilter = useCallback(
    (nextRoles: Role[], sortMode: ScriptRoleSortMode) =>
      sortMode === 'night-order'
        ? nextRoles
        : nextRoles.filter((role) => role.team?.toLocaleLowerCase() === selectedTeam),
    [selectedTeam],
  );

  return (
    <ScriptRoleList
      header={(sortMode: ScriptRoleSortMode) => (
        <View style={styles.headerContent}>
          {header}
          <View style={styles.filters}>
            <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
            <TextInput
              accessibilityLabel="Search Sushi Buffet roles"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchQuery}
              placeholder="Search roles"
              placeholderTextColor={colors.textSubtle}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>
          {sortMode === 'current-split' ? (
            <View accessibilityRole="tablist" style={styles.tabs}>
              {ROLE_TEAM_FILTERS.map(({ label, team }) => (
                <SushiBuffetRoleTeamTab
                  key={team}
                  label={label}
                  onPress={() => setSelectedTeam(team)}
                  selected={selectedTeam === team}
                />
              ))}
            </View>
          ) : null}
          <SushiBuffetRoleFilterToggle
            onToggle={() => setOnlyReferencedRoles(!onlyReferencedRoles)}
            selected={onlyReferencedRoles}
          />
        </View>
      )}
      roleFilter={roleFilter}
      roleCatalog={roleCatalog}
      roles={filteredRoles}
      scriptId={scriptId}
    />
  );
}

function SushiBuffetRoleTeamTab({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`Show ${label.toLocaleLowerCase()} roles`}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        pressed && styles.tabPressed,
        selected && styles.tabSelected,
      ]}
    >
      <Text selectable style={[styles.tabText, selected && styles.tabTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SushiBuffetRoleFilterToggle({
  onToggle,
  selected,
}: {
  onToggle: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel="Only referenced roles"
      accessibilityRole="switch"
      accessibilityState={{ checked: selected }}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.toggleButton,
        pressed && styles.toggleButtonPressed,
        selected && styles.toggleButtonSelected,
      ]}
    >
      <Text selectable style={[styles.toggleText, selected && styles.toggleTextSelected]}>
        Only referenced roles
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  headerContent: {
    gap: 10,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    minHeight: 42,
    paddingVertical: 10,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 4,
  },
  tabPressed: {
    backgroundColor: colors.surfacePressed,
  },
  tabSelected: {
    backgroundColor: colors.inputText,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  tabTextSelected: {
    color: colors.onPrimary,
  },
  tabs: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    overflow: 'hidden',
    padding: 4,
  },
  toggleButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  toggleButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  toggleButtonSelected: {
    backgroundColor: colors.inputText,
    borderColor: colors.inputText,
  },
  toggleText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  toggleTextSelected: {
    color: colors.onPrimary,
  },
});
