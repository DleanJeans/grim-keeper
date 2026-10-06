import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RoleInfoPickerDialog } from '@/components/game/notes-tab/role-info/role-info-picker-dialog';
import { RoleInfoToken } from '@/components/game/notes-tab/role-info/role-info-token';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { type EvilInPlaySlot, getGameEvilInPlaySlots } from '@/utils/evil-in-play-utils';
import type { RoleInfoSlot } from '@/utils/role-info-utils';
import { getGameScriptRoles } from '@/utils/script-service';

/** Tokens for choosing which Demon and Minions are in play, which limits the evil info rows. */
export function EvilInPlayPicker() {
  const { activeDay, activePhase, game, runDayEdit } = useGameRouteContext();
  const setEvilInPlayRole = useGameStore((state) => state.setEvilInPlayRole);
  const [activeSlot, setActiveSlot] = useState<EvilInPlaySlot | null>(null);

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
  const rolesById = useMemo(
    () => new Map(scriptRoles.map((role) => [role.id, role])),
    [scriptRoles],
  );
  // A character already chosen in another slot can't be picked again.
  const pickableRoles = useMemo(() => {
    const takenRoleIds = new Set(
      slots.filter((slot) => slot.slotId !== activeSlot?.slotId).map((slot) => slot.roleId),
    );
    return scriptRoles.filter((role) => !takenRoleIds.has(role.id));
  }, [activeSlot, scriptRoles, slots]);

  if (slots.length === 0 || !scriptRoles.some((role) => isEvilTeam(role.team))) return null;

  function handleSelect(roleId: string | undefined) {
    if (!activeSlot) return;

    const { slotId } = activeSlot;
    setActiveSlot(null);
    runDayEdit(() => setEvilInPlayRole(game.id, slotId, roleId));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>In play</Text>
      <View style={styles.tokens}>
        {slots.map((slot) => {
          const role = slot.roleId ? rolesById.get(slot.roleId) : undefined;
          return (
            <RoleInfoToken
              key={slot.slotId}
              onPress={slot.locked ? undefined : () => setActiveSlot(slot)}
              role={role}
              slot={getTokenSlot(slot, role?.name)}
              value={slot.roleId}
            />
          );
        })}
      </View>
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
  tokens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});

/** Labelled with the chosen character's name, or its type while empty. */
function getTokenSlot({ slotId, team }: EvilInPlaySlot, roleName?: string): RoleInfoSlot {
  return {
    filter: team,
    id: slotId,
    kind: 'role',
    label: roleName ?? (team === 'demon' ? 'Demon' : 'Minion'),
  };
}

function isEvilTeam(team?: string) {
  const normalized = team?.toLocaleLowerCase();
  return normalized === 'demon' || normalized === 'minion';
}
