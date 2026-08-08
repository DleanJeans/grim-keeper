import { CircleHelp, Megaphone, ShieldCheck, Tag } from 'lucide-react-native';
import { View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RolePicker } from '@/components/game/notes-tab/role-picker';
import { TravelerRolePicker } from '@/components/game/notes-tab/traveler-role-picker';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { RoleAssignmentButton } from '@/components/game/role-assignment-button';
import { innerActionRow } from '@/components/game/styles';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player, PlayerRoleAssignment, Role, RoleDisplayMode } from '@/types/game';
import {
  GENERIC_CHARACTER_TYPE_ROLE_REFERENCES,
  getRoleDisplayForDayOrPrevious,
  getRoleOwnerNamesForDay,
  getTravelerClaimRoles,
  isTravelerRole,
} from '@/utils/role-utils';

const GENERIC_ASSIGNMENT_ROLE_NAMES = new Set(['Townsfolk', 'Outsider', 'Minion', 'Demon']);

const GENERIC_ASSIGNMENT_ROLES = GENERIC_CHARACTER_TYPE_ROLE_REFERENCES.filter((role) =>
  GENERIC_ASSIGNMENT_ROLE_NAMES.has(role.name),
);

const roleDisplayModeIcons: Record<RoleDisplayMode, typeof Tag> = {
  claim: Tag,
  confirm: ShieldCheck,
  guess: CircleHelp,
  rumor: Megaphone,
};

export function RoleAssignmentActions() {
  const {
    activeRoleDisplayMode,
    focusedPlayer,
    game,
    handleCancelRoleAssignment,
    handleStartRoleAssignment,
    handleToggleRoleAssignment,
    rumorSubjectPlayerId,
    interactionMode,
    players,
    roleAssignmentKind,
    roleAssignmentRoleIds,
    showRoles,
  } = useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);

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
  const confirmedRoleDisplay = getRoleDisplayForDayOrPrevious(
    focusedPlayer.roleAssignments?.filter((assignment) => assignment.kind === 'confirm'),
    game.activeDay,
    game.script.roles,
  );
  const confirmedTravelerRole = confirmedRoleDisplay.roles.find(isTravelerRole);
  const travelerClaimRoles = confirmedTravelerRole
    ? getTravelerClaimRoles(confirmedTravelerRole)
    : [];
  const isTravelerClaim = roleAssignmentKind === 'claim' && !!confirmedTravelerRole;
  const roleOwnerNames = showRoles
    ? getRoleOwnerNamesForDay(players, game.activeDay, selectableRoles)
    : undefined;
  const rumorSubjectSelectionPending =
    roleAssignmentKind === 'rumor' && rumorSubjectPlayerId === '';
  const rumorSubject = rumorSubjectSelectionPending
    ? null
    : rumorSubjectPlayerId
      ? (players.find((player) => player.id === rumorSubjectPlayerId) ?? null)
      : null;
  const assignmentKind = roleAssignmentKind ?? activeRoleDisplayMode;
  const assignmentAction = roleAssignmentKind ? 'Cancel' : 'Add';
  const assignmentLabel = getRoleAssignmentLabel(assignmentKind);

  return (
    <View style={{ gap: 10 }}>
      <View style={innerActionRow}>
        <RoleAssignmentButton
          accessibilityLabel={`${assignmentAction} ${assignmentLabel}`}
          icon={roleDisplayModeIcons[assignmentKind]}
          label={`${assignmentAction} ${assignmentLabel}`}
          onPress={
            roleAssignmentKind
              ? handleCancelRoleAssignment
              : () => handleStartRoleAssignment(assignmentKind)
          }
          selected={false}
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
          <RoleAssignmentButton
            compact
            label="Cancel"
            onPress={handleCancelRoleAssignment}
            selected={false}
          />
          {roleAssignmentKind === 'rumor' ? (
            <RumorHeader
              source={focusedPlayer}
              subject={rumorSubject}
              subjectSelectionPending={rumorSubjectSelectionPending}
            />
          ) : (
            <View style={{ gap: 3 }}>
              <View
                style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}
              >
                <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
                  {getRoleAssignmentLabel(roleAssignmentKind)} roles for
                </Text>
                <PlayerNameWithRole
                  player={focusedPlayer}
                  textStyle={{ color: colors.text, fontSize: 16, fontWeight: '900' }}
                />
              </View>
              <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
                Day {game.activeDay}
              </Text>
            </View>
          )}
          {roleAssignmentKind === 'rumor' ? (
            rumorSubject ? (
              <RolePicker
                description={`What role did ${focusedPlayer.name} say ${rumorSubject.name} is?`}
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
              description="Choose which alignment this traveler is claiming."
              onToggleRole={handleToggleRoleAssignment}
              roles={travelerClaimRoles}
              selectedRoleIds={roleAssignmentRoleIds}
              scriptId={game.script.id}
            />
          ) : (
            <RolePicker
              description={`Tap a role to ${getRoleAssignmentLabel(roleAssignmentKind).toLocaleLowerCase()} or clear it.`}
              onToggleRole={handleToggleRoleAssignment}
              roles={regularRoles}
              roleOwnerNames={roleOwnerNames}
              sectioned
              selectedRoleIds={roleAssignmentRoleIds}
              scriptId={game.script.id}
            />
          )}
          {roleAssignmentKind === 'confirm' || roleAssignmentKind === 'guess' ? (
            <TravelerRolePicker
              description={`Choose one traveler role to ${getRoleAssignmentLabel(roleAssignmentKind).toLocaleLowerCase()} for this player.`}
              onToggleRole={handleToggleRoleAssignment}
              roles={assignmentRoles.filter(isTravelerRole)}
              selectedRoleIds={roleAssignmentRoleIds}
              scriptId={game.script.id}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function RumorHeader({
  source,
  subject,
  subjectSelectionPending,
}: {
  source: Player;
  subject: Player | null;
  subjectSelectionPending: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
          Rumor from
        </Text>
        <PlayerNameWithRole
          player={source}
          textStyle={{ color: colors.text, fontSize: 16, fontWeight: '900' }}
        />
        <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
          about
        </Text>
        {subject ? (
          <PlayerNameWithRole
            player={subject}
            textStyle={{ color: colors.text, fontSize: 16, fontWeight: '900' }}
          />
        ) : (
          <Text
            selectable
            style={{
              color: colors.textMuted,
              fontStyle: 'italic',
              fontSize: 16,
              fontWeight: '900',
            }}
          >
            (no one yet)
          </Text>
        )}
      </View>
      {subjectSelectionPending ? (
        <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>
          Tap a player on the map to set the subject of the rumor.
        </Text>
      ) : null}
    </View>
  );
}

function mergeRoleLists(scriptRoles: Role[], travelerRoles: Role[]) {
  const scriptRoleIds = new Set(scriptRoles.map((role) => role.id));

  return [...scriptRoles, ...travelerRoles.filter((role) => !scriptRoleIds.has(role.id))];
}

function getRoleAssignmentLabel(kind: PlayerRoleAssignment['kind']) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}
