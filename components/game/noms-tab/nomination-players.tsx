import { StyleSheet, View } from 'react-native';
import { NomIcon } from '@/components/game/noms-tab/nom-icon';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';

type NominationPlayersProps = {
  nominee?: Player;
  nominator?: Player;
};

export function NominationPlayers({ nominee, nominator }: NominationPlayersProps) {
  return (
    <View style={styles.container}>
      <NominationPlayer player={nominator} />
      <NomIcon color={colors.text} size={16} />
      <NominationPlayer player={nominee} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  playerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
});

function NominationPlayer({ player }: { player?: Player }) {
  if (player) {
    return <PlayerNameWithRole player={player} textStyle={styles.playerName} />;
  }

  return (
    <Text selectable style={styles.playerName}>
      Unknown
    </Text>
  );
}
