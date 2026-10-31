import { StyleSheet } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { getPlayersNotTalkedWith } from '@/utils/conversation-utils';
import { APP_USER_ID } from '@/utils/object-id';

/** Who the focused player (or you) hasn't talked with yet today. */
export function NotTalkedWith() {
  const { activeDayCutoff, conversations, focusedPlayer, players } = useGameRouteContext();
  const subject = focusedPlayer ?? players.find((player) => player.id === APP_USER_ID);
  if (!subject || activeDayCutoff < 1) {
    return null;
  }

  const missing = getPlayersNotTalkedWith(conversations, players, subject.id, activeDayCutoff);
  const isYou = subject.id === APP_USER_ID;
  const who = isYou ? 'You' : subject.name;

  return (
    <Text selectable style={styles.text}>
      {missing.length === 0 ? (
        `${who} talked with everyone today.`
      ) : (
        <>
          <Text style={styles.label}>
            {who} {isYou ? "haven't" : "hasn't"} talked with:{' '}
          </Text>
          {missing.map((player) => player.name).join(', ')}
        </>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.gameTextMuted, fontWeight: '800' },
  text: { color: colors.gameTextSoft, fontSize: 13, lineHeight: 18 },
});
