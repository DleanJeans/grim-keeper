import { Search } from 'lucide-react-native';
import { type ReactElement, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ScriptRoleList } from '@/components/scripts/script-role-list';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import { getReferencedRoleIdsForDayOrPrevious } from '@/utils/role-utils';

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

  return (
    <ScriptRoleList
      header={
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
          <SushiBuffetRoleFilterToggle
            onToggle={() => setOnlyReferencedRoles(!onlyReferencedRoles)}
            selected={onlyReferencedRoles}
          />
        </View>
      }
      roleCatalog={roleCatalog}
      roles={filteredRoles}
      scriptId={scriptId}
    />
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
