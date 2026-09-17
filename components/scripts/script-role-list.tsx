import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { RoleIcon } from '@/components/role-icon';
import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { AnimatedScriptRoleRow } from '@/components/scripts/animated-script-role-row';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { DESKTOP_CONTENT_MAX_WIDTH } from '@/utils/responsive-utils';
import { fetchNightSheet } from '@/utils/script-service';
import {
  getScriptRoleEntries,
  type NightSheet,
  type ScriptRoleEntry,
  type ScriptRoleNote,
  sortScriptRoleEntriesByNightOrder,
} from '@/utils/script-utils';

const ROLE_SECTIONS = [
  { label: 'Townsfolk', team: 'townsfolk' },
  { label: 'Outsider', team: 'outsider' },
  { label: 'Minion', team: 'minion' },
  { label: 'Demon', team: 'demon' },
] as const;

export type ScriptRoleSortMode = 'current-split' | 'night-order';
type ScriptRoleNightTab = 'first-night' | 'other-night';
type ScriptRoleRow = ScriptRoleEntry[];
type ScriptRoleSection = {
  data: ScriptRoleRow[];
  title: string;
};
export type ScriptRoleHeader = ReactElement | ((sortMode: ScriptRoleSortMode) => ReactElement);
type ScriptRoleFilter = (roles: Role[], sortMode: ScriptRoleSortMode) => Role[];

