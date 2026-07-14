import { Check, ShieldCheck, Tag } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RolePicker } from '@/components/game/role-picker';
import { innerActionRow } from '@/components/game/styles';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function RoleAssignmentActions() {
  const {
    focusedPlayer,
    game,
    handleCancelRoleAssignment,
    handleSaveRoleAssignment,
    handleStartRoleAssignment,
    handleToggleRoleAssignment,
    interactionMode,
    roleAssignmentKind,
    roleAssignmentRoleIds,
  } = useGameRouteContext();

  if (!focusedPlayer || interactionMode || !game.script) {
    return null;
  }

  const actionLabel = roleAssignmentKind === 'confirm' ? 'Confirm roles' : 'Claim roles';

  return (
    <View style={{ gap: 10 }}>
      <View style={innerActionRow}>
        <RoleAssignmentButton
          icon={Tag}
          label="Claim"
          onPress={() => handleStartRoleAssignment('claim')}
          selected={roleAssignmentKind === 'claim'}
        />
        <RoleAssignmentButton
          icon={ShieldCheck}
          label="Confirm"
          onPress={() => handleStartRoleAssignment('confirm')}
          selected={roleAssignmentKind === 'confirm'}
        />
      </View>
      {roleAssignmentKind ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: 8,
            borderWidth: 1,
            gap: 12,
            padding: 12,
          }}
        >
          <View style={{ gap: 3 }}>
            <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
              {roleAssignmentKind === 'confirm' ? 'Confirm' : 'Claim'} roles for{' '}
              {focusedPlayer.name}
            </Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
              Day {game.activeDay}
            </Text>
          </View>
          <RolePicker
            onToggleRole={handleToggleRoleAssignment}
            roles={game.script.roles}
            selectedRoleIds={roleAssignmentRoleIds}
          />
          <View style={innerActionRow}>
            <RoleAssignmentButton
              icon={Check}
              label={actionLabel}
              onPress={handleSaveRoleAssignment}
              selected
            />
            <RoleAssignmentButton
              label="Cancel"
              onPress={handleCancelRoleAssignment}
              selected={false}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function RoleAssignmentButton({
  icon: Icon,
  label,
  onPress,
  selected,
}: {
  icon?: typeof Check;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed
          ? colors.surfacePressed
          : selected
            ? colors.primary
            : colors.surfaceRaised,
        borderColor: selected ? colors.primary : colors.borderStrong,
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        minWidth: 0,
        paddingVertical: 12,
      })}
    >
      {Icon ? <Icon color={selected ? colors.onPrimary : colors.textMuted} size={16} /> : null}
      <Text style={{ color: selected ? colors.onPrimary : colors.text, fontWeight: '900' }}>
        {label}
      </Text>
    </Pressable>
  );
}
