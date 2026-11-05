import { ChevronDown, ChevronUp, MoveDiagonal } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DjGameButton } from '@/components/game/dj-game-button';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { RevealRolesButton } from '@/components/game/reveal-roles-button';
import { RoleDisplayModes, roleDisplayModes } from '@/components/game/role-display-modes';
import { SuspectFilterButton } from '@/components/game/suspect-filter-button';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { RoleDisplayMode } from '@/types/game';

type MapToolbarProps = {
  djEnabled: boolean;
  onToggleSuspectFilter: () => void;
  suspectFilter: boolean;
};

/** Controls that change the map, in one slim row right under it. */
export function MapToolbar({ djEnabled, onToggleSuspectFilter, suspectFilter }: MapToolbarProps) {
  const {
    activeRoleDisplayModes,
    enterRearrangeMode,
    game,
    isRearrangeMode,
    setShowRoles,
    showRoles,
  } = useGameRouteContext();
  const [modesOpen, setModesOpen] = useState(false);
  const canPickModes = !!game.script && showRoles;

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {canPickModes ? (
          <ShowModesChip
            modes={activeRoleDisplayModes}
            onPress={() => setModesOpen((open) => !open)}
            open={modesOpen}
          />
        ) : null}
        <View style={styles.spacer} />
        {isRearrangeMode ? null : (
          <Pressable
            accessibilityLabel="Enter rearrange mode"
            accessibilityRole="button"
            hitSlop={6}
            onPress={enterRearrangeMode}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <MoveDiagonal color={colors.gameText} size={18} strokeWidth={2.6} />
          </Pressable>
        )}
        {showRoles ? (
          <SuspectFilterButton active={suspectFilter} onToggle={onToggleSuspectFilter} />
        ) : null}
        {djEnabled ? <DjGameButton gameId={game.id} /> : null}
        <RevealRolesButton onRevealRolesChange={setShowRoles} showRoles={showRoles} />
      </View>
      {canPickModes && modesOpen ? <RoleDisplayModes /> : null}
    </View>
  );
}

function ShowModesChip({
  modes,
  onPress,
  open,
}: {
  modes: RoleDisplayMode[];
  onPress: () => void;
  open: boolean;
}) {
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <Pressable
      accessibilityHint="Chooses which kinds of role notes show on the map"
      accessibilityLabel={`Show on map: ${getModesSummary(modes)}`}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        open && styles.chipOpen,
        pressed && styles.iconButtonPressed,
      ]}
    >
      <Text numberOfLines={1} style={styles.chipLabel}>
        <Text style={styles.chipPrefix}>Show: </Text>
        {getModesSummary(modes)}
      </Text>
      <Chevron color={colors.gameTextMuted} size={16} strokeWidth={2.6} />
    </Pressable>
  );
}

function getModesSummary(modes: RoleDisplayMode[]) {
  if (modes.includes('all')) {
    return 'All';
  }
  const labels = roleDisplayModes
    .filter(({ value }) => modes.includes(value))
    .map(({ label }) => label);
  return labels.length > 0 ? labels.join(', ') : 'None';
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    flexShrink: 1,
    gap: 4,
    height: 36,
    minWidth: 0,
    paddingLeft: 12,
    paddingRight: 8,
  },
  chipLabel: { color: colors.gameText, flexShrink: 1, fontSize: 13, fontWeight: '800' },
  chipOpen: { borderColor: colors.gameTextMuted },
  chipPrefix: { color: colors.gameTextMuted, fontWeight: '700' },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconButtonPressed: { backgroundColor: colors.gameSurfacePressed },
  root: { gap: 8 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  spacer: { flex: 1 },
});
