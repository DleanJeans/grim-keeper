import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RolePicker } from '@/components/game/notes-tab/role-picker';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { innerActionRow } from '@/components/game/styles';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { KillAttribution, Player, Role } from '@/types/game';
import { getKillerRoleOptions, getRoleOwnerNamesForDay } from '@/utils/role-utils';

type KillAttributionPanelProps = {
  confirmLabel?: string;
  initialAttribution?: KillAttribution;
  onCancel: () => void;
  onConfirm: (attribution: KillAttribution) => void;
  player?: Player;
  title?: string;
};

export function KillAttributionPanel({
  confirmLabel = 'Confirm Kill',
  initialAttribution,
  onCancel,
  onConfirm,
  player,
  title = 'Kill',
}: KillAttributionPanelProps) {
  const { activeDay, focusedPlayer, game, players, showRoles } = useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const [killerRoleIds, setKillerRoleIds] = useState<string[]>(
    initialAttribution?.killerRoleIds ?? [],
  );
  const killerRoles = getKillerRoleOptions(game.script?.roles ?? [], roleCatalog);
  const killerRoleSections = getKillerRoleSections(killerRoles);
  const targetPlayer = player ?? focusedPlayer;

  if (!targetPlayer) {
    return null;
  }

  function handleToggleRole(roleId: string) {
    setKillerRoleIds((currentRoleIds) =>
      currentRoleIds.includes(roleId)
        ? currentRoleIds.filter((currentRoleId) => currentRoleId !== roleId)
        : [...currentRoleIds, roleId],
    );
  }

  function handleConfirm() {
    onConfirm({
      killerRoleIds: killerRoleIds.length > 0 ? killerRoleIds : undefined,
    });
  }

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 14,
        marginBottom: 24,
        padding: 14,
      }}
    >
      <View style={{ gap: 4 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>
            {title}
          </Text>
          <PlayerNameWithRole
            player={targetPlayer}
            textStyle={{ color: colors.text, fontSize: 17, fontWeight: '900' }}
          />
        </View>
        <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>
          Day {activeDay}. Optionally record who killed them and which roles were responsible.
        </Text>
      </View>
      <RolePicker
        description="Choose the suspected killer role or alignment."
        onToggleRole={handleToggleRole}
        roles={killerRoles}
        roleOwnerNames={
          showRoles ? getRoleOwnerNamesForDay(players, activeDay, killerRoles) : undefined
        }
        sections={killerRoleSections}
        selectedRoleIds={killerRoleIds}
      />
      <View style={innerActionRow}>
        <KillFormButton icon={X} label="Cancel" onPress={onCancel} />
        <KillFormButton icon={Check} label={confirmLabel} onPress={handleConfirm} primary />
      </View>
    </View>
  );
}

function getKillerRoleSections(roles: Role[]) {
  return [
    { label: 'Generic', roles: roles.filter((role) => role.id.startsWith('generic_')) },
    {
      label: 'Townsfolk',
      roles: roles.filter(
        (role) => !role.id.startsWith('generic_') && role.team?.toLocaleLowerCase() === 'townsfolk',
      ),
    },
    {
      label: 'Minion',
      roles: roles.filter(
        (role) => !role.id.startsWith('generic_') && role.team?.toLocaleLowerCase() === 'minion',
      ),
    },
    {
      label: 'Demon',
      roles: roles.filter(
        (role) => !role.id.startsWith('generic_') && role.team?.toLocaleLowerCase() === 'demon',
      ),
    },
  ];
}

function KillFormButton({
  icon: Icon,
  label,
  onPress,
  primary = false,
}: {
  icon: typeof Check;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed
          ? colors.surfacePressed
          : primary
            ? colors.primary
            : colors.surfaceRaised,
        borderColor: primary ? colors.primary : colors.borderStrong,
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        paddingVertical: 12,
      })}
    >
      <Icon color={primary ? colors.onPrimary : colors.textMuted} size={16} strokeWidth={2.7} />
      <Text style={{ color: primary ? colors.onPrimary : colors.text, fontWeight: '900' }}>
        {label}
      </Text>
    </Pressable>
  );
}