export function ScriptRoleList({
  header,
  roleFilter,
  roleCatalog,
  roles,
  scriptId,
}: {
  header: ScriptRoleHeader;
  roleFilter?: ScriptRoleFilter;
  roleCatalog: Role[];
  roles: Role[];
  scriptId: string;
}) {
  const savedNotes = useGameStore((state) => state.savedNotes);
  const [sortMode, setSortMode] = useState<ScriptRoleSortMode>('current-split');
  const [nightTab, setNightTab] = useState<ScriptRoleNightTab>('first-night');
  const [twoColumns, setTwoColumns] = useState(false);
  const [notesOnly, setNotesOnly] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [nightSheet, setNightSheet] = useState<NightSheet | null>(null);
  const [rowLayoutAnimationEnabled, setRowLayoutAnimationEnabled] = useState(true);

  useEffect(() => {
    if (rowLayoutAnimationEnabled) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setRowLayoutAnimationEnabled(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [rowLayoutAnimationEnabled]);

  useEffect(() => {
    let active = true;

    fetchNightSheet()
      .then((nextNightSheet) => {
        if (active) {
          setNightSheet(nextNightSheet);
        }
      })
      .catch(() => {
        // Stored script order remains available when the nightsheet is offline.
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleRoles = useMemo(
    () => (roleFilter ? roleFilter(roles, sortMode) : roles),
    [roleFilter, roles, sortMode],
  );
  const roleEntries = useMemo(
    () => getScriptRoleEntries(visibleRoles, roleCatalog, savedNotes),
    [roleCatalog, savedNotes, visibleRoles],
  );
  const supportedRoleEntries = useMemo(
    () =>
      roleEntries.filter((entry) =>
        ROLE_SECTIONS.some(({ team }) => entry.role.team?.toLocaleLowerCase() === team),
      ),
    [roleEntries],
  );
  const visibleRoleEntries = useMemo(
    () =>
      notesOnly
        ? supportedRoleEntries.filter((entry) => entry.noteCount > 0)
        : supportedRoleEntries,
    [notesOnly, supportedRoleEntries],
  );
  const sections = useMemo<ScriptRoleSection[]>(() => {
    if (sortMode === 'night-order') {
      const nightName = nightTab === 'first-night' ? 'firstNight' : 'otherNight';
      const nightRoleIds = new Set(nightSheet?.[nightName] ?? []);
      const allNightRoleIds = new Set([
        ...(nightSheet?.firstNight ?? []),
        ...(nightSheet?.otherNight ?? []),
      ]);
      const tabEntries = nightSheet
        ? visibleRoleEntries.filter(({ role }) =>
            nightTab === 'first-night'
              ? nightRoleIds.has(role.id)
              : nightRoleIds.has(role.id) || !allNightRoleIds.has(role.id),
          )
        : visibleRoleEntries;

      return [
        {
          data: chunkEntries(
            sortScriptRoleEntriesByNightOrder(tabEntries, nightSheet, nightName),
            1,
          ),
          title: nightTab === 'first-night' ? 'First night' : 'Other nights',
        },
      ];
    }

    return ROLE_SECTIONS.map(({ label, team }) => ({
      data: chunkEntries(
        visibleRoleEntries.filter((entry) => entry.role.team?.toLocaleLowerCase() === team),
        twoColumns && !showNotes ? 2 : 1,
      ),
      title: label,
    })).filter(({ data }) => data.length > 0);
  }, [nightSheet, nightTab, showNotes, sortMode, twoColumns, visibleRoleEntries]);

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainer}
      extraData={{ rowLayoutAnimationEnabled, showNotes, sortMode, twoColumns }}
      keyExtractor={getScriptRoleRowKey}
      ListEmptyComponent={
        <Text selectable style={styles.emptyText}>
          {notesOnly ? 'No roles with notes.' : 'No roles found.'}
        </Text>
      }
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <ScriptRoleListHeader
            header={typeof header === 'function' ? header(sortMode) : header}
            notesOnly={notesOnly}
            nightTab={nightTab}
            onNotesOnlyChange={setNotesOnly}
            onNightTabChange={setNightTab}
            onShowNotesChange={(value) => {
              setShowNotes(value);
              setRowLayoutAnimationEnabled(false);
              if (value) {
                setTwoColumns(false);
              }
            }}
            onSortModeChange={setSortMode}
            onTwoColumnsChange={setTwoColumns}
            showNotes={showNotes}
            sortMode={sortMode}
            twoColumns={twoColumns}
          />
        </View>
      }
      renderItem={({ item }) => (
        <AnimatedScriptRoleRow animateLayout={rowLayoutAnimationEnabled} style={styles.roleRow}>
          {item.map((entry) => (
            <View key={entry.role.id} style={styles.roleCell}>
              <Animated.View
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(140)}
                style={styles.animatedRoleCard}
              >
                <ScriptRoleDetail
                  description={entry.description}
                  notes={entry.notes}
                  noteCount={entry.noteCount}
                  onPress={() =>
                    router.push({
                      pathname: '/role-notes',
                      params: { roleId: entry.role.id, scriptId },
                    })
                  }
                  role={entry.role}
                  roles={visibleRoles}
                  scriptId={scriptId}
                  showNotes={showNotes}
                  twoColumns={sortMode === 'current-split' && twoColumns && !showNotes}
                />
              </Animated.View>
            </View>
          ))}
        </AnimatedScriptRoleRow>
      )}
      renderSectionHeader={({ section }) =>
        sortMode === 'current-split' ? <ScriptRoleSectionHeader label={section.title} /> : null
      }
      sections={sections}
      stickySectionHeadersEnabled={sortMode === 'current-split'}
      style={styles.screen}
    />
  );
}

const styles = StyleSheet.create({
  animatedRoleCard: {
    flex: 1,
  },
  controlGroup: {
    gap: 8,
  },
  controlLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  contentContainer: {
    alignSelf: 'center',
    maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
    paddingBottom: 40,
    paddingHorizontal: 20,
    width: '100%',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    paddingVertical: 20,
    textAlign: 'center',
  },
  headerContent: {
    gap: 14,
  },
  inlineNote: {
    gap: 2,
  },
  inlineNotePlayer: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  inlineNoteText: {
    color: colors.noteText,
    fontSize: 13,
    lineHeight: 18,
  },
  inlineNotes: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: 6,
    paddingTop: 10,
  },
  inlineNotesLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  listHeader: {
    paddingBottom: 8,
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    padding: 12,
  },
  roleCardPressed: {
    opacity: 0.65,
  },
  roleCell: {
    flex: 1,
    minWidth: 0,
  },
  roleDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  roleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  roleLink: {
    gap: 10,
  },
  roleName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  roleNameContainer: {
    flex: 1,
  },
  roleNotesLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  roleNoteCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 10,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingBottom: 10,
    paddingTop: 10,
  },
  sectionHeaderText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  segmentedControl: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    overflow: 'hidden',
    padding: 4,
  },
  sortButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 8,
  },
  toggleButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
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
  toggleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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

function chunkEntries(entries: ScriptRoleEntry[], chunkSize: number) {
  const rows: ScriptRoleRow[] = [];

  for (let index = 0; index < entries.length; index += chunkSize) {
    rows.push(entries.slice(index, index + chunkSize));
  }

  return rows;
}

function getScriptRoleRowKey(row: ScriptRoleRow) {
  return row[0]?.role.id ?? 'empty-role-row';
}

