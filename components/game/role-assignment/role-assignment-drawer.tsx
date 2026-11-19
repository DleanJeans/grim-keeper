import { Search, Skull, X } from 'lucide-react-native';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { ClaimSlots } from '@/components/game/notes-tab/claim-slots';
import { RolePicker } from '@/components/game/notes-tab/role-picker';
import { SushiBuffetRoleAssignmentDialog } from '@/components/game/notes-tab/sushi-buffet-role-assignment-dialog';
import { TravelerRoleAlignmentButton } from '@/components/game/notes-tab/traveler-role-alignment-button';
import { TravelerRolePicker } from '@/components/game/notes-tab/traveler-role-picker';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { RoleAssignmentTimeline } from '@/components/game/role-assignment/role-assignment-timeline';
import { RoleGrid } from '@/components/game/role-assignment/role-grid';
import { RoleKindButtons } from '@/components/game/role-assignment/role-kind-buttons';
import { getRoleKindInfo, type RoleKind } from '@/components/game/role-assignment/role-kinds';
import { RumorSourceChips } from '@/components/game/role-assignment/rumor-source-chips';
import { useRoleAssignmentHistory } from '@/components/game/role-assignment/use-role-assignment-history';
import { RoleAssignmentButton } from '@/components/game/role-assignment-button';
import { KeyboardAvoidingView } from '@/components/keyboard-avoiding-view';
import { Text, TextInput } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import {
  getEventPhaseIndex,
  getPhaseLabel,
  getPhasePositionAtIndex,
} from '@/utils/game-phase-utils';
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

type RoleAssignmentDrawerProps = {
  /** The undo bar, shown beside Done while the drawer covers the dock. */
  footer?: ReactNode;
};

/**
 * The player dock opened to full height: Claim / Confirm / Rumor / Guess tabs, the player's
 * history of that kind on a timeline, and a searchable grid of roles by team.
 */
