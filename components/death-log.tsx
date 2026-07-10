import { FlameKindling, Skull } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, PlayerDeath } from '@/types/game';

type DeathLogProps = {
  activeDay: number;
  players: Player[];
};

type DeathEntry = {
  death: PlayerDeath;
  player: Player;
};

const executionColor = '#fca5a5';
const nightColor = '#93c5fd';

export function DeathLog({ activeDay, players }: DeathLogProps) {
  const entries = collectDeathEntries(players, activeDay);

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
        <Text
          selectable
          style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
        >
          No deaths recorded yet.
        </Text>
      ) : (
        entries.map((entry) => (
          <DeathLogRow
            activeDay={activeDay}
            entry={entry}
            key={`${entry.player.id}-${entry.death.day}-${entry.death.kind}`}
          />
        ))
      )}
    </View>
  );
}

function DeathLogRow({
  activeDay,
  entry,
}: {
  activeDay: number;
  entry: DeathEntry;
}) {
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
        <Text
          selectable
          style={{ color: accent, fontSize: 14, fontWeight: '800', lineHeight: 20 }}
        >
          {actionLabel}
        </Text>
      </View>
    </View>
  );
}

function collectDeathEntries(players: Player[], activeDay: number): DeathEntry[] {
  return players
    .filter((player): player is Player & { death: PlayerDeath } => {
      if (!player.death) {
        return false;
      }

      return player.death.day <= activeDay;
    })
    .map((player) => ({ death: player.death, player }))
    .sort((first, second) => {
      if (first.death.day !== second.death.day) {
        return first.death.day - second.death.day;
      }

      // Night kills for the same day should appear before that day's executions
      if (first.death.kind !== second.death.kind) {
        return first.death.kind === 'night' ? -1 : 1;
      }

      return first.player.name.localeCompare(second.player.name);
    });
}
