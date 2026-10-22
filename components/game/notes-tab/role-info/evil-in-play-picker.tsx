import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RoleInfoPickerDialog } from '@/components/game/notes-tab/role-info/role-info-picker-dialog';
import { RoleInfoToken } from '@/components/game/notes-tab/role-info/role-info-token';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import {
  type BluffSlot,
  type EvilInPlaySlot,
  getBluffSlots,
  getGameEvilInPlaySlots,
} from '@/utils/evil-in-play-utils';
import type { RoleInfoSlot } from '@/utils/role-info-utils';
import { getGameScriptRoles } from '@/utils/script-service';

type PickerSlot = BluffSlot | EvilInPlaySlot;

/**
 * Tokens for choosing which Demon and Minions are in play, which limits the evil info rows, and a
 * row for the Demon's bluffs.
 */
export function EvilInPlayPicker() {
  const { activeDay, activePhase, game, runDayEdit } = useGameRouteContext();
  const setEvilInPlayRole = useGameStore((state) => state.setEvilInPlayRole);
  const setBluffRole = useGameStore((state) => state.setBluffRole);
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
  const bluffSlots = useMemo(
    () => getBluffSlots(scriptRoles, game.bluffs),
    [game.bluffs, scriptRoles],
  );
  const rolesById = useMemo(
    () => new Map(scriptRoles.map((role) => [role.id, role])),
    [scriptRoles],
  );
  // A character already chosen in another slot of the same row can't be picked again.
  const pickableRoles = useMemo(() => {
    const rowSlots: PickerSlot[] = activeSlot?.team === 'bluff' ? bluffSlots : slots;
    const takenRoleIds = new Set(
      rowSlots.filter((slot) => slot.slotId !== activeSlot?.slotId).map((slot) => slot.roleId),
    );
    return scriptRoles.filter((role) => !takenRoleIds.has(role.id));
  }, [activeSlot, bluffSlots, scriptRoles, slots]);

  const showEvil = slots.length > 0 && scriptRoles.some((role) => isEvilTeam(role.team));
  const showBluffs = scriptRoles.some((role) => isGoodTeam(role.team));
  if (!showEvil && !showBluffs) return null;

  function handleSelect(roleId: string | undefined) {
    if (!activeSlot) return;

    const { slotId, team } = activeSlot;
    setActiveSlot(null);
    runDayEdit(() =>
      team === 'bluff'
        ? setBluffRole(game.id, slotId, roleId)
        : setEvilInPlayRole(game.id, slotId, roleId),
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>In play</Text>
      {showEvil ? (
        <SlotTokens onPressSlot={setActiveSlot} rolesById={rolesById} slots={slots} />
      ) : null}
      {showBluffs ? (
        <>
          <Text style={styles.rowLabel}>Bluffs</Text>
          <SlotTokens onPressSlot={setActiveSlot} rolesById={rolesById} slots={bluffSlots} />
        </>
      ) : null}
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

const TOKEN_LABELS = { bluff: 'Bluff', demon: 'Demon', minion: 'Minion' } as const;

/** Labelled with the chosen character's name, or its type while empty. */
function getTokenSlot({ slotId, team }: PickerSlot, roleName?: string): RoleInfoSlot {
  return {
    filter: team === 'bluff' ? 'good' : team,
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
