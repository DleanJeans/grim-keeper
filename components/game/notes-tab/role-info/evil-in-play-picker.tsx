import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { PastEvilTeamsButton } from '@/components/game/notes-tab/role-info/past-evil-teams-button';
import { RoleInfoPickerDialog } from '@/components/game/notes-tab/role-info/role-info-picker-dialog';
import { RoleInfoToken } from '@/components/game/notes-tab/role-info/role-info-token';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import {
  autoFillGoodInPlay,
  type BluffSlot,
  type EvilInPlaySlot,
  type GoodInPlaySlot,
  getBluffSlots,
  getGameEvilInPlaySlots,
  getGameGoodInPlaySlots,
  getPlayersWithoutClaims,
  getUnclaimedRoles,
  type NotInPlaySlot,
} from '@/utils/evil-in-play-utils';
import type { RoleInfoSlot } from '@/utils/role-info-utils';
import { getGameScriptRoles } from '@/utils/script-service';

type PickerSlot = BluffSlot | EvilInPlaySlot | GoodInPlaySlot | NotInPlaySlot;

/**
 * Tokens for choosing which Demon and Minions are in play, which limits the evil info rows, a row
 * for the Demon's bluffs, and the good characters nobody has claimed yet.
 */
export function EvilInPlayPicker() {
  const { activeDay, activePhase, game, players, runDayEdit } = useGameRouteContext();
  const setEvilInPlayRole = useGameStore((state) => state.setEvilInPlayRole);
  const setBluffRole = useGameStore((state) => state.setBluffRole);
  const setNotInPlayRole = useGameStore((state) => state.setNotInPlayRole);
  const setGoodInPlay = useGameStore((state) => state.setGoodInPlay);
  const setGoodInPlayRole = useGameStore((state) => state.setGoodInPlayRole);
  const [activeSlot, setActiveSlot] = useState<PickerSlot | null>(null);

  const scriptRoles = useMemo(
    () => getGameScriptRoles({ script: game.script, sushiRoleIds: game.sushiRoleIds }),
    [game.script, game.sushiRoleIds],
  );
  const slots = useMemo(
    () =>
      getGameEvilInPlaySlots(
        {
          characterTypeCounts: game.characterTypeCounts,
          evilInPlay: game.evilInPlay,
          players: game.players,
        },
        scriptRoles,
      ),
    [game.characterTypeCounts, game.evilInPlay, game.players, scriptRoles],
  );
  const goodSlots = useMemo(
    () =>
      getGameGoodInPlaySlots(
        {
          characterTypeCounts: game.characterTypeCounts,
          goodInPlay: game.goodInPlay,
          players: game.players,
        },
        scriptRoles,
      ),
    [game.characterTypeCounts, game.goodInPlay, game.players, scriptRoles],
  );
  const notInPlayGroups = useMemo(
    () =>
      GROUPS.map((group) => ({
        group,
        slots: getNotInPlaySlots(scriptRoles, game.notInPlay, group),
      })),
    [game.notInPlay, scriptRoles],
  );
  const notInPlaySlots = useMemo(
    () => notInPlayGroups.flatMap(({ slots: groupSlots }) => groupSlots),
    [notInPlayGroups],
  );
  const bluffSlots = useMemo(
    () => getBluffSlots(scriptRoles, game.bluffs),
    [game.bluffs, scriptRoles],
  );
  const unclaimedRoles = useMemo(
    () =>
      getUnclaimedRoles(scriptRoles, players, game.bluffs, activeDay, activePhase, game.notInPlay),
    [activeDay, activePhase, game.bluffs, game.notInPlay, players, scriptRoles],
  );
  const playersWithoutClaims = useMemo(
    () => getPlayersWithoutClaims(players, activeDay, activePhase),
    [activeDay, activePhase, players],
  );
  const rolesById = useMemo(
    () => new Map(scriptRoles.map((role) => [role.id, role])),
    [scriptRoles],
  );
  // A character already chosen in another slot of the same row can't be picked again.
  const pickableRoles = useMemo(() => {
    const rowSlots: PickerSlot[] =
      activeSlot?.team === 'bluff' ? bluffSlots : [...slots, ...goodSlots, ...notInPlaySlots];
    const takenRoleIds = new Set(
      rowSlots.filter((slot) => slot.slotId !== activeSlot?.slotId).map((slot) => slot.roleId),
    );
    return scriptRoles.filter((role) => !takenRoleIds.has(role.id));
  }, [activeSlot, bluffSlots, goodSlots, notInPlaySlots, scriptRoles, slots]);

  const showEvil = slots.length > 0 && scriptRoles.some((role) => isEvilTeam(role.team));
  const showGood = (team: 'outsider' | 'townsfolk') =>
    scriptRoles.some((role) => role.team?.toLocaleLowerCase() === team);
  const showBluffs = scriptRoles.some((role) => isGoodTeam(role.team));
  if (!showEvil && !showBluffs && !showGood('townsfolk') && !showGood('outsider')) return null;

  function handleAutoFill() {
    runDayEdit(() =>
      setGoodInPlay(
        game.id,
        autoFillGoodInPlay(
          goodSlots.map((slot) => ({ ...slot })),
          scriptRoles,
          players,
          activeDay,
          activePhase,
          game.goodInPlay,
        ),
      ),
    );
  }

  function handleSelect(roleId: string | undefined) {
    if (!activeSlot) return;

    const { slotId, team } = activeSlot;
    setActiveSlot(null);
    runDayEdit(() => {
      if (team === 'bluff') setBluffRole(game.id, slotId, roleId);
      else if (team === 'notInPlay') setNotInPlayRole(game.id, activeSlot.roleId, roleId);
      else if (team === 'townsfolk' || team === 'outsider') {
        setGoodInPlayRole(game.id, slotId, roleId);
      } else setEvilInPlayRole(game.id, slotId, roleId);
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>In play</Text>
      {showEvil ? (
        <View style={styles.evilRow}>
          <SlotTokens onPressSlot={setActiveSlot} rolesById={rolesById} slots={slots} />
          <View style={styles.separator} />
          <SlotTokens
            onPressSlot={setActiveSlot}
            rolesById={rolesById}
            slots={notInPlayGroups.find(({ group }) => group === 'evil')?.slots ?? []}
          />
        </View>
      ) : null}
      {GOOD_TEAMS.map(({ label, team }) =>
        showGood(team) ? (
          <GoodRow
            key={team}
            label={label}
            onAutoFill={team === 'townsfolk' ? handleAutoFill : undefined}
            onPressSlot={setActiveSlot}
            rolesById={rolesById}
            slots={[...goodSlots.filter((slot) => slot.team === team)]}
            notInPlaySlots={notInPlayGroups.find(({ group }) => group === team)?.slots ?? []}
          />
        ) : null,
      )}
      {showBluffs ? (
        <>
          <Text style={styles.rowLabel}>Bluffs</Text>
          <SlotTokens onPressSlot={setActiveSlot} rolesById={rolesById} slots={bluffSlots} />
          <UnclaimedRoles playersWithoutClaims={playersWithoutClaims} roles={unclaimedRoles} />
        </>
      ) : null}
      <PastEvilTeamsButton game={game} />
      <RoleInfoPickerDialog
        day={activeDay}
        key={activeSlot?.slotId ?? 'closed'}
        onClose={() => setActiveSlot(null)}
        onSelect={handleSelect}
        phase={activePhase}
        players={[]}
        roles={pickableRoles}
        showRoles={false}
        slot={activeSlot ? getTokenSlot(activeSlot) : undefined}
        value={activeSlot?.roleId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 10,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  autoFill: {
    color: colors.interactionLine,
    fontSize: 12,
    fontWeight: '700',
  },
  unclaimedPlayers: {
    color: colors.textMuted,
    fontSize: 12,
  },
  evilRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  separator: {
    alignSelf: 'flex-start',
    backgroundColor: colors.borderStrong,
    height: 46,
    marginHorizontal: 6,
    width: 1,
  },
  tokens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});

function SlotTokens({
  onPressSlot,
  rolesById,
  slots,
}: {
  onPressSlot: (slot: PickerSlot) => void;
  rolesById: Map<string, Role>;
  slots: PickerSlot[];
}) {
  return (
    <View style={styles.tokens}>
      {slots.map((slot) => {
        const role = slot.roleId ? rolesById.get(slot.roleId) : undefined;
        return (
          <RoleInfoToken
            crossedOut={slot.team === 'notInPlay'}
            key={slot.slotId}
            onPress={slot.locked ? undefined : () => onPressSlot(slot)}
            role={role}
            slot={getTokenSlot(slot, role?.name)}
            value={slot.roleId}
          />
        );
      })}
    </View>
  );
}

/** One good team: its in-play tokens, then the characters ruled out as not in play. */
function GoodRow({
  label,
  notInPlaySlots,
  onAutoFill,
  onPressSlot,
  rolesById,
  slots,
}: {
  label: string;
  notInPlaySlots: NotInPlaySlot[];
  onAutoFill?: () => void;
  onPressSlot: (slot: PickerSlot) => void;
  rolesById: Map<string, Role>;
  slots: GoodInPlaySlot[];
}) {
  return (
    <>
      <View style={styles.labelRow}>
        <Text style={styles.rowLabel}>{label}</Text>
        {onAutoFill ? (
          <Pressable accessibilityRole="button" onPress={onAutoFill}>
            <Text style={styles.autoFill}>Auto fill from claims</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.evilRow}>
        {slots.length > 0 ? (
          <>
            <SlotTokens onPressSlot={onPressSlot} rolesById={rolesById} slots={slots} />
            <View style={styles.separator} />
          </>
        ) : null}
        <SlotTokens onPressSlot={onPressSlot} rolesById={rolesById} slots={notInPlaySlots} />
      </View>
    </>
  );
}

/** Read-only tokens for the unclaimed good characters, with the players who could be them. */
function UnclaimedRoles({
  playersWithoutClaims,
  roles,
}: {
  playersWithoutClaims: Player[];
  roles: Role[];
}) {
  return (
    <>
      <Text style={styles.rowLabel}>Unclaimed</Text>
      <Text style={styles.unclaimedPlayers}>
        {playersWithoutClaims.length > 0
          ? `No claim yet: ${playersWithoutClaims.map((player) => player.name).join(', ')}`
          : 'Every player has a claim.'}
      </Text>
      {roles.length > 0 ? (
        <View style={styles.tokens}>
          {roles.map((role) => (
            <RoleInfoToken
              key={role.id}
              role={role}
              slot={{ filter: 'good', id: role.id, kind: 'role', label: role.name }}
              value={role.id}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.unclaimedPlayers}>Every good character is claimed.</Text>
      )}
    </>
  );
}

const TOKEN_LABELS = {
  bluff: 'Bluff',
  demon: 'Demon',
  minion: 'Minion',
  notInPlay: 'Not in play',
  outsider: 'Outsider',
  townsfolk: 'Townsfolk',
} as const;

const GROUPS = ['evil', 'townsfolk', 'outsider'] as const;

const GOOD_TEAMS = [
  { label: 'Townsfolk', team: 'townsfolk' },
  { label: 'Outsiders', team: 'outsider' },
] as const;

/** Each character of the group ruled out, then an empty token to rule out another. */
function getNotInPlaySlots(
  scriptRoles: Role[],
  notInPlay: string[] | undefined,
  group: NotInPlaySlot['group'],
): NotInPlaySlot[] {
  const groupRoleIds = new Set(
    scriptRoles
      .filter((role) => (group === 'evil' ? isEvilTeam(role.team) : isTeam(role.team, group)))
      .map((role) => role.id),
  );
  const roleIds = (notInPlay ?? []).filter((roleId) => groupRoleIds.has(roleId));
  return [...roleIds, undefined].map((roleId, index) => ({
    group,
    locked: false,
    roleId,
    slotId: `not-in-play-${group}-${index}`,
    team: 'notInPlay',
  }));
}

/** Labelled with the chosen character's name, or its type while empty. */
function getTokenSlot(slot: PickerSlot, roleName?: string): RoleInfoSlot {
  const { slotId, team } = slot;
  return {
    filter:
      team === 'bluff'
        ? 'good'
        : team === 'notInPlay'
          ? slot.group === 'evil'
            ? 'evil'
            : slot.group
          : team,
    id: slotId,
    kind: 'role',
    label: roleName ?? TOKEN_LABELS[team],
  };
}

function isGoodTeam(team?: string) {
  const normalized = team?.toLocaleLowerCase();
  return normalized === 'townsfolk' || normalized === 'outsider';
}

function isTeam(team: string | undefined, expected: string) {
  return team?.toLocaleLowerCase() === expected;
}

function isEvilTeam(team?: string) {
  const normalized = team?.toLocaleLowerCase();
  return normalized === 'demon' || normalized === 'minion';
}
