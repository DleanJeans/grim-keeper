import { CircleHelp, Megaphone, ShieldCheck, Skull, Tag, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { ClaimSlots } from '@/components/game/notes-tab/claim-slots';
import { RolePicker } from '@/components/game/notes-tab/role-picker';
import { SushiBuffetRoleAssignmentDialog } from '@/components/game/notes-tab/sushi-buffet-role-assignment-dialog';
import { TravelerRoleAlignmentButton } from '@/components/game/notes-tab/traveler-role-alignment-button';
import { TravelerRolePicker } from '@/components/game/notes-tab/traveler-role-picker';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { RoleAssignmentButton } from '@/components/game/role-assignment-button';
import { innerActionRow } from '@/components/game/styles';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player, PlayerRoleAssignment, Role } from '@/types/game';
import { getEventPhaseIndex, getPhaseLabel } from '@/utils/game-phase-utils';
import {
  canRoleTurnEvil,
  GENERIC_CHARACTER_TYPE_ROLE_REFERENCES,
  getEvilGoodRole,
  getRoleDisplayForDayOrPrevious,
  getRoleOwnerNamesForDay,
  getRolesByIds,
  getTravelerClaimRoles,
  isTravelerRole,
  MIN_CLAIM_SLOTS,
} from '@/utils/role-utils';
import { isSushiBuffetScript } from '@/utils/script-service';

const GENERIC_ASSIGNMENT_ROLE_NAMES = new Set(['Townsfolk', 'Outsider', 'Minion', 'Demon']);

const GENERIC_ASSIGNMENT_ROLES = GENERIC_CHARACTER_TYPE_ROLE_REFERENCES.filter((role) =>
  GENERIC_ASSIGNMENT_ROLE_NAMES.has(role.name),
);

