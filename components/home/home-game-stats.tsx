import { StyleSheet, View } from 'react-native';
import { GameStatsCards } from '@/components/game-stats-cards';
import { RoleIcon } from '@/components/role-icon';
import { StatsCard } from '@/components/stats-card';
import { Text } from '@/components/text';
import { ViewAllStatsButton } from '@/components/view-all-stats-button';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { getCharacterStats } from '@/utils/game-utils';

const TOP_CHARACTERS_LIMIT = 5;

export function HomeGameStats() {
  const games = useGameStore((state) => state.games);
  const topCharacters = getCharacterStats(games).slice(0, TOP_CHARACTERS_LIMIT);

  return (
    <View style={styles.container}>
      <GameStatsCards games={games} />
      <StatsCard label="Top Characters" right={<ViewAllStatsButton />}>
        {topCharacters.length > 0 ? (
          topCharacters.map(({ count, role }) => (
            <TopCharacterRow count={count} key={role.id} role={role} />
          ))
        ) : (
          <Text selectable style={styles.emptyValue}>
            —
          </Text>
        )}
      </StatsCard>
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
});
