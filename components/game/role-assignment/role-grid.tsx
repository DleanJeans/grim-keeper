import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { RoleKind } from '@/components/game/role-assignment/role-kinds';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

const TOKEN_SIZE = 52;
const TOKEN_BORDER = 2;

const TEAMS = [
  { color: colors.winBarTownsfolk, id: 'townsfolk', label: 'Townsfolk' },
  { color: colors.winBarOutsider, id: 'outsider', label: 'Outsider' },
  { color: colors.winBarMinion, id: 'minion', label: 'Minion' },
  { color: colors.winBarDemon, id: 'demon', label: 'Demon' },
] as const;

type TabId = (typeof TEAMS)[number]['id'] | 'traveller' | 'other';

type RoleGridProps = {
  kind: RoleKind;
  query: string;
  roleOwnerNames?: Record<string, string[]>;
  roles: Role[];
  selectedRoleIds: string[];
  /** The Traveller tab's content; the tab is left out without it. */
  travelerPicker?: ReactNode;
  onToggleRole: (roleId: string) => void;
};

/** Roles as a grid of tokens, one team tab at a time, or every team at once while searching. */
export function RoleGrid({
  kind,
  onToggleRole,
  query,
  roleOwnerNames,
  roles,
  selectedRoleIds,
  travelerPicker,
}: RoleGridProps) {
  const selectedIds = new Set(selectedRoleIds);
  const otherRoles = roles.filter((role) => !getTeam(role));
  const tabs: { color: string; count: number | null; id: TabId; label: string }[] = [
    ...TEAMS.map((team) => ({
      color: team.color,
      count: roles.filter((role) => getTeam(role) === team.id && !isGeneric(role)).length,
      id: team.id,
      label: team.label,
    })),
    ...(otherRoles.length > 0
      ? [
          {
            color: colors.statusTraveller,
            count: otherRoles.length,
            id: 'other' as const,
            label: 'Other',
          },
        ]
      : []),
    ...(travelerPicker
      ? [
          {
            color: colors.statusTraveller,
            count: null,
            id: 'traveller' as const,
            label: 'Traveller',
          },
        ]
      : []),
  ];
  const selectedTeam = tabs.find((tab) =>
    roles.some((role) => selectedIds.has(role.id) && (getTeam(role) ?? 'other') === tab.id),
  );
  const [tabId, setTabId] = useState<TabId>(selectedTeam?.id ?? 'townsfolk');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const searching = normalizedQuery.length > 0;
  const matches = searching
    ? roles.filter(
        (role) =>
          role.name.toLocaleLowerCase().includes(normalizedQuery) ||
          role.id.toLocaleLowerCase().includes(normalizedQuery),
      )
    : [];
  const tabRoles = roles.filter((role) => (getTeam(role) ?? 'other') === tabId);

  return (
    <View style={styles.container}>
      {searching ? (
        <Text style={styles.matchCount}>
          {matches.length === 1 ? '1 match' : `${matches.length} matches`} in all teams
        </Text>
      ) : (
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab.id === tabId }}
              key={tab.id}
              onPress={() => setTabId(tab.id)}
              style={styles.tab}
            >
              <Text style={[styles.tabLabel, tab.id === tabId && tabStyles[tab.id].label]}>
                {tab.label}
              </Text>
              <Text style={styles.tabCount}>{tab.count ?? '+'}</Text>
              {tab.id === tabId ? (
                <View style={[styles.tabUnderline, tabStyles[tab.id].underline]} />
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        {!searching && tabId === 'traveller' ? (
          travelerPicker
        ) : (
          <View style={styles.grid}>
            {(searching ? matches : tabRoles).map((role) => (
              <RoleCell
                kind={kind}
                key={role.id}
                onPress={() => onToggleRole(role.id)}
                ownerNames={roleOwnerNames?.[role.id]}
                role={role}
                selected={selectedIds.has(role.id)}
                teamLabel={searching ? getTeamLabel(role) : undefined}
              />
            ))}
            {searching && matches.length === 0 ? (
              <Text style={styles.empty}>No character matches “{query.trim()}”.</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function RoleCell({
  kind,
  onPress,
  ownerNames,
  role,
  selected,
  teamLabel,
}: {
  kind: RoleKind;
  onPress: () => void;
  ownerNames?: string[];
  role: Role;
  selected: boolean;
  teamLabel?: string;
}) {
  return (
    <Pressable
      accessibilityLabel={`${selected ? 'Remove' : 'Select'} ${role.name}${ownerNames?.length ? `. Claimed or confirmed by ${ownerNames.join(', ')}` : ''}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
    >
      <View
        style={[
          styles.token,
          isGeneric(role) && styles.genericToken,
          selected && kindStyles[kind].selectedToken,
        ]}
      >
        <RoleIcon role={role} scale={1.3} size={TOKEN_SIZE - TOKEN_BORDER * 2} />
      </View>
      <Text numberOfLines={2} style={[styles.name, selected && kindStyles[kind].selectedName]}>
        {role.name}
      </Text>
      {teamLabel ? <Text style={styles.teamLabel}>{teamLabel}</Text> : null}
      {ownerNames?.length ? (
        <Text numberOfLines={1} style={styles.owners}>
          {ownerNames.join(', ')}
        </Text>
      ) : null}
    </Pressable>
  );
}

function getTeam(role: Role) {
  const team = role.team?.toLocaleLowerCase();
  return TEAMS.find((candidate) => candidate.id === team)?.id;
}

function getTeamLabel(role: Role) {
  return TEAMS.find((candidate) => candidate.id === getTeam(role))?.label;
}

function isGeneric(role: Role) {
  return role.id.startsWith('generic_');
}

function createKindStyles(color: string) {
  return StyleSheet.create({
    selectedName: { color },
    selectedToken: { borderColor: color, boxShadow: `0 0 0 3px ${color}40` },
  });
}

const kindStyles: Record<RoleKind, ReturnType<typeof createKindStyles>> = {
  claim: createKindStyles(colors.roleClaim),
  confirm: createKindStyles(colors.roleConfirm),
  guess: createKindStyles(colors.roleGuess),
  rumor: createKindStyles(colors.roleRumor),
};

const tabStyles = {
  townsfolk: createTabStyles(colors.winBarTownsfolk),
  outsider: createTabStyles(colors.winBarOutsider),
  minion: createTabStyles(colors.winBarMinion),
  demon: createTabStyles(colors.winBarDemon),
  traveller: createTabStyles(colors.statusTraveller),
  other: createTabStyles(colors.statusTraveller),
};

function createTabStyles(color: string) {
  return StyleSheet.create({ label: { color }, underline: { backgroundColor: color } });
}

const styles = StyleSheet.create({
  cell: { alignItems: 'center', gap: 3, paddingVertical: 6, width: '25%' },
  cellPressed: { backgroundColor: colors.gameSurfacePressed, borderRadius: 10 },
  container: { flex: 1, minHeight: 0 },
  empty: {
    color: colors.gameTextMuted,
    fontSize: 13,
    padding: 16,
    textAlign: 'center',
    width: '100%',
  },
  genericToken: { borderStyle: 'dashed' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  matchCount: {
    color: colors.gameTextMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textTransform: 'uppercase',
  },
  name: {
    color: colors.gameText,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
  },
  owners: { color: colors.gameTextMuted, fontSize: 11, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 10, paddingBottom: 16 },
  tab: { alignItems: 'center', flex: 1, paddingBottom: 7, paddingTop: 8 },
  tabCount: { color: colors.gameTextSubtle, fontSize: 10, fontWeight: '700' },
  tabLabel: { color: colors.gameTextMuted, fontSize: 12, fontWeight: '800' },
  tabs: { borderBottomColor: colors.gameBorder, borderBottomWidth: 1, flexDirection: 'row' },
  tabUnderline: {
    borderRadius: 2,
    bottom: -1,
    height: 2.5,
    left: '16%',
    position: 'absolute',
    right: '16%',
  },
  teamLabel: { color: colors.gameTextMuted, fontSize: 10, fontWeight: '800' },
  token: {
    alignItems: 'center',
    backgroundColor: colors.roleInfoTokenBackground,
    borderColor: colors.gameBorder,
    borderRadius: TOKEN_SIZE / 2,
    borderWidth: TOKEN_BORDER,
    height: TOKEN_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: TOKEN_SIZE,
  },
});
