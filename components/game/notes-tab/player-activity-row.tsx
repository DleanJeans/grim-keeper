import { FlameKindling, Megaphone, Skull, Vote } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { DeadVoteIcon } from '@/components/game/dead-vote-icon';
import { NomIcon } from '@/components/game/noms-tab/nom-icon';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { gameStyles } from '@/components/game/styles';
import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';

const badgeColors = colors.playerTokenEdgeBadge;

type StandardActivityKind = 'death-execution' | 'death-night' | 'nominated' | 'nominator' | 'vote';

type StandardPlayerActivity = {
  kind: StandardActivityKind;
  players: Player[];
  preposition?: 'by' | 'for';
  verb: string;
};

type RumorPlayerActivity = {
  kind: 'rumor';
  roles: Role[];
  scriptId?: string;
  subject: Player;
};

export type PlayerActivity = StandardPlayerActivity | RumorPlayerActivity;

export function PlayerActivityRow({ activity, day }: { activity: PlayerActivity; day: number }) {
  if (activity.kind === 'rumor') {
    return (
      <View style={[styles.row, gameStyles.noteCard]}>
        <View style={styles.icon}>
          <Megaphone color={colors.roleRumor} size={14} strokeWidth={2.5} />
        </View>
        <Text style={styles.verbRumor}>Rumor</Text>
        <PlayerNameWithRole
          day={day}
          player={activity.subject}
          textStyle={styles.playerName}
          variant="note"
        />
        <Text style={styles.preposition}>is</Text>
        {activity.roles.map((role) => (
          <RoleReference key={role.id} role={role} scriptId={activity.scriptId} variant="note" />
        ))}
      </View>
    );
  }

  const color = getActivityColor(activity.kind);
  const verbStyle = getActivityVerbStyle(activity.kind);

  return (
    <View style={[styles.row, gameStyles.noteCard]}>
      <View style={styles.icon}>{getActivityIcon(activity.kind, color)}</View>
      <Text style={[styles.verb, verbStyle]}>{activity.verb}</Text>
      {activity.preposition ? <Text style={styles.preposition}>{activity.preposition}</Text> : null}
      {activity.players.map((player, index) => (
        <View key={player.id} style={styles.player}>
          {index > 0 ? <Text style={styles.separator}>,</Text> : null}
          <PlayerNameWithRole
            day={day}
            player={player}
            textStyle={styles.playerName}
            variant="note"
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
  verbRumor: {
    color: colors.roleRumor,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
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

function getActivityColor(kind: StandardActivityKind) {
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

function getActivityVerbStyle(kind: StandardActivityKind) {
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

function getActivityIcon(kind: StandardActivityKind, color: string) {
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
