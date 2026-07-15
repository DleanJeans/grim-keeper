import { FlameKindling, HeartPulse, Skull } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { PlayerDeath, PlayerRevive, Role } from '@/types/game';

export type DeathLogEntry = {
  death: PlayerDeath;
  player: { id: string; name: string };
};

export type ReviveLogEntry = {
  player: { id: string; name: string };
  revive: PlayerRevive;
};

type KillerDescription = {
  killerNames: string[];
  killerRoles: Role[];
};

type RowPresentation = {
  Icon: ComponentType<{ color: string; size: number; strokeWidth: number }>;
  accent: string;
  actionLabel: string;
  day: number;
  dayLabel: string;
  isCurrent: boolean;
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
}: {
  activeDay: number;
  entry: DeathLogEntry | ReviveLogEntry;
  killerDescription?: KillerDescription;
}) {
  return 'death' in entry ? (
    <DeathLogDeathRow activeDay={activeDay} entry={entry} killerDescription={killerDescription} />
  ) : (
    <DeathLogReviveRow activeDay={activeDay} entry={entry} />
  );
}

function DeathLogDeathRow({
  activeDay,
  entry,
  killerDescription,
}: {
  activeDay: number;
  entry: DeathLogEntry;
  killerDescription?: KillerDescription;
}) {
  const isExecution = entry.death.kind === 'execution';
  const accent = isExecution ? executionColor : nightColor;
  const Icon = isExecution ? FlameKindling : Skull;
  const actionLabel = isExecution ? 'Executed' : 'Killed';
  const dayLabel = isExecution ? `D${entry.death.day}` : `N${entry.death.day}`;

  return (
    <DeathLogEntryRow
      presentation={{
        Icon,
        accent,
        actionLabel,
        day: entry.death.day,
        dayLabel,
        isCurrent: entry.death.day === activeDay,
      }}
      killerDescription={killerDescription}
      playerName={entry.player.name}
    />
  );
}

function DeathLogReviveRow({ activeDay, entry }: { activeDay: number; entry: ReviveLogEntry }) {
  return (
    <DeathLogEntryRow
      presentation={{
        Icon: HeartPulse,
        accent: reviveColor,
        actionLabel: 'Revived',
        day: entry.revive.day,
        dayLabel: `R${entry.revive.day}`,
        isCurrent: entry.revive.day === activeDay,
      }}
      playerName={entry.player.name}
    />
  );
}

function DeathLogEntryRow({
  playerName,
  killerDescription,
  presentation: { Icon, accent, actionLabel, dayLabel, isCurrent },
}: {
  killerDescription?: KillerDescription;
  playerName: string;
  presentation: RowPresentation;
}) {
  return (
    <View
      style={[
        styles.row,
        isCurrent && { backgroundColor: colors.surfaceRaised, borderColor: accent },
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
          <Text selectable style={styles.playerName}>
            {playerName}
          </Text>
          <Text selectable style={[styles.action, { color: accent }]}>
            {actionLabel}
          </Text>
        </View>
        {killerDescription ? <KillerDescriptionView {...killerDescription} /> : null}
      </View>
    </View>
  );
}

function KillerDescriptionView({ killerNames, killerRoles }: KillerDescription) {
  return (
    <View style={styles.killerDescription}>
      <Text selectable style={styles.subtitle}>
        Killed by: {killerNames.length > 0 ? killerNames.join(', ') : 'unknown'}
        {killerRoles.length > 0 ? ' as' : ''}
      </Text>
      {killerRoles.map((role) => (
        <View key={role.id} style={styles.roleName}>
          <RoleIcon role={role} size={14} />
          <Text selectable style={styles.subtitle}>
            {role.name}
          </Text>
        </View>
      ))}
    </View>
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
  roleName: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
});
