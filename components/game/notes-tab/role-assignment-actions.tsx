import { Megaphone, ShieldCheck, Tag } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RolePicker } from '@/components/game/notes-tab/role-picker';
import { TravelerRolePicker } from '@/components/game/notes-tab/traveler-role-picker';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { innerActionRow } from '@/components/game/styles';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import {
  GENERIC_CHARACTER_TYPE_ROLE_REFERENCES,
  getRoleDisplayForDayOrPrevious,
  getRoleOwnerNamesForDay,
  getTravelerClaimRoles,
  isTravelerRole,
} from '@/utils/role-utils';

const GENERIC_ASSIGNMENT_ROLE_NAMES = new Set([
  'Townsfolk',
  'Outsider',
  'Minion',
  'Demon',
]);

const GENERIC_ASSIGNMENT_ROLES = GENERIC_CHARACTER_TYPE_ROLE_REFERENCES.filter((role) =>
  GENERIC_ASSIGNMENT_ROLE_NAMES.has(role.name),
);

export function RoleAssignmentActions() {
  const {
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
        <RoleAssignmentButton
          icon={Megaphone}
          label="Rumor"
          onPress={() => handleStartRoleAssignment('rumor')}
          selected={roleAssignmentKind === 'rumor'}
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
                  {roleAssignmentKind === 'confirm' ? 'Confirm' : 'Claim'} roles for
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
              />
            ) : null
          ) : isTravelerClaim ? (
            <RolePicker
              description="Choose which alignment this traveler is claiming."
              onToggleRole={handleToggleRoleAssignment}
              roles={travelerClaimRoles}
              selectedRoleIds={roleAssignmentRoleIds}
            />
          ) : (
            <RolePicker
              description="Tap a role to claim or confirm it. Tap the selected role again to clear it."
              onToggleRole={handleToggleRoleAssignment}
              roles={regularRoles}
              roleOwnerNames={roleOwnerNames}
              sectioned
              selectedRoleIds={roleAssignmentRoleIds}
            />
          )}
          {roleAssignmentKind === 'confirm' ? (
            <TravelerRolePicker
              description="Choose one traveler role to confirm for this player."
              onToggleRole={handleToggleRoleAssignment}
              roles={assignmentRoles.filter(isTravelerRole)}
              selectedRoleIds={roleAssignmentRoleIds}
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
            style={{ color: colors.textMuted, fontStyle: 'italic', fontSize: 16, fontWeight: '900' }}
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

function RoleAssignmentButton({
  icon: Icon,
  label,
  onPress,
  selected,
  compact = false,
}: {
  compact?: boolean;
  icon?: typeof ShieldCheck;
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
        alignSelf: compact ? 'flex-start' : undefined,
        flex: compact ? undefined : 1,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        minWidth: 0,
        paddingHorizontal: compact ? 9 : undefined,
        paddingVertical: compact ? 5 : 12,
      })}
    >
      {Icon ? <Icon color={selected ? colors.onPrimary : colors.textMuted} size={16} /> : null}
      <Text
        style={{
          color: selected ? colors.onPrimary : colors.text,
          fontSize: compact ? 12 : undefined,
          fontWeight: '900',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
