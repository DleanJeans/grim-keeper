import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RandomChip } from '@/components/game/random-drawer/random-chip';
import { RollButton } from '@/components/game/random-drawer/roll-button';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getGameEvilInPlaySlots } from '@/utils/evil-in-play-utils';
import {
  cycleFakeTeamRole,
  type FakeTeamRole,
  getFakeEvilIds,
  getFakeTeamCandidates,
  getFakeTeamRole,
  rollFakeEvilTeam,
} from '@/utils/fake-info-utils';
import { getGameScriptRoles } from '@/utils/script-service';

const ROLE_LABELS: Record<FakeTeamRole, string> = {
  demon: 'Demon',
  minion: 'Minion',
  redHerring: 'Red herring',
};

/**
 * Sets a made-up evil team, so the dice on Character info rows fill infos that agree with it,
 * night after night.
 */
export function FakeInfoTab() {
  const { game, handleHighlightPlayers, players } = useGameRouteContext();
  const setFakeEvilTeam = useGameStore((state) => state.setFakeEvilTeam);
  const team = game.fakeEvilTeam;
  const candidates = useMemo(() => getFakeTeamCandidates(players), [players]);
  const minionCount = useMemo(() => {
    const scriptRoles = getGameScriptRoles({
      script: game.script,
      sushiRoleIds: game.sushiRoleIds,
    });
    const slots = getGameEvilInPlaySlots(
      {
        characterTypeCounts: game.characterTypeCounts,
        evilInPlay: game.evilInPlay,
        players: game.players,
      },
      scriptRoles,
    );
    return Math.max(1, slots.filter((slot) => slot.team === 'minion').length);
  }, [game.characterTypeCounts, game.evilInPlay, game.players, game.script, game.sushiRoleIds]);
  const hasTeam = getFakeEvilIds(team).length > 0;

  function rollTeam() {
    const next = rollFakeEvilTeam(players, minionCount);
    setFakeEvilTeam(game.id, next);
    handleHighlightPlayers(getFakeEvilIds(next));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Tap a player to make them the fake Demon, a Minion or the red herring.
      </Text>
      <View style={styles.chips}>
        {candidates.map((player) => {
          const role = getFakeTeamRole(team, player.id);
          return (
            <RandomChip
              accent={role ?? 'gold'}
              key={player.id}
              label={role ? `${player.name} · ${ROLE_LABELS[role]}` : player.name}
              on={role !== undefined}
              onPress={() => setFakeEvilTeam(game.id, cycleFakeTeamRole(team, player.id))}
            />
          );
        })}
      </View>
      <View style={styles.row}>
        <RollButton label="Roll team" onPress={rollTeam} />
        {team ? <ClearButton onPress={() => setFakeEvilTeam(game.id, undefined)} /> : null}
      </View>
      <Text style={styles.hint}>
        {hasTeam
          ? 'Dice buttons on Character info rows fill them to match this team. Close the drawer to hide them.'
          : 'Set a fake Demon or Minion to get dice buttons on Character info rows.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  clear: {
    alignItems: 'center',
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  clearLabel: { color: colors.gameTextMuted, fontSize: 12.5, fontWeight: '800' },
  clearPressed: { backgroundColor: colors.gameSurfacePressed },
  container: { gap: 10 },
  hint: { color: colors.gameTextMuted, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
});

function ClearButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Clear the fake evil team"
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.clear, pressed && styles.clearPressed]}
    >
      <Text style={styles.clearLabel}>Clear</Text>
    </Pressable>
  );
}
