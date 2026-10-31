import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Conversation, Player } from '@/types/game';
import { getNominationAvailability } from '@/utils/nomination-utils';

type NominationAvailabilityProps = {
  day: number;
  nominations: Conversation[];
  players: Player[];
};

/** Who can still nominate today and who hasn't been nominated yet. */
export function NominationAvailability({ day, nominations, players }: NominationAvailabilityProps) {
  const { canNominate, notNominated } = getNominationAvailability(players, nominations, day);
  const names = (list: Player[]) =>
    list.length === 0 ? 'Nobody' : list.map((player) => player.name).join(', ');

  return (
    <View style={styles.box}>
      <Text selectable style={styles.line}>
        <Text style={styles.label}>Can still nominate: </Text>
        {names(canNominate)}
      </Text>
      <Text selectable style={styles.line}>
        <Text style={styles.label}>Not nominated yet: </Text>
        {names(notNominated)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 4 },
  label: { color: colors.gameTextMuted, fontWeight: '800' },
  line: { color: colors.gameTextSoft, fontSize: 13, lineHeight: 18 },
});