export function RoleAssignmentActions() {
  const {
    activeDay,
    activePhase,
    focusedPlayer,
    game,
    handleCancelRoleAssignment,
    handleStartRoleAssignment,
    handleToggleRoleAssignment,
    rumorSubjectPlayerId,
    rumorSourcePlayerId,
    interactionMode,
    players,
    roleAssignmentKind,
    roleAssignmentRoleIds,
    showRoles,
    startingNight,
  } = useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  // Keyed to the open panel so the Evil toggle resets for another player or kind.
  const [evilPickingKey, setEvilPickingKey] = useState<string | null>(null);
  // Claim slot picked by tapping it, keyed the same way.
  const [pickedClaimSlot, setPickedClaimSlot] = useState<{ index: number; key: string } | null>(
    null,
  );
  // The + button opens one more empty slot while the claim count stays at `length`.
  const [addedClaimSlot, setAddedClaimSlot] = useState<{ key: string; length: number } | null>(
    null,
  );

  if (!focusedPlayer || interactionMode || !game.script) {
    return null;
  }

  const selectableRoles = mergeRoleLists(
    [...GENERIC_ASSIGNMENT_ROLES, ...game.script.roles],
    roleCatalog.filter(isTravelerRole),
  );
  const assignmentRoles =
    roleAssignmentKind === 'claim'
      ? selectableRoles.filter((role) => !isTravelerRole(role))
      : selectableRoles;
  const regularRoles = assignmentRoles.filter((role) => !isTravelerRole(role));
  const pickingKey = `${focusedPlayer.id}:${roleAssignmentKind}`;
  const selectedRoleId = roleAssignmentRoleIds[0];
  const selectedTurnableRole = regularRoles.find(
    (role) =>
      canRoleTurnEvil(role) && (role.id === selectedRoleId || `${role.id}_evil` === selectedRoleId),
  );
  const showEvilToggle =
    (roleAssignmentKind === 'confirm' || roleAssignmentKind === 'guess') &&
    (!selectedRoleId || !!selectedTurnableRole);
  const evilSelected = selectedTurnableRole
    ? selectedRoleId === `${selectedTurnableRole.id}_evil`
    : evilPickingKey === pickingKey;
  const pickerRoles =
    showEvilToggle && evilSelected
      ? regularRoles.map((role) => (canRoleTurnEvil(role) ? getEvilGoodRole(role) : role))
      : regularRoles;
  const handleToggleEvil = () => {
    setEvilPickingKey(evilSelected ? null : pickingKey);
    if (selectedTurnableRole) {
      handleToggleRoleAssignment(
        evilSelected ? selectedTurnableRole.id : `${selectedTurnableRole.id}_evil`,
        true,
      );
    }
  };
  const confirmedRoleDisplay = getRoleDisplayForDayOrPrevious(
    focusedPlayer.roleAssignments?.filter((assignment) => assignment.kind === 'confirm'),
    activeDay,
    game.script.roles,
    activePhase,
  );
  const confirmedTravelerRole = confirmedRoleDisplay.roles.find(isTravelerRole);
  const confirmedTravelerBaseRole = confirmedTravelerRole
    ? getTravelerBaseRole(confirmedTravelerRole, game.script.roles)
    : undefined;
  const travelerClaimRoles = confirmedTravelerBaseRole
    ? getTravelerClaimRoles(confirmedTravelerBaseRole)
    : [];
  const isTravelerClaim = roleAssignmentKind === 'claim' && !!confirmedTravelerRole;
  const showClaimSlots = roleAssignmentKind === 'claim' && !isTravelerClaim;
  const claimCount = roleAssignmentRoleIds.length;
  const claimSlotAdded = addedClaimSlot?.key === pickingKey && addedClaimSlot.length === claimCount;
  const claimSlotCount = Math.max(MIN_CLAIM_SLOTS, claimCount + (claimSlotAdded ? 1 : 0));
  const hasEmptyClaimSlot = claimSlotCount > claimCount;
  // Tapped filled slot, else the next slot (the first empty one, or the + button).
  const activeClaimSlot =
    pickedClaimSlot?.key === pickingKey && pickedClaimSlot.index < claimCount
      ? pickedClaimSlot.index
      : claimCount;
  const handleClaimRole = (roleId: string) => {
    setPickedClaimSlot(null);
    setAddedClaimSlot(null);
    handleToggleRoleAssignment(roleId, true, 'slot', activeClaimSlot);
  };
  const handlePressClaimSlot = (slotIndex: number) => {
    const slotRoleId = roleAssignmentRoleIds[slotIndex];
    if (slotRoleId && slotIndex === activeClaimSlot) {
      // A second tap on the highlighted slot clears it.
      setPickedClaimSlot(null);
      setAddedClaimSlot(null);
      handleToggleRoleAssignment(slotRoleId, true, 'slot', slotIndex);
      return;
    }
    setPickedClaimSlot(slotRoleId ? { index: slotIndex, key: pickingKey } : null);
  };
  const handleAddClaimSlot = () => {
    setPickedClaimSlot(null);
    setAddedClaimSlot({ key: pickingKey, length: claimCount });
  };
  // Confirm keeps the full picker in the phase the Traveller joined, so it can still be changed.
  const activePhaseIndex = getEventPhaseIndex(activeDay, activePhase);
  const travelerConfirmedEarlier = (focusedPlayer.roleAssignments ?? []).some(
    (assignment) =>
      assignment.kind === 'confirm' &&
      getEventPhaseIndex(assignment.day, assignment.phase ?? 'day') < activePhaseIndex &&
      getRolesByIds(assignment.roleIds, game.script?.roles ?? []).some(isTravelerRole),
  );
  const showTravelerAlignmentOnly =
    !!confirmedTravelerBaseRole &&
    roleAssignmentKind !== 'claim' &&
    (roleAssignmentKind !== 'confirm' || travelerConfirmedEarlier);
  const roleOwnerNames = showRoles
    ? getRoleOwnerNamesForDay(players, activeDay, selectableRoles, activePhase)
    : undefined;
  const rumorSubject = rumorSubjectPlayerId
    ? (players.find((player) => player.id === rumorSubjectPlayerId) ?? null)
    : null;
  const rumorSource = rumorSourcePlayerId
    ? (players.find((player) => player.id === rumorSourcePlayerId) ?? null)
    : null;
  return (
    <View style={styles.container}>
      {roleAssignmentKind ? null : (
        <View style={innerActionRow}>
          <RoleAssignmentButton
            icon={Tag}
            label="Claim"
            onPress={() => handleStartRoleAssignment('claim')}
            selected={false}
          />
          <RoleAssignmentButton
            icon={ShieldCheck}
            label="Confirm"
            onPress={() => handleStartRoleAssignment('confirm')}
            selected={false}
          />
          <RoleAssignmentButton
            icon={Megaphone}
            label="Rumor"
            onPress={() => handleStartRoleAssignment('rumor')}
            selected={false}
          />
          <RoleAssignmentButton
            icon={CircleHelp}
            label="Guess"
            onPress={() => handleStartRoleAssignment('guess')}
            selected={false}
          />
        </View>
      )}
      {roleAssignmentKind ? (
        <View style={styles.panel}>
          <View style={styles.headerRow}>
            {roleAssignmentKind === 'rumor' ? (
              <RumorHeader source={rumorSource} subject={rumorSubject} />
            ) : (
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <Text selectable style={styles.title}>
                    {getRoleAssignmentLabel(roleAssignmentKind)} roles for
                  </Text>
                  <PlayerNameWithRole player={focusedPlayer} textStyle={styles.title} />
                </View>
                <Text selectable style={styles.phase}>
                  {getPhaseLabel({ activeDay, activePhase }, startingNight)}
                </Text>
              </View>
            )}
            <Pressable
              accessibilityLabel={`Cancel ${getRoleAssignmentLabel(roleAssignmentKind)}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleCancelRoleAssignment}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <X color={colors.textMuted} size={20} strokeWidth={2.5} />
            </Pressable>
          </View>
          {isSushiBuffetScript(game.script) ? (
            <SushiBuffetRoleAssignmentDialog />
          ) : (
            <>
              {showTravelerAlignmentOnly && confirmedTravelerBaseRole ? (
                <TravelerRoleAlignmentButton
                  onSelect={(roleId) => handleToggleRoleAssignment(roleId, true)}
                  role={confirmedTravelerBaseRole}
                  selectedRoleId={
                    roleAssignmentRoleIds[0] ??
                    (roleAssignmentKind === 'confirm' ? confirmedTravelerRole?.id : undefined)
                  }
                />
              ) : roleAssignmentKind === 'rumor' ? (
                rumorSubject ? (
                  <RolePicker
                    description={
                      rumorSource
                        ? `What role did ${rumorSource.name} say ${rumorSubject.name} is?`
                        : `What role is ${rumorSubject.name} rumored to be?`
                    }
                    onToggleRole={handleToggleRoleAssignment}
                    roles={regularRoles}
                    roleOwnerNames={roleOwnerNames}
                    sectioned
                    selectedRoleIds={roleAssignmentRoleIds}
                    scriptId={game.script.id}
                  />
                ) : null
              ) : isTravelerClaim ? (
                <RolePicker
                  description="Choose which alignment this traveller is claiming."
                  onToggleRole={handleToggleRoleAssignment}
                  roles={travelerClaimRoles}
                  selectedRoleIds={roleAssignmentRoleIds}
                  scriptId={game.script.id}
                />
              ) : (
                <>
                  {showClaimSlots ? (
                    <ClaimSlots
                      activeSlot={activeClaimSlot}
                      canAddSlot={!hasEmptyClaimSlot}
                      onAddSlot={handleAddClaimSlot}
                      onPressSlot={handlePressClaimSlot}
                      roles={getRolesByIds(roleAssignmentRoleIds, selectableRoles)}
                      slotCount={claimSlotCount}
                    />
                  ) : null}
                  {showEvilToggle ? (
                    <RoleAssignmentButton
                      accessibilityLabel={
                        evilSelected ? 'Swap back to good roles' : 'Swap good roles to evil'
                      }
                      compact
                      icon={Skull}
                      label="Evil"
                      onPress={handleToggleEvil}
                      selected={evilSelected}
                    />
                  ) : null}
                  <RolePicker
                    description={
                      showClaimSlots
                        ? 'Tap a role to put it in the highlighted slot. Tap a claimed role again to remove it.'
                        : `Tap a role to ${getRoleAssignmentLabel(roleAssignmentKind).toLocaleLowerCase()} or clear it.`
                    }
                    onToggleRole={showClaimSlots ? handleClaimRole : handleToggleRoleAssignment}
                    roles={pickerRoles}
                    roleOwnerNames={roleOwnerNames}
                    sectioned
                    selectedRoleIds={roleAssignmentRoleIds}
                    scriptId={game.script.id}
                  />
                </>
              )}
              {!showTravelerAlignmentOnly &&
              (roleAssignmentKind === 'confirm' || roleAssignmentKind === 'guess') ? (
                <TravelerRolePicker
                  description={`Choose one traveller role to ${getRoleAssignmentLabel(roleAssignmentKind).toLocaleLowerCase()} for this player.`}
                  onToggleRole={handleToggleRoleAssignment}
                  roles={assignmentRoles.filter(isTravelerRole)}
                  selectedRoleIds={roleAssignmentRoleIds}
                  scriptId={game.script.id}
                />
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    marginRight: -6,
    marginTop: -6,
    width: 36,
  },
  closeButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  header: {
    flex: 1,
    gap: 3,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  phase: {
    color: colors.textMuted,
    fontSize: 13,
  },
  rumorHeader: {
    flex: 1,
    gap: 8,
  },
  rumorHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});

function RumorHeader({ source, subject }: { source: Player | null; subject: Player | null }) {
  return (
    <View style={styles.rumorHeader}>
      <View style={styles.titleRow}>
        <Text selectable style={styles.title}>
          Rumor about
        </Text>
        {subject ? <PlayerNameWithRole player={subject} textStyle={styles.title} /> : null}
        {source ? (
          <>
            <Text selectable style={styles.title}>
              from
            </Text>
            <PlayerNameWithRole player={source} textStyle={styles.title} />
          </>
        ) : null}
      </View>
      {!source ? (
        <Text selectable style={styles.rumorHint}>
          Tap another player on the map to add a source (optional).
        </Text>
      ) : null}
    </View>
  );
}

function mergeRoleLists(scriptRoles: Role[], travelerRoles: Role[]) {
  const scriptRoleIds = new Set(scriptRoles.map((role) => role.id));

  return [...scriptRoles, ...travelerRoles.filter((role) => !scriptRoleIds.has(role.id))];
}

function getTravelerBaseRole(role: Role, roles: Role[]) {
  return (
    roles.find(
      (candidate) =>
        candidate.id === role.id ||
        getTravelerClaimRoles(candidate).some(({ id }) => id === role.id),
    ) ?? role
  );
}

function getRoleAssignmentLabel(kind: PlayerRoleAssignment['kind']) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}
