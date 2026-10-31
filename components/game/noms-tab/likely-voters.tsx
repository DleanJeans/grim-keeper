import { Lightbulb } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { getVotingBuddies } from '@/utils/nomination-utils';

const MAX_LIKELY_VOTERS = 3;
/** Share of matching votes before a player is suggested. */
const MIN_AGREEMENT = 0.6;

/** While voting, players who usually vote the same way as the nominator, from earlier votes. */
export function LikelyVoters() {
  const { activeDayCutoff, conversations, players, votingNominationId } = useGameRouteContext();
  const nomination = conversations.find((conversation) => conversation.id === votingNominationId);
  if (!nomination) {
    return null;
  }

  const nominator = players.find((player) => player.id === nomination.initiatorId);
  const nomineeId = nomination.participantIds.find((id) => id !== nomination.initiatorId);
  const likely = getVotingBuddies(
    conversations.filter((conversation) => conversation.id !== nomination.id),
    players,
    nomination.initiatorId,
    activeDayCutoff,
  )
    .filter((buddy) => buddy.player.id !== nomineeId && buddy.agreed / buddy.total >= MIN_AGREEMENT)
    .slice(0, MAX_LIKELY_VOTERS);

  if (!nominator || likely.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      <Lightbulb color={colors.gameTextMuted} size={14} strokeWidth={2.4} />
      <Text selectable style={styles.text}>
        Usually vote like {nominator.name}:{' '}
        {likely.map((buddy) => `${buddy.player.name} (${buddy.agreed}/${buddy.total})`).join(', ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: 6 },
  text: { color: colors.gameTextMuted, flex: 1, fontSize: 13, lineHeight: 18 },
});
