import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Role } from '@/types/game';
import { getGameStats, getMostPlayedCharacters } from '@/utils/game-utils';

const TOP_CHARACTERS_LIMIT = 5;

type HomeGameStatsProps = {
  games: Game[];
};

export function HomeGameStats({ games }: HomeGameStatsProps) {
  const {
    evilGames,
    evilSideRate,
    evilWins,
    evilWinRate,
    goodGames,
    goodSideRate,
    goodWins,
    goodWinRate,
    totalGames,
    winRate,
  } = getGameStats(games);
  const mostPlayedCharacters = getMostPlayedCharacters(games, TOP_CHARACTERS_LIMIT);

  return (
    <View style={styles.container}>
      <View style={styles.stats}>
        <StatCard label="Win Rate">
          <Text selectable style={styles.value}>
            {formatRate(winRate)}
          </Text>
          <AlignmentLabels />
          <AlignmentWinRates evil={formatRate(evilWinRate)} good={formatRate(goodWinRate)} />
          <AlignmentGameValues evil={String(evilWins)} good={String(goodWins)} />
        </StatCard>
        <StatCard label="Total Games">
          <Text selectable style={styles.value}>
            {totalGames}
          </Text>
          <AlignmentLabels />
          <AlignmentWinRates evil={formatRate(evilSideRate)} good={formatRate(goodSideRate)} />
          <AlignmentGameValues evil={String(evilGames)} good={String(goodGames)} />
        </StatCard>
      </View>
      <StatCard label="Top Characters">
        {mostPlayedCharacters.length > 0 ? (
          mostPlayedCharacters.map(({ count, role }) => (
            <TopCharacterRow count={count} key={role.id} role={role} />
          ))
        ) : (
          <Text selectable style={styles.emptyValue}>
            —
          </Text>
        )}
      </StatCard>
    </View>
  );
}

function formatRate(rate: number | undefined) {
  return rate === undefined ? '—' : `${rate}%`;
}

function AlignmentLabels() {
  return (
    <View style={styles.alignmentRow}>
      <Text selectable style={[styles.alignmentLabel, styles.goodValue]}>
        Good
      </Text>
      <Text selectable style={[styles.alignmentLabel, styles.evilValue]}>
        Evil
      </Text>
    </View>
  );
}

type AlignmentRowProps = {
  evil: string;
  good: string;
  separatorStyle: StyleProp<TextStyle>;
  valueStyle: StyleProp<TextStyle>;
};

function AlignmentRow({ evil, good, valueStyle }: AlignmentRowProps) {
  return (
    <View style={styles.alignmentRow}>
      <Text selectable style={[valueStyle, styles.goodValue]}>
        {good}
      </Text>
      <Text selectable style={[valueStyle, styles.evilValue]}>
        {evil}
      </Text>
    </View>
  );
}

function AlignmentWinRates({ evil, good }: { evil: string; good: string }) {
  return (
    <AlignmentRow
      evil={evil}
      good={good}
      separatorStyle={styles.rateSeparator}
      valueStyle={styles.rateValue}
    />
  );
}

function AlignmentGameValues({ evil, good }: { evil: string; good: string }) {
  return (
    <AlignmentRow
      evil={evil}
      good={good}
      separatorStyle={styles.countSeparator}
      valueStyle={styles.countValue}
    />
  );
}

function StatCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={styles.card}>
      <Text selectable style={styles.label}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function TopCharacterRow({ count, role }: { count: number; role: Role }) {
  return (
    <View style={styles.characterRow}>
      <View style={styles.characterInfo}>
        <RoleIcon role={role} size={24} />
        <Text numberOfLines={1} selectable style={styles.characterName}>
          {role.name}
        </Text>
      </View>
      <Text selectable style={styles.characterCount}>
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  alignmentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  alignmentLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 14,
  },
  characterCount: {
    color: colors.text,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    minWidth: 24,
    textAlign: 'right',
  },
  characterInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  characterName: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
  },
  characterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  container: {
    gap: 12,
  },
  emptyValue: {
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  evilValue: {
    color: colors.danger,
  },
  goodValue: {
    color: colors.roleGuess,
  },
  countSeparator: {
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  countValue: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  rateSeparator: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  rateValue: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  value: {
    color: colors.text,
    fontSize: 24,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    textAlign: 'center',
  },
});
