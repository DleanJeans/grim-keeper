import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ResponsiveContent } from '@/components/responsive-content';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { getFriendSummaries } from '@/utils/friend-utils';
import { getCharacterStats } from '@/utils/game-utils';

export default function StatsRoute() {
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  const appUserName = useGameStore((state) => state.appUserName);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const friend = useMemo(
    () =>
      getFriendSummaries(games, storedFriends, appUserName).find((item) => item.id === friendId),
    [appUserName, friendId, games, storedFriends],
  );
  const characterStats = getCharacterStats(games, friendId);
  const title = friend ? `${friend.name} Stats` : 'Stats';

  return (
    <>
      <Stack.Screen options={{ header: () => <TitleHeader title={title} />, title }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        style={styles.screen}
      >
        <ResponsiveContent style={styles.content}>
          <View style={styles.card}>
            <View style={styles.tableHeader}>
              <Text selectable style={[styles.headerText, styles.characterColumn]}>
                Character
              </Text>
              <Text selectable style={[styles.headerText, styles.valueColumn]}>
                Games
              </Text>
              <Text selectable style={[styles.headerText, styles.valueColumn]}>
                Win rate
              </Text>
            </View>
            {characterStats.length > 0 ? (
              characterStats.map((character, index) => (
                <CharacterStatRow
                  character={character.role}
                  count={character.count}
                  key={character.role.id}
                  winRate={character.winRate}
                  withBorder={index > 0}
                />
              ))
            ) : (
              <Text selectable style={styles.emptyText}>
                No character stats yet.
              </Text>
            )}
          </View>
        </ResponsiveContent>
      </ScrollView>
    </>
  );
}

function CharacterStatRow({
  character,
  count,
  winRate,
  withBorder,
}: {
  character: Role;
  count: number;
  winRate: number | undefined;
  withBorder: boolean;
}) {
  return (
    <View style={[styles.row, withBorder && styles.rowWithBorder]}>
      <View style={styles.characterColumn}>
        <RoleIcon role={character} size={28} />
        <Text numberOfLines={1} selectable style={styles.characterName}>
          {character.name}
        </Text>
      </View>
      <Text selectable style={[styles.valueColumn, styles.countValue]}>
        {count}
      </Text>
      <Text selectable style={[styles.valueColumn, styles.rateValue]}>
        {formatRate(winRate)}
      </Text>
    </View>
  );
}

function formatRate(rate: number | undefined) {
  return rate === undefined ? '—' : `${rate}%`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  characterColumn: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  characterName: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  content: {
    gap: 18,
    padding: 20,
  },
  countValue: {
    color: colors.text,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 8,
  },
  headerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rateValue: {
    color: colors.text,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 48,
    paddingVertical: 8,
    width: '100%',
  },
  rowWithBorder: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tableHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
    width: '100%',
  },
  valueColumn: {
    textAlign: 'right',
    width: 68,
  },
});
