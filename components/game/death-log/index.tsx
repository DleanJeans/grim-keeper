import { Skull } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';

import { collectLogEntries } from './entries';
import { DeathLogRow, getLogEntryKey } from './row';

type DeathLogProps = {
  activeDay: number;
  players: Player[];
};

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
