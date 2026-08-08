import { CircleHelp, Megaphone, ShieldCheck, Tag } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { RoleDisplayMode } from '@/types/game';

const roleDisplayModes: {
  icon: typeof Tag;
  label: string;
  value: RoleDisplayMode;
}[] = [
  { icon: ShieldCheck, label: 'Confirm', value: 'confirm' },
  { icon: Tag, label: 'Claim', value: 'claim' },
  { icon: Megaphone, label: 'Rumor', value: 'rumor' },
  { icon: CircleHelp, label: 'Guess', value: 'guess' },
];

const roleDisplayModeColors: Record<RoleDisplayMode, string> = {
  claim: colors.roleClaim,
  confirm: colors.roleConfirm,
  guess: colors.roleGuess,
  rumor: colors.roleRumor,
};

export function RoleDisplayModes() {
  const { activeRoleDisplayMode, game, setActiveRoleDisplayMode } = useGameRouteContext();

  if (!game.script) {
    return null;
  }

  return (
    <View
      accessibilityLabel="Role display modes"
      accessibilityRole="radiogroup"
      style={styles.segmentedControl}
    >
      {roleDisplayModes.map(({ icon, label, value }, index) => (
        <RoleDisplayModeButton
          first={index === 0}
          icon={icon}
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

function RoleDisplayModeButton({
  first,
  icon: Icon,
  label,
  onPress,
  selected,
  value,
}: {
  first: boolean;
  icon: ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
  selected: boolean;
  value: RoleDisplayMode;
}) {
  return (
    <Pressable
      accessibilityLabel={`Show ${label.toLocaleLowerCase()}`}
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
      <Icon
        color={selected ? roleDisplayModeColors[value] : colors.noteDayHeader}
        size={16}
        strokeWidth={2.5}
      />
      <Text style={[styles.segmentLabel, selected && styles.segmentSelectedLabel]}>{label}</Text>
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
    gap: 6,
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
