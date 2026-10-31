import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RolePicker } from '@/components/game/notes-tab/role-picker';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { innerActionRow } from '@/components/game/styles';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { KillAttribution, Player, Role } from '@/types/game';
import { getPhaseLabel } from '@/utils/game-phase-utils';
import {
  getClaimedRoleIdsForDayOrPrevious,
  getKillerRoleOptions,
  getRoleOwnerNamesForDay,
  getRolesByIds,
} from '@/utils/role-utils';
import { isSushiBuffetScript } from '@/utils/script-service';

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
  const { activeDay, activePhase, focusedPlayer, game, players, showRoles, startingNight } =
    useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const [killerRoleIds, setKillerRoleIds] = useState<string[]>(
    initialAttribution?.killerRoleIds ?? [],
  );
  // Sushi Buffet's script holds every character, so only offer the ones players claimed.
  const scriptRoles = isSushiBuffetScript(game.script)
    ? getRolesByIds(getClaimedRoleIdsForDayOrPrevious(players, activeDay, activePhase), [
        ...(game.script?.roles ?? []),
        ...roleCatalog,
      ])
    : (game.script?.roles ?? []);
  const killerRoles = getKillerRoleOptions(
    [...scriptRoles, ...getRolesByIds(game.lorics ?? [], roleCatalog)],
    roleCatalog,
  );
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
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text selectable style={styles.title}>
            {title}
          </Text>
          <PlayerNameWithRole player={targetPlayer} textStyle={styles.title} />
        </View>
        <Text selectable style={styles.description}>
          {getPhaseLabel({ activeDay, activePhase }, startingNight)}. Optionally record who killed
          them and which roles were responsible.
        </Text>
      </View>
      <RolePicker
        description="Choose the suspected killer role or alignment."
        onToggleRole={handleToggleRole}
        roles={killerRoles}
        roleOwnerNames={
          showRoles
            ? getRoleOwnerNamesForDay(players, activeDay, killerRoles, activePhase)
            : undefined
        }
        sections={killerRoleSections}
        selectedRoleIds={killerRoleIds}
        scriptId={game.script?.id}
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
    { label: 'Loric', roles: getTeamRoles(roles, 'loric') },
    { label: 'Townsfolk', roles: getTeamRoles(roles, 'townsfolk') },
    { label: 'Outsider', roles: getTeamRoles(roles, 'outsider') },
    { label: 'Minion', roles: getTeamRoles(roles, 'minion') },
    { label: 'Demon', roles: getTeamRoles(roles, 'demon') },
    { label: 'Traveller', roles: getTeamRoles(roles, 'traveller') },
  ];
}

function getTeamRoles(roles: Role[], team: string) {
  return roles.filter(
    (role) => !role.id.startsWith('generic_') && role.team?.toLocaleLowerCase() === team,
  );
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
      style={({ pressed }) => [
        styles.button,
        primary && styles.buttonPrimary,
        pressed && styles.buttonPressed,
      ]}
    >
      <Icon color={primary ? colors.onPrimary : colors.textMuted} size={16} strokeWidth={2.7} />
      <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '900',
  },
  buttonTextPrimary: {
    color: colors.onPrimary,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  header: {
    gap: 4,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    marginBottom: 24,
    padding: 14,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});
