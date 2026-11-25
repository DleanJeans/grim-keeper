import { Eye, Send } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { BluffsPassDialog } from '@/components/game/notes-tab/role-info/bluffs-pass-dialog';
import { BluffsShowDialog } from '@/components/game/notes-tab/role-info/bluffs-show-dialog';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { getFakeEvilIds } from '@/utils/fake-info-utils';
import { getConfirmedEvilMember } from '@/utils/past-evil-teams-utils';
import { getRolesByIds } from '@/utils/role-utils';
import { getGameScriptRoles } from '@/utils/script-service';

/** Buttons at the end of the Bluffs row: show the bluffs (Storyteller) or pass them to the evil team. */
export function BluffsButtons() {
  const { game, players } = useGameRouteContext();
  const [dialog, setDialog] = useState<'pass' | 'show' | null>(null);

  const scriptRoles = useMemo(
    () => getGameScriptRoles({ script: game.script, sushiRoleIds: game.sushiRoleIds }),
    [game.script, game.sushiRoleIds],
  );
  const bluffs = useMemo(
    () =>
      Object.entries(game.bluffs ?? {})
        .sort(([first], [second]) => first.localeCompare(second, undefined, { numeric: true }))
        .flatMap(([, roleId]) => getRolesByIds([roleId], scriptRoles) as Role[]),
    [game.bluffs, scriptRoles],
  );
  const members = useMemo(() => {
    const confirmed = players.flatMap((player) => {
      const member = getConfirmedEvilMember(player, scriptRoles);
      return member?.kind === 'demon' || member?.kind === 'minion'
        ? [{ id: player.id, kind: member.kind, name: player.name }]
        : [];
    });
    if (confirmed.length > 0) {
      return confirmed.sort((first, second) =>
        first.kind === 'demon' ? -1 : second.kind === 'demon' ? 1 : 0,
      );
    }
    const fakeIds = getFakeEvilIds(game.fakeEvilTeam);
    return fakeIds.flatMap((id) => {
      const player = players.find((candidate) => candidate.id === id);
      return player
        ? [
            {
              id,
              kind: id === game.fakeEvilTeam?.demonId ? ('demon' as const) : ('minion' as const),
              name: player.name,
            },
          ]
        : [];
    });
  }, [game.fakeEvilTeam, players, scriptRoles]);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Pass bluffs to the evil team"
        accessibilityRole="button"
        onPress={() => setDialog('pass')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Send color={colors.danger} size={18} strokeWidth={2.5} />
      </Pressable>
      <Pressable
        accessibilityLabel="Show the bluffs"
        accessibilityRole="button"
        onPress={() => setDialog('show')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Eye color={colors.danger} size={18} strokeWidth={2.5} />
      </Pressable>
      <BluffsPassDialog
        bluffs={bluffs}
        members={members}
        onClose={() => setDialog(null)}
        visible={dialog === 'pass'}
      />
      <BluffsShowDialog
        bluffs={bluffs}
        onClose={() => setDialog(null)}
        visible={dialog === 'show'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 6, marginLeft: 4 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pressed: { opacity: 0.8 },
});
