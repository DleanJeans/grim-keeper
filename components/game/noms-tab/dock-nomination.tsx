import { Pause, Play, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { TrackingConfirmActions } from '@/components/game/interactions-tab/tracking-confirm-actions';
import { VoteConfirmActions } from '@/components/game/noms-tab/vote-confirm-actions';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Conversation, Player } from '@/types/game';
import { getPhaseLabel } from '@/utils/game-phase-utils';
import { getVoteCount } from '@/utils/nomination-utils';

/**
 * The ongoing nomination in the player dock: its Cancel / Confirm buttons and a Pause button
 * while it runs, then a slim Resume bar while it is paused.
 */
export function DockNomination() {
  const {
    activeDay,
    activePhase,
    game,
    handleCancelPausedNomination,
    handlePauseNomination,
    handleResumeNomination,
    pausedNomination,
    selectedPlayerIds,
    startingNight,
    trackingMode,
    votingNominationId,
  } = useGameRouteContext();

  if (trackingMode === 'nomination' || votingNominationId) {
    const nomination = findNomination(game.conversations, votingNominationId);
    return (
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <View style={styles.titleColumn}>
            <Text numberOfLines={1} style={styles.title}>
              {getNominationTitle(game.players, nomination, selectedPlayerIds)}
            </Text>
            <Text numberOfLines={1} style={styles.hint}>
              {votingNominationId ? 'Tap who voted on the map' : 'Tap the nominee on the map'}
            </Text>
          </View>
          {pausedNomination ? null : (
            <Pressable
              accessibilityHint="Keeps the nomination so you can check other tabs and days"
              accessibilityLabel="Pause nomination"
              accessibilityRole="button"
              hitSlop={6}
              onPress={handlePauseNomination}
              style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
            >
              <Pause color={colors.gameText} size={15} strokeWidth={2.7} />
              <Text style={styles.pillLabel}>Pause</Text>
            </Pressable>
          )}
        </View>
        {votingNominationId ? <VoteConfirmActions /> : <TrackingConfirmActions />}
      </View>
    );
  }

  if (!pausedNomination) {
    return null;
  }

  const nomination = findNomination(game.conversations, pausedNomination.nominationId);
  const title = getNominationTitle(game.players, nomination, pausedNomination.selectedPlayerIds);
  const voteCount = nomination
    ? getVoteCount(
        { day: nomination.day, voterIds: pausedNomination.selectedPlayerIds },
        game.players,
      )
    : null;
  const pausedPosition = { activeDay: pausedNomination.day, activePhase: pausedNomination.phase };
  const elsewhere = pausedNomination.day !== activeDay || pausedNomination.phase !== activePhase;
  const details = [
    'Paused',
    elsewhere ? getPhaseLabel(pausedPosition, startingNight) : null,
    voteCount === null ? null : `${voteCount} ${voteCount === 1 ? 'vote' : 'votes'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.pausedRow}>
      <View style={styles.titleColumn}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.hint}>
          {details}
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Cancel paused nomination"
        accessibilityRole="button"
        hitSlop={6}
        onPress={handleCancelPausedNomination}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pillPressed]}
      >
        <X color={colors.gameText} size={17} strokeWidth={2.7} />
      </Pressable>
      <Pressable
        accessibilityLabel="Resume nomination"
        accessibilityRole="button"
        hitSlop={6}
        onPress={handleResumeNomination}
        style={({ pressed }) => [styles.resume, pressed && styles.resumePressed]}
      >
        <Play color={colors.onPrimary} size={15} strokeWidth={2.7} />
        <Text style={styles.resumeLabel}>Resume</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  hint: { color: colors.gameTextMuted, fontSize: 12, fontWeight: '700' },
  iconButton: {
    alignItems: 'center',
    borderColor: colors.gameBorder,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pausedRow: { alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 40 },
  pill: {
    alignItems: 'center',
    borderColor: colors.gameBorder,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  pillLabel: { color: colors.gameText, fontSize: 13, fontWeight: '800' },
  pillPressed: { backgroundColor: colors.gameSurfacePressed },
  resume: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 14,
  },
  resumeLabel: { color: colors.onPrimary, fontSize: 13, fontWeight: '800' },
  resumePressed: { opacity: 0.8 },
  section: { gap: 4 },
  title: { color: colors.gameText, fontSize: 15, fontWeight: '900' },
  titleColumn: { flex: 1, gap: 1, minWidth: 0 },
});

function findNomination(conversations: Conversation[], nominationId: string | null) {
  return nominationId
    ? conversations.find((conversation) => conversation.id === nominationId)
    : undefined;
}

/** "Alice nominates Bob", from the saved nomination or from the players picked so far. */
function getNominationTitle(
  players: Player[],
  nomination: Conversation | undefined,
  selectedPlayerIds: string[],
) {
  const nominatorId = nomination ? nomination.initiatorId : selectedPlayerIds[0];
  const nomineeId = nomination
    ? (nomination.participantIds.find((playerId) => playerId !== nomination.initiatorId) ??
      nomination.initiatorId)
    : selectedPlayerIds[1];
  const nameOf = (playerId: string | undefined) =>
    players.find((player) => player.id === playerId)?.name;
  const nominator = nameOf(nominatorId) ?? 'Someone';
  const nominee = nameOf(nomineeId);
  return nominee ? `${nominator} nominates ${nominee}` : `${nominator} nominates…`;
}
