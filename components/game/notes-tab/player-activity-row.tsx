import { FlameKindling, Skull, Vote } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { DeadVoteIcon } from '@/components/game/dead-vote-icon';
import { NomIcon } from '@/components/game/noms-tab/nom-icon';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';

const badgeColors = colors.playerTokenEdgeBadge;

export type PlayerActivity = {
  kind: 'death-execution' | 'death-night' | 'nominated' | 'nominator' | 'vote';
  players: Player[];
  preposition?: 'by' | 'for';
  verb: string;
};

export function PlayerActivityRow({ activity, day }: { activity: PlayerActivity; day: number }) {
  const color = getActivityColor(activity.kind);
  const verbStyle = getActivityVerbStyle(activity.kind);

  return (
    <View style={styles.row}>
      <View style={styles.icon}>{getActivityIcon(activity.kind, color)}</View>
      <Text style={[styles.verb, verbStyle]}>{activity.verb}</Text>
      {activity.preposition ? <Text style={styles.preposition}>{activity.preposition}</Text> : null}
      {activity.players.map((player, index) => (
        <View key={player.id} style={styles.player}>
          {index > 0 ? <Text style={styles.separator}>,</Text> : null}
          <PlayerNameWithRole
            day={day}
            player={player}
            roleIconSize={14}
            textStyle={styles.playerName}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
  },
  verb: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  verbDeathExecution: { color: badgeColors.deathExecutionIcon },
  verbDeathNight: { color: badgeColors.deathNightIcon },
  verbNominated: { color: badgeColors.nominatedIcon },
  verbNominator: { color: badgeColors.nominatorIcon },
  verbVote: { color: badgeColors.deadVoteIcon },
  player: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  playerName: {
    color: colors.noteText,
    fontSize: 13,
    lineHeight: 18,
  },
  preposition: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  separator: {
    color: colors.noteText,
    fontSize: 13,
    lineHeight: 18,
  },
});

function getActivityColor(kind: PlayerActivity['kind']) {
  switch (kind) {
    case 'death-execution':
      return badgeColors.deathExecutionIcon;
    case 'death-night':
      return badgeColors.deathNightIcon;
    case 'nominator':
      return badgeColors.nominatorIcon;
    case 'nominated':
      return badgeColors.nominatedIcon;
    case 'vote':
      return badgeColors.deadVoteIcon;
  }
}

function getActivityVerbStyle(kind: PlayerActivity['kind']) {
  switch (kind) {
    case 'death-execution':
      return styles.verbDeathExecution;
    case 'death-night':
      return styles.verbDeathNight;
    case 'nominator':
      return styles.verbNominator;
    case 'nominated':
      return styles.verbNominated;
    case 'vote':
      return styles.verbVote;
  }
}

function getActivityIcon(kind: PlayerActivity['kind'], color: string) {
  switch (kind) {
    case 'death-execution':
      return <FlameKindling color={color} size={14} strokeWidth={2} />;
    case 'death-night':
      return <Skull color={color} size={14} strokeWidth={2} />;
    case 'nominator':
      return <NomIcon color={color} size={13} strokeWidth={2.3} />;
    case 'nominated':
      return <Vote color={color} size={13} strokeWidth={2.3} />;
    case 'vote':
      return <DeadVoteIcon color={color} size={13} />;
  }
}
