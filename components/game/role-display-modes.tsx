import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, RoleDisplayMode } from '@/types/game';
import {
  getLatestRumorMapDisplaysForDayOrPrevious,
  getRoleAssignmentForDayOrPrevious,
} from '@/utils/role-utils';

const roleDisplayModes: {
  label: string;
  value: RoleDisplayMode;
}[] = [
  { label: 'Confirm', value: 'confirm' },
  { label: 'Claim', value: 'claim' },
  { label: 'Rumor', value: 'rumor' },
  { label: 'Guess', value: 'guess' },
];

export function RoleDisplayModes() {
  const { activeDay, activeRoleDisplayMode, game, setActiveRoleDisplayMode, showRoles } =
    useGameRouteContext();

  if (!game.script || !showRoles) {
    return null;
  }

  const roleDisplayModeCounts: Record<RoleDisplayMode, number> = {
    claim: countRoleAssignments(game.players, activeDay, 'claim'),
    confirm: countRoleAssignments(game.players, activeDay, 'confirm'),
    guess: countRoleAssignments(game.players, activeDay, 'guess'),
    rumor: getLatestRumorMapDisplaysForDayOrPrevious(game.players, activeDay, game.script.roles)
      .length,
  };

  return (
    <View
      accessibilityLabel="Role display modes"
      accessibilityRole="radiogroup"
      style={styles.segmentedControl}
    >
      {roleDisplayModes.map(({ label, value }, index) => (
        <RoleDisplayModeButton
          first={index === 0}
          count={roleDisplayModeCounts[value]}
          key={value}
          label={label}
          onPress={() => setActiveRoleDisplayMode(value)}
          selected={activeRoleDisplayMode === value}
          value={value}
        />
      ))}
    </View>
  );
}

function countRoleAssignments(
  players: Player[],
  day: number,
  kind: Exclude<RoleDisplayMode, 'rumor'>,
) {
  return players.filter((player) => {
    const assignment = getRoleAssignmentForDayOrPrevious(player.roleAssignments, day, kind);
    return (assignment?.roleIds.length ?? 0) > 0;
  }).length;
}

function RoleDisplayModeButton({
  count,
  first,
  label,
  onPress,
  selected,
  value,
}: {
  count: number;
  first: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
  value: RoleDisplayMode;
}) {
  return (
    <Pressable
      accessibilityLabel={`Show ${label.toLocaleLowerCase()} (${count})`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.segment,
        first && styles.firstSegment,
        value === 'guess' && styles.lastSegment,
        pressed && styles.segmentPressed,
        selected && styles.segmentSelected,
      ]}
    >
      <Text style={[styles.segmentLabel, selected && styles.segmentSelectedLabel]}>
        {label} ({count})
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  firstSegment: {
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
  },
  lastSegment: {
    borderBottomRightRadius: 8,
    borderTopRightRadius: 8,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 0,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 46,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  segmentLabel: {
    color: colors.noteDayHeader,
    fontWeight: '900',
  },
  segmentPressed: {
    backgroundColor: colors.surfacePressed,
  },
  segmentSelected: {
    backgroundColor: colors.inputText,
  },
  segmentSelectedLabel: {
    color: colors.onPrimary,
  },
  segmentedControl: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    overflow: 'hidden',
    padding: 4,
  },
});