export function RoleAssignmentDrawer({ footer }: RoleAssignmentDrawerProps) {
  const {
    activeDay,
    activePhase,
    focusedPlayer,
    game,
    handleCancelRoleAssignment,
    handleChangePhase,
    handleDeleteRoleAssignment,
    handleSelectRumorSource,
    handleStartRoleAssignment,
    handleToggleRoleAssignment,
    interactionMode,
    players,
    roleAssignmentKind,
    roleAssignmentRoleIds,
    rumorSourcePlayerId,
    rumorSubjectPlayerId,
    showRoles,
    startingNight,
  } = useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const history = useRoleAssignmentHistory(roleAssignmentKind ?? 'claim');
  const [query, setQuery] = useState('');
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
  const pickingKey = `${focusedPlayer?.id}:${roleAssignmentKind}`;

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new player or kind starts a new search.
  useEffect(() => {
    setQuery('');
  }, [pickingKey]);

  if (!roleAssignmentKind || !focusedPlayer || interactionMode || !game.script) {
    return null;
  }

  const kind = roleAssignmentKind;
  const selectableRoles = mergeRoleLists(
    [...GENERIC_ASSIGNMENT_ROLES, ...game.script.roles],
    roleCatalog.filter(isTravelerRole),
  );
  const assignmentRoles =
    kind === 'claim' ? selectableRoles.filter((role) => !isTravelerRole(role)) : selectableRoles;
  const regularRoles = assignmentRoles.filter((role) => !isTravelerRole(role));
  const selectedRoleId = roleAssignmentRoleIds[0];
  const selectedTurnableRole = regularRoles.find(
    (role) =>
      canRoleTurnEvil(role) && (role.id === selectedRoleId || `${role.id}_evil` === selectedRoleId),
  );
  const showEvilToggle =
    (kind === 'confirm' || kind === 'guess') && (!selectedRoleId || !!selectedTurnableRole);
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
  const isTravelerClaim = kind === 'claim' && !!confirmedTravelerRole;
  const showClaimSlots = kind === 'claim' && !isTravelerClaim;
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
    kind !== 'claim' &&
    (kind !== 'confirm' || travelerConfirmedEarlier);
  const roleOwnerNames = showRoles
    ? getRoleOwnerNamesForDay(players, activeDay, selectableRoles, activePhase)
    : undefined;
  const rumorSubject = rumorSubjectPlayerId
    ? (players.find((player) => player.id === rumorSubjectPlayerId) ?? null)
    : null;
  const sushi = isSushiBuffetScript(game.script);
  const showGrid =
    !sushi &&
    !showTravelerAlignmentOnly &&
    !isTravelerClaim &&
    (kind !== 'rumor' || !!rumorSubject);
  const kindLabel = getRoleKindInfo(kind).label;
  const handleSelectKind = (nextKind: RoleKind) => {
    if (nextKind === kind) {
      return;
    }
    handleStartRoleAssignment(nextKind);
  };
  const latestIndex = Math.max(activePhaseIndex, history.entries.at(-1)?.phaseIndex ?? 0);
  const travelerPicker =
    !showTravelerAlignmentOnly && (kind === 'confirm' || kind === 'guess') ? (
      <TravelerRolePicker
        description={`Choose one traveller role to ${kindLabel.toLocaleLowerCase()} for this player.`}
        onToggleRole={handleToggleRoleAssignment}
        roles={assignmentRoles.filter(isTravelerRole)}
        scriptId={game.script.id}
        selectedRoleIds={roleAssignmentRoleIds}
      />
    ) : undefined;

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.grabber} />
      <View style={styles.header}>
        <PlayerNameWithRole
          player={focusedPlayer}
          style={styles.titleName}
          textStyle={styles.title}
        />
        <Text style={styles.phase}>{getPhaseLabel({ activeDay, activePhase }, startingNight)}</Text>
        <Pressable
          accessibilityLabel={`Close ${kindLabel}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleCancelRoleAssignment}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
        >
          <X color={colors.gameTextMuted} size={20} strokeWidth={2.5} />
        </Pressable>
      </View>
      <View style={styles.controls}>
        <RoleKindButtons onPress={handleSelectKind} selectedKind={kind} showNames />
        <RoleAssignmentTimeline
          activePhase={{ activeDay, activePhase }}
          entries={history.entries}
          knownRoles={history.knownRoles}
          latestPhase={getPhasePositionAtIndex(latestIndex)}
          onChangePhase={(day, phase) => handleChangePhase({ activeDay: day, activePhase: phase })}
          onRemove={(entry) =>
            handleDeleteRoleAssignment(entry.ownerPlayerId, entry.day, entry.kind, entry.phase)
          }
          showRoles={showRoles}
          startingNight={startingNight}
        />
        {showGrid ? (
          <View style={styles.search}>
            <Search color={colors.gameTextSubtle} size={18} strokeWidth={2.4} />
            <TextInput
              accessibilityLabel="Search characters"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder="Search characters"
              placeholderTextColor={colors.inputPlaceholder}
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
            />
            {query ? (
              <Pressable
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setQuery('')}
              >
                <X color={colors.gameTextMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
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
        {kind === 'rumor' && rumorSubject ? (
          <RumorSourceChips
            onSelect={handleSelectRumorSource}
            players={players.filter(
              (player) => player.id !== rumorSubject.id && !player.isStoryteller,
            )}
            selectedPlayerId={rumorSourcePlayerId}
          />
        ) : null}
        {showEvilToggle ? (
          <View style={styles.evilRow}>
            <Text style={styles.hint}>
              Tap a role to {kindLabel.toLocaleLowerCase()} it, tap it again to clear.
            </Text>
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
          </View>
        ) : null}
      </View>
      {showGrid ? (
        <RoleGrid
          key={pickingKey}
          kind={kind}
          onToggleRole={showClaimSlots ? handleClaimRole : handleToggleRoleAssignment}
          query={query}
          roleOwnerNames={roleOwnerNames}
          roles={pickerRoles}
          selectedRoleIds={roleAssignmentRoleIds}
          travelerPicker={kind === 'rumor' ? undefined : travelerPicker}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.otherBody}
          keyboardShouldPersistTaps="handled"
          style={styles.otherScroll}
        >
          {sushi ? (
            <SushiBuffetRoleAssignmentDialog />
          ) : showTravelerAlignmentOnly && confirmedTravelerBaseRole ? (
            <TravelerRoleAlignmentButton
              onSelect={(roleId) => handleToggleRoleAssignment(roleId, true)}
              role={confirmedTravelerBaseRole}
              selectedRoleId={
                roleAssignmentRoleIds[0] ??
                (kind === 'confirm' ? confirmedTravelerRole?.id : undefined)
              }
            />
          ) : isTravelerClaim ? (
            <RolePicker
              description="Choose which alignment this traveller is claiming."
              onToggleRole={handleToggleRoleAssignment}
              roles={travelerClaimRoles}
              scriptId={game.script.id}
              selectedRoleIds={roleAssignmentRoleIds}
            />
          ) : (
            <Text style={styles.hint}>Rumor about {focusedPlayer.name}.</Text>
          )}
        </ScrollView>
      )}
      <View style={styles.footer}>
        {footer}
        <Pressable
          accessibilityRole="button"
          onPress={handleCancelRoleAssignment}
          style={({ pressed }) => [styles.done, pressed && styles.donePressed]}
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    marginLeft: 'auto',
    width: 36,
  },
  closeButtonPressed: { backgroundColor: colors.gameSurfacePressed },
  container: {
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  controls: { gap: 8, paddingBottom: 8, paddingHorizontal: 12 },
  done: {
    alignItems: 'center',
    backgroundColor: colors.gameText,
    marginLeft: 'auto',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 22,
  },
  donePressed: { backgroundColor: colors.gameTextPressed },
  doneText: { color: colors.gameBackground, fontSize: 14, fontWeight: '900' },
  evilRow: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    borderTopColor: colors.gameBorder,
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: colors.gameTextSubtle,
    borderRadius: 2,
    height: 4,
    marginTop: 6,
    width: 36,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  hint: { color: colors.gameTextMuted, flex: 1, fontSize: 12, lineHeight: 16 },
  otherBody: { gap: 10, padding: 12 },
  otherScroll: { flex: 1 },
  phase: { color: colors.gameTextMuted, fontSize: 13, fontWeight: '700' },
  search: {
    alignItems: 'center',
    backgroundColor: colors.gameBackground,
    borderColor: colors.gameBorder,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 40,
    paddingHorizontal: 10,
  },
  searchInput: { color: colors.gameText, flex: 1, fontSize: 14, fontWeight: '700', minWidth: 0 },
  title: { color: colors.gameText, fontSize: 17, fontWeight: '900' },
  titleName: { marginLeft: 8 },
});

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
