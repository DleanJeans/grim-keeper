import { CircleHelp, Megaphone, ShieldCheck, Tag } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RoleAssignmentButton } from '@/components/game/role-assignment-button';
import type { RoleDisplayMode } from '@/types/game';

const roleDisplayModes: {
  icon: typeof Tag;
  label: string;
  value: RoleDisplayMode;
}[] = [
  { icon: Tag, label: 'Claim', value: 'claim' },
  { icon: ShieldCheck, label: 'Confirm', value: 'confirm' },
  { icon: Megaphone, label: 'Rumor', value: 'rumor' },
  { icon: CircleHelp, label: 'Guess', value: 'guess' },
];

export function RoleDisplayModes() {
  const { activeRoleDisplayMode, game, setActiveRoleDisplayMode } = useGameRouteContext();

  if (!game.script) {
    return null;
  }

  return (
    <View accessibilityLabel="Role display modes" accessibilityRole="radiogroup" style={styles.row}>
      {roleDisplayModes.map(({ icon, label, value }) => (
        <RoleAssignmentButton
          accessibilityLabel={`Show ${label.toLocaleLowerCase()}`}
          icon={icon}
          key={value}
          label={label}
          onPress={() => setActiveRoleDisplayMode(value)}
          selected={activeRoleDisplayMode === value}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