function ScriptRoleListHeader({
  header,
  nightTab,
  notesOnly,
  onNotesOnlyChange,
  onNightTabChange,
  onShowNotesChange,
  onSortModeChange,
  onTwoColumnsChange,
  showNotes,
  sortMode,
  twoColumns,
}: {
  header: ReactElement;
  nightTab: ScriptRoleNightTab;
  notesOnly: boolean;
  onNotesOnlyChange: (value: boolean) => void;
  onNightTabChange: (value: ScriptRoleNightTab) => void;
  onShowNotesChange: (value: boolean) => void;
  onSortModeChange: (value: ScriptRoleSortMode) => void;
  onTwoColumnsChange: (value: boolean) => void;
  showNotes: boolean;
  sortMode: ScriptRoleSortMode;
  twoColumns: boolean;
}) {
  return (
    <View style={styles.headerContent}>
      {header}
      <View style={styles.controlGroup}>
        <Text selectable style={styles.controlLabel}>
          Sort roles
        </Text>
        <View
          accessibilityLabel="Role sort mode"
          accessibilityRole="toolbar"
          style={styles.segmentedControl}
        >
          <ScriptRoleSortButton
            label="By team"
            onPress={() => onSortModeChange('current-split')}
            selected={sortMode === 'current-split'}
          />
          <ScriptRoleSortButton
            label="Night order"
            onPress={() => onSortModeChange('night-order')}
            selected={sortMode === 'night-order'}
          />
        </View>
      </View>
      {sortMode === 'night-order' ? (
        <View
          accessibilityLabel="Night order tab"
          accessibilityRole="toolbar"
          style={styles.segmentedControl}
        >
          <ScriptRoleNightTabButton
            label="First night"
            onPress={() => onNightTabChange('first-night')}
            selected={nightTab === 'first-night'}
          />
          <ScriptRoleNightTabButton
            label="Other nights"
            onPress={() => onNightTabChange('other-night')}
            selected={nightTab === 'other-night'}
          />
        </View>
      ) : null}
      <View style={styles.toggleList}>
        <ScriptRoleToggle
          label="Only roles with notes"
          onToggle={() => onNotesOnlyChange(!notesOnly)}
          selected={notesOnly}
        />
        <ScriptRoleToggle
          label="Show notes inline"
          onToggle={() => onShowNotesChange(!showNotes)}
          selected={showNotes}
        />
        {sortMode === 'current-split' && !showNotes ? (
          <ScriptRoleToggle
            label="Two columns"
            onToggle={() => onTwoColumnsChange(!twoColumns)}
            selected={twoColumns}
          />
        ) : null}
      </View>
    </View>
  );
}

function ScriptRoleNightTabButton({
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
        styles.sortButton,
        pressed && styles.toggleButtonPressed,
        selected && styles.toggleButtonSelected,
      ]}
    >
      <Text selectable style={[styles.toggleText, selected && styles.toggleTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ScriptRoleSortButton({
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
      accessibilityLabel={`Sort roles by ${label.toLocaleLowerCase()}`}
      accessibilityRole="togglebutton"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sortButton,
        pressed && styles.toggleButtonPressed,
        selected && styles.toggleButtonSelected,
      ]}
    >
      <Text selectable style={[styles.toggleText, selected && styles.toggleTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ScriptRoleToggle({
  label,
  onToggle,
  selected,
}: {
  label: string;
  onToggle: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
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
        {label}
      </Text>
    </Pressable>
  );
}

function ScriptRoleSectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text selectable style={styles.sectionHeaderText}>
        {label}
      </Text>
    </View>
  );
}

function ScriptRoleDetail({
  description,
  notes,
  noteCount,
  onPress,
  role,
  roles,
  scriptId,
  showNotes,
  twoColumns,
}: {
  description?: string;
  notes: ScriptRoleNote[];
  noteCount: number;
  onPress: () => void;
  role: Role;
  roles: Role[];
  scriptId: string;
  showNotes: boolean;
  twoColumns: boolean;
}) {
  return (
    <View style={styles.roleCard}>
      <Pressable
        accessibilityHint="Opens notes for this role"
        accessibilityLabel={`${role.name} notes`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.roleLink, pressed && styles.roleCardPressed]}
      >
        <View style={styles.roleHeader}>
          <RoleIcon role={role} size={42} />
          <View style={styles.roleNameContainer}>
            <Text selectable style={styles.roleName}>
              {role.name}
            </Text>
            {twoColumns ? (
              <View style={styles.roleNotesLink}>
                <Text selectable style={styles.roleNoteCount}>
                  {noteCount} notes
                </Text>
                <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
              </View>
            ) : null}
          </View>
          {twoColumns ? null : (
            <>
              <Text selectable style={styles.roleNoteCount}>
                {noteCount} notes
              </Text>
              <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
            </>
          )}
        </View>
        <Text selectable style={styles.roleDescription}>
          {description ?? 'No description available.'}
        </Text>
      </Pressable>
      {showNotes && notes.length > 0 ? (
        <View style={styles.inlineNotes}>
          <Text selectable style={styles.inlineNotesLabel}>
            Notes
          </Text>
          {notes.map((note) => (
            <View key={note.text} style={styles.inlineNote}>
              {note.playerNames.length > 0 ? (
                <Text selectable style={styles.inlineNotePlayer}>
                  {note.playerNames.join(', ')}:
                </Text>
              ) : null}
              <RoleReferencedNoteText
                roles={roles}
                scriptId={scriptId}
                style={styles.inlineNoteText}
                text={note.text}
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
