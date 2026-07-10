import { FlameKindling, HeartPulse, Skull } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, PlayerDeath, PlayerRevive } from '@/types/game';

type DeathLogProps = {
  activeDay: number;
  players: Player[];
};

type DeathLogEntry = {
  death: PlayerDeath;
  player: Player;
};

type ReviveLogEntry = {
  player: Player;
  revive: PlayerRevive;
};

const executionColor = '#fca5a5';
const nightColor = '#93c5fd';
const reviveColor = '#86efac';

export function DeathLog({ activeDay, players }: DeathLogProps) {
  const entries = collectLogEntries(players, activeDay);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 10,
        padding: 12,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
        }}
      >
        <Skull color={colors.textMuted} size={15} strokeWidth={2.6} />
        <Text
          selectable
          style={{
            color: colors.textMuted,
            fontSize: 13,
            fontWeight: '900',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          Death Log
        </Text>
      </View>

      {entries.length === 0 ? (
        <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
          No deaths recorded yet.
        </Text>
      ) : (
        entries.map((entry) => (
          <DeathLogRow activeDay={activeDay} entry={entry} key={getLogEntryKey(entry)} />
        ))
      )}
    </View>
  );
}

function getLogEntryKey(entry: DeathLogEntry | ReviveLogEntry): string {
  if ('death' in entry) {
    return `death-${entry.player.id}-${entry.death.day}-${entry.death.kind}`;
  }
  return `revive-${entry.player.id}-${entry.revive.day}`;
}

function DeathLogRow({
  activeDay,
  entry,
}: {
  activeDay: number;
  entry: DeathLogEntry | ReviveLogEntry;
}) {
  return 'death' in entry ? (
    <DeathLogDeathRow activeDay={activeDay} entry={entry} />
  ) : (
    <DeathLogReviveRow activeDay={activeDay} entry={entry} />
  );
}

function DeathLogDeathRow({ activeDay, entry }: { activeDay: number; entry: DeathLogEntry }) {
  const isExecution = entry.death.kind === 'execution';
  const accent = isExecution ? executionColor : nightColor;
  const Icon = isExecution ? FlameKindling : Skull;
  const actionLabel = isExecution ? 'Executed' : 'Killed';
  const dayLabel = isExecution ? `D${entry.death.day}` : `N${entry.death.day}`;
  const isCurrent = entry.death.day === activeDay;

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: isCurrent ? colors.surfaceRaised : 'transparent',
        borderColor: isCurrent ? accent : colors.border,
        borderRadius: 6,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.background,
          borderColor: accent,
          borderRadius: 6,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 4,
          minWidth: 56,
          paddingHorizontal: 6,
          paddingVertical: 4,
        }}
      >
        <Text
          selectable
          style={{
            color: accent,
            fontSize: 12,
            fontVariant: ['tabular-nums'],
            fontWeight: '900',
          }}
        >
          {dayLabel}
        </Text>
        <Icon color={accent} size={13} strokeWidth={2.6} />
      </View>
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 15, fontWeight: '800', lineHeight: 20 }}
        >
          {entry.player.name}
        </Text>
        <Text selectable style={{ color: accent, fontSize: 14, fontWeight: '800', lineHeight: 20 }}>
          {actionLabel}
        </Text>
      </View>
    </View>
  );
}

function DeathLogReviveRow({ activeDay, entry }: { activeDay: number; entry: ReviveLogEntry }) {
  const accent = reviveColor;
  const dayLabel = `R${entry.revive.day}`;
  const isCurrent = entry.revive.day === activeDay;

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: isCurrent ? colors.surfaceRaised : 'transparent',
        borderColor: isCurrent ? accent : colors.border,
        borderRadius: 6,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.background,
          borderColor: accent,
          borderRadius: 6,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 4,
          minWidth: 56,
          paddingHorizontal: 6,
          paddingVertical: 4,
        }}
      >
        <Text
          selectable
          style={{
            color: accent,
            fontSize: 12,
            fontVariant: ['tabular-nums'],
            fontWeight: '900',
          }}
        >
          {dayLabel}
        </Text>
        <HeartPulse color={accent} size={13} strokeWidth={2.6} />
      </View>
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 15, fontWeight: '800', lineHeight: 20 }}
        >
          {entry.player.name}
        </Text>
        <Text selectable style={{ color: accent, fontSize: 14, fontWeight: '800', lineHeight: 20 }}>
          Revived
        </Text>
      </View>
    </View>
  );
}

function collectLogEntries(
  players: Player[],
  activeDay: number,
): Array<DeathLogEntry | ReviveLogEntry> {
  const deathEntries: DeathLogEntry[] = players
    .filter((player): player is Player & { death: PlayerDeath } => {
      if (!player.death) {
        return false;
      }

      return player.death.day <= activeDay;
    })
    .map((player) => ({ death: player.death, player }));

  const reviveEntries: ReviveLogEntry[] = players
    .filter((player): player is Player & { revive: PlayerRevive } => {
      if (!player.revive) {
        return false;
      }

      return player.revive.day <= activeDay;
    })
    .map((player) => ({ player, revive: player.revive }));

  return [...deathEntries, ...reviveEntries].sort((first, second) => {
    const firstDay = 'death' in first ? first.death.day : first.revive.day;
    const secondDay = 'death' in second ? second.death.day : second.revive.day;
    const firstIsRevive = 'revive' in first;
    const secondIsRevive = 'revive' in second;

    if (firstDay !== secondDay) {
      return firstDay - secondDay;
    }

    // Within the same day: night deaths, executions, then revives
    if (firstIsRevive !== secondIsRevive) {
      return firstIsRevive ? 1 : -1;
    }

    if (!firstIsRevive && !secondIsRevive) {
      const firstDeath = (first as DeathLogEntry).death;
      const secondDeath = (second as DeathLogEntry).death;

      if (firstDeath.kind !== secondDeath.kind) {
        return firstDeath.kind === 'night' ? -1 : 1;
      }
    }

    return first.player.name.localeCompare(second.player.name);
  });
}
