import { FlameKindling, HeartPulse, Pencil, Skull } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, PlayerDeath, PlayerRevive, Role } from '@/types/game';

export type DeathLogEntry = {
  death: PlayerDeath;
  player: Player;
};

export type ReviveLogEntry = {
  player: Player;
  revive: PlayerRevive;
};

type KillerDescription = {
  killerPlayers: Player[];
  killerRoles: Role[];
};

const executionColor = '#fca5a5';
const nightColor = '#93c5fd';
const reviveColor = '#86efac';

export function getLogEntryKey(entry: DeathLogEntry | ReviveLogEntry): string {
  if ('death' in entry) {
    return `death-${entry.player.id}-${entry.death.day}-${entry.death.kind}`;
  }
  return `revive-${entry.player.id}-${entry.revive.day}`;
}

export function DeathLogRow({
  activeDay,
  entry,
  killerDescription,
  onEdit,
}: {
  activeDay: number;
  entry: DeathLogEntry | ReviveLogEntry;
  killerDescription?: KillerDescription;
  onEdit?: () => void;
}) {
  const isDeath = 'death' in entry;
  const isExecution = isDeath && entry.death.kind === 'execution';
  const eventDay = isDeath ? entry.death.day : entry.revive.day;
  const accent = !isDeath ? reviveColor : isExecution ? executionColor : nightColor;
  const Icon = !isDeath ? HeartPulse : isExecution ? FlameKindling : Skull;
  const actionLabel = !isDeath ? 'Revived' : isExecution ? 'Executed' : 'Killed';
  const dayLabel = `${!isDeath ? 'R' : isExecution ? 'D' : 'N'}${eventDay}`;

  return (
    <View
      style={[
        styles.row,
        eventDay === activeDay && {
          backgroundColor: colors.surfaceRaised,
          borderColor: accent,
        },
      ]}
    >
      <View style={[styles.dayBadge, { borderColor: accent }]}>
        <Text selectable style={[styles.dayLabel, { color: accent }]}>
          {dayLabel}
        </Text>
        <Icon color={accent} size={13} strokeWidth={2.6} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <PlayerNameWithRole player={entry.player} textStyle={styles.playerName} />
          <Text selectable style={[styles.action, { color: accent }]}>
            {actionLabel}
          </Text>
        </View>
        {isDeath && killerDescription ? <KillerDescriptionView {...killerDescription} /> : null}
      </View>
      {onEdit ? <EditKillerButton onPress={onEdit} /> : null}
    </View>
  );
}

function EditKillerButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Edit killer"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
    >
      <Pencil color={colors.text} size={14} strokeWidth={2.6} />
    </Pressable>
  );
}

function KillerDescriptionView({ killerPlayers, killerRoles }: KillerDescription) {
  if (killerPlayers.length === 0) {
    return (
      <View style={styles.killerDescription}>
        <Text selectable style={styles.subtitle}>
          Killed by:
        </Text>
        {killerRoles.map((role) => (
          <KillerRoleView key={role.id} role={role} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.killerDescription}>
      <Text selectable style={styles.subtitle}>
        Killed by:
      </Text>
      {killerPlayers.map((player, index) => (
        <View key={player.id} style={styles.killerName}>
          <PlayerNameWithRole player={player} roleIconSize={14} textStyle={styles.subtitle} />
          {index < killerPlayers.length - 1 ? (
            <Text selectable style={styles.subtitle}>
              ,
            </Text>
          ) : null}
        </View>
      ))}
      {killerRoles.length > 0 ? (
        <Text selectable style={styles.subtitle}>
          as
        </Text>
      ) : null}
      {killerRoles.map((role) => (
        <KillerRoleView key={role.id} role={role} />
      ))}
    </View>
  );
}

function KillerRoleView({ role }: { role: Role }) {
  return (
    <RoleReference
      containerStyle={styles.roleName}
      contentStyle={styles.roleDescription}
      iconSize={14}
      role={role}
      textStyle={styles.subtitle}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dayBadge: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  playerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  action: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  editButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  killerDescription: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  killerName: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  roleName: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  roleDescription: {
    gap: 1,
  },
});
