import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RandomChip } from '@/components/game/random-drawer/random-chip';
import { RollButton } from '@/components/game/random-drawer/roll-button';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { getEvilInPlayRoleIds, getGameEvilInPlaySlots } from '@/utils/evil-in-play-utils';
import {
  getRandomRoleCandidates,
  RANDOM_ROLE_TEAMS,
  type RandomRoleTeam,
} from '@/utils/random-pick-utils';
import { getGameScriptRoles } from '@/utils/script-service';

/** Picks a random character from the script, filtered by team, optionally without "You start knowing" characters. */
export function RandomCharacterTab() {
  const { game } = useGameRouteContext();
  const [teams, setTeams] = useState<RandomRoleTeam[]>([]);
  const [inPlayOnly, setInPlayOnly] = useState(true);
  const [noStartKnowing, setNoStartKnowing] = useState(false);
  const [pickedRoleId, setPickedRoleId] = useState<string | null>(null);

  const scriptRoles = useMemo(
    () => getGameScriptRoles({ script: game.script, sushiRoleIds: game.sushiRoleIds }),
    [game.script, game.sushiRoleIds],
  );
  const evilInPlayRoleIds = useMemo(
    () =>
      getEvilInPlayRoleIds(
        getGameEvilInPlaySlots(
          {
            characterTypeCounts: game.characterTypeCounts,
            evilInPlay: game.evilInPlay,
            players: game.players,
          },
          scriptRoles,
        ),
      ),
    [game.characterTypeCounts, game.evilInPlay, game.players, scriptRoles],
  );
  const candidates = useMemo(
    () =>
      getRandomRoleCandidates(
        scriptRoles,
        { inPlayOnly, noStartKnowing, teams },
        new Set(Object.values(game.bluffs ?? {})),
        evilInPlayRoleIds,
      ),
    [evilInPlayRoleIds, game.bluffs, inPlayOnly, scriptRoles, noStartKnowing, teams],
  );
  const picked = candidates.find((role) => role.id === pickedRoleId);

  function toggleTeam(team: RandomRoleTeam) {
    setTeams((current) =>
      current.includes(team) ? current.filter((value) => value !== team) : [...current, team],
    );
  }

  function roll() {
    const others = candidates.filter((role) => role.id !== pickedRoleId);
    const pool = others.length > 0 ? others : candidates;
    setPickedRoleId(pool[Math.floor(Math.random() * pool.length)]?.id ?? null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {RANDOM_ROLE_TEAMS.map(({ label, team }) => (
          <RandomChip
            accent={team === 'demon' || team === 'minion' ? 'demon' : 'redHerring'}
            key={team}
            label={label}
            on={teams.includes(team)}
            onPress={() => toggleTeam(team)}
          />
        ))}
      </View>
      <View style={styles.chips}>
        <RandomChip
          label="In play only"
          on={inPlayOnly}
          onPress={() => setInPlayOnly(!inPlayOnly)}
        />
        <RandomChip
          label="No “You start knowing”"
          on={noStartKnowing}
          onPress={() => setNoStartKnowing(!noStartKnowing)}
        />
      </View>
      <View style={styles.result}>
        {picked ? (
          <>
            <RoleIcon role={picked} size={30} />
            <Text selectable style={styles.resultText}>
              {picked.name}
            </Text>
          </>
        ) : (
          <Text style={styles.empty}>
            {candidates.length === 0
              ? 'No characters match these filters.'
              : `${candidates.length} ${candidates.length === 1 ? 'character' : 'characters'} to pick from.`}
          </Text>
        )}
        <RollButton disabled={candidates.length === 0} onPress={roll} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  container: { gap: 10 },
  empty: { color: colors.gameTextMuted, flex: 1, fontSize: 12.5, fontWeight: '700' },
  result: {
    alignItems: 'center',
    backgroundColor: colors.gameBackground,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resultText: { color: colors.gameText, flex: 1, fontSize: 14, fontWeight: '800' },
});
