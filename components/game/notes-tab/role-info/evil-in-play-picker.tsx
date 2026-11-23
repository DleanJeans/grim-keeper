import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { PastEvilTeamsButton } from '@/components/game/notes-tab/role-info/past-evil-teams-button';
import { RoleInfoPickerDialog } from '@/components/game/notes-tab/role-info/role-info-picker-dialog';
import { RoleInfoToken } from '@/components/game/notes-tab/role-info/role-info-token';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import {
  type BluffSlot,
  type EvilInPlaySlot,
  getBluffSlots,
  getGameEvilInPlaySlots,
  getPlayersWithoutClaims,
  getUnclaimedRoles,
  type NotInPlaySlot,
} from '@/utils/evil-in-play-utils';
import type { RoleInfoSlot } from '@/utils/role-info-utils';
import { getGameScriptRoles } from '@/utils/script-service';

type PickerSlot = BluffSlot | EvilInPlaySlot | NotInPlaySlot;

/**
 * Tokens for choosing which Demon and Minions are in play, which limits the evil info rows, a row
 * for the Demon's bluffs, and the good characters nobody has claimed yet.
 */
export function EvilInPlayPicker() {
  const { activeDay, activePhase, game, players, runDayEdit } = useGameRouteContext();
  const setEvilInPlayRole = useGameStore((state) => state.setEvilInPlayRole);
  const setBluffRole = useGameStore((state) => state.setBluffRole);
  const setNotInPlayRole = useGameStore((state) => state.setNotInPlayRole);
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
  const notInPlaySlots = useMemo(
    () => getNotInPlaySlots(scriptRoles, game.notInPlay),
    [game.notInPlay, scriptRoles],
  );
  const bluffSlots = useMemo(
    () => getBluffSlots(scriptRoles, game.bluffs),
    [game.bluffs, scriptRoles],
  );
  const unclaimedRoles = useMemo(
    () => getUnclaimedRoles(scriptRoles, players, game.bluffs, activeDay, activePhase),
    [activeDay, activePhase, game.bluffs, players, scriptRoles],
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
      activeSlot?.team === 'bluff' ? bluffSlots : [...slots, ...notInPlaySlots];
    const takenRoleIds = new Set(
      rowSlots.filter((slot) => slot.slotId !== activeSlot?.slotId).map((slot) => slot.roleId),
    );
    return scriptRoles.filter((role) => !takenRoleIds.has(role.id));
  }, [activeSlot, bluffSlots, notInPlaySlots, scriptRoles, slots]);

  const showEvil = slots.length > 0 && scriptRoles.some((role) => isEvilTeam(role.team));
  const showBluffs = scriptRoles.some((role) => isGoodTeam(role.team));
  if (!showEvil && !showBluffs) return null;

  function handleSelect(roleId: string | undefined) {
    if (!activeSlot) return;

    const { slotId, team } = activeSlot;
    setActiveSlot(null);
    runDayEdit(() => {
      if (team === 'bluff') setBluffRole(game.id, slotId, roleId);
      else if (team === 'notInPlay') setNotInPlayRole(game.id, activeSlot.roleId, roleId);
      else setEvilInPlayRole(game.id, slotId, roleId);
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>In play</Text>
      {showEvil ? (
        <SlotTokens
          onPressSlot={setActiveSlot}
          rolesById={rolesById}
          slots={[...slots, ...notInPlaySlots]}
        />
      ) : null}
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
  unclaimedPlayers: {
    color: colors.textMuted,
    fontSize: 12,
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
} as const;

/** Each Demon or Minion ruled out, then an empty token to rule out another. */
function getNotInPlaySlots(scriptRoles: Role[], notInPlay: string[] | undefined): NotInPlaySlot[] {
  const evilRoleIds = new Set(
    scriptRoles.filter((role) => isEvilTeam(role.team)).map((role) => role.id),
  );
  const roleIds = (notInPlay ?? []).filter((roleId) => evilRoleIds.has(roleId));
  return [...roleIds, undefined].map((roleId, index) => ({
    locked: false,
    roleId,
    slotId: `not-in-play-${index}`,
    team: 'notInPlay',
  }));
}

/** Labelled with the chosen character's name, or its type while empty. */
function getTokenSlot({ slotId, team }: PickerSlot, roleName?: string): RoleInfoSlot {
  return {
    filter: team === 'bluff' ? 'good' : team === 'notInPlay' ? 'evil' : team,
    id: slotId,
    kind: 'role',
    label: roleName ?? TOKEN_LABELS[team],
  };
}

function isGoodTeam(team?: string) {
  const normalized = team?.toLocaleLowerCase();
  return normalized === 'townsfolk' || normalized === 'outsider';
}

function isEvilTeam(team?: string) {
  const normalized = team?.toLocaleLowerCase();
  return normalized === 'demon' || normalized === 'minion';
}
