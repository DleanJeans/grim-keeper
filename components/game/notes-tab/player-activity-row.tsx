import { FlameKindling, Megaphone, Skull, Trash2, Vote } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { DeadVoteIcon } from '@/components/game/dead-vote-icon';
import { NomIcon } from '@/components/game/noms-tab/nom-icon';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { gameStyles } from '@/components/game/styles';
import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';

const badgeColors = colors.playerTokenEdgeBadge;

type StandardActivityKind =
  | 'big-wig'
  | 'death-execution'
  | 'death-night'
  | 'nominated'
  | 'nominator'
  | 'vote';

type StandardPlayerActivity = {
  kind: StandardActivityKind;
  players: Player[];
  preposition?: 'by' | 'for';
  role?: Role;
  verb: string;
};

type RumorPlayerActivity = {
  kind: 'rumor';
  onDelete?: () => void;
  roles: Role[];
  scriptId?: string;
  source?: Player;
  subject: Player;
};

export type PlayerActivity = StandardPlayerActivity | RumorPlayerActivity;

export function PlayerActivityRow({ activity, day }: { activity: PlayerActivity; day: number }) {
  if (activity.kind === 'rumor') {
    return <RumorActivityRow activity={activity} day={day} />;
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
      {activity.role ? (
        <>
          <Text style={styles.preposition}>as</Text>
          <RoleReference role={activity.role} variant="note" />
        </>
      ) : null}
    </View>
  );
}

function RumorActivityRow({ activity, day }: { activity: RumorPlayerActivity; day: number }) {
  const showDialog = useAppDialog();

  function handleDeletePress() {
    if (!activity.onDelete) {
      return;
    }

    showDialog(`Delete rumor about ${activity.subject.name}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: activity.onDelete },
    ]);
  }

  return (
    <View style={[styles.rumorCard, gameStyles.noteCard]}>
      <View style={styles.rumorContent}>
        <View style={styles.icon}>
          <Megaphone color={colors.roleRumor} size={14} strokeWidth={2.5} />
        </View>
        <Text style={styles.verbRumor}>Rumor</Text>
        {activity.source ? (
          <>
            <Text style={styles.preposition}>from</Text>
            <PlayerNameWithRole
              day={day}
              player={activity.source}
              textStyle={styles.playerName}
              variant="note"
            />
            <Text style={styles.preposition}>about</Text>
          </>
        ) : null}
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
      {activity.onDelete ? (
        <Pressable
          accessibilityLabel={`Delete rumor about ${activity.subject.name}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleDeletePress}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed ? styles.deleteButtonPressed : null,
          ]}
        >
          <Trash2 color={colors.danger} size={16} strokeWidth={2.4} />
        </Pressable>
      ) : null}
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
  rumorCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  rumorContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    minWidth: 0,
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
  verbBigWig: { color: colors.roleRumor },
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
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  deleteButtonPressed: {
    opacity: 0.55,
  },
});

function getActivityColor(kind: StandardActivityKind) {
  switch (kind) {
    case 'big-wig':
      return colors.roleRumor;
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
    case 'big-wig':
      return styles.verbBigWig;
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
    case 'big-wig':
      return <Megaphone color={color} size={14} strokeWidth={2.5} />;
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
