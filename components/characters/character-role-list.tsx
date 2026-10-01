import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CharacterTeamFilterButton } from '@/components/characters/character-team-filter-button';
import { ScriptRoleList } from '@/components/scripts/script-role-list';
import { Text, TextInput } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';

const ROLE_TEAM_FILTERS = [
  { label: 'Townsfolk', team: 'townsfolk' },
  { label: 'Outsider', team: 'outsider' },
  { label: 'Minion', team: 'minion' },
  { label: 'Demon', team: 'demon' },
] as const;

type CharacterRoleTeam = (typeof ROLE_TEAM_FILTERS)[number]['team'];

export function CharacterRoleList() {
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<CharacterRoleTeam | null>(null);
  const filteredRoles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return roleCatalog.filter(
      (role) =>
        (selectedTeam === null || role.team?.toLocaleLowerCase() === selectedTeam) &&
        (!normalizedQuery ||
          role.name.toLocaleLowerCase().includes(normalizedQuery) ||
          role.id.toLocaleLowerCase().includes(normalizedQuery) ||
          role.ability?.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [roleCatalog, searchQuery, selectedTeam]);

  return (
    <ScriptRoleList
      header={
        <View style={styles.headerContent}>
          <Text selectable style={styles.roleCount}>
            {roleCatalog.length} characters
          </Text>
          <View style={styles.searchField}>
            <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
            <TextInput
              accessibilityLabel="Search characters"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchQuery}
              placeholder="Search characters"
              placeholderTextColor={colors.textSubtle}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>
          <View
            accessibilityLabel="Filter characters by team"
            accessibilityRole="toolbar"
            style={styles.teamFilters}
          >
            {ROLE_TEAM_FILTERS.map(({ label, team }) => (
              <CharacterTeamFilterButton
                key={team}
                label={label}
                onPress={() => setSelectedTeam(selectedTeam === team ? null : team)}
                selected={selectedTeam === team}
              />
            ))}
          </View>
        </View>
      }
      includeOtherTeams
      roleCatalog={roleCatalog}
      roles={filteredRoles}
    />
  );
}

const styles = StyleSheet.create({
  headerContent: {
    gap: 10,
  },
  roleCount: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  searchField: {
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
  searchInput: {
    color: colors.text,
    flex: 1,
    minHeight: 42,
    paddingVertical: 10,
  },
  teamFilters: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    overflow: 'hidden',
    padding: 4,
  },
});
