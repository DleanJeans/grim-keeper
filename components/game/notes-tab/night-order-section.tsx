import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { getPhaseLabel } from '@/utils/game-phase-utils';
import { getNightOrderRows, type NightOrderRow } from '@/utils/night-order-utils';
import { BUNDLED_NIGHT_SHEET, getGameScriptRoles } from '@/utils/script-service';

/**
 * Tonight's waking characters in night order, with who claims each one while Show roles is on.
 * Only shown at night, for games with a script.
 */
export function NightOrderSection() {
  const { activeDay, activePhase, game, players, showRoles, startingNight } = useGameRouteContext();
  const [expanded, setExpanded] = useState(true);

  if (activePhase !== 'night' || !game.script) {
    return null;
  }

  const rows = getNightOrderRows(
    getGameScriptRoles(game),
    players,
    BUNDLED_NIGHT_SHEET,
    activeDay,
    activePhase,
  );
  if (rows.length === 0) {
    return null;
  }

  const title = `${getPhaseLabel({ activeDay, activePhase }, startingNight)} order`;
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityLabel={`${title}, ${rows.length} characters`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <Chevron color={colors.noteDayHeader} size={16} strokeWidth={2.6} />
        <Text style={styles.title}>{title}</Text>
      </Pressable>
      {expanded
        ? rows.map((row, index) => (
            <NightOrderRowView index={index} key={row.role.id} row={row} showClaimers={showRoles} />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  claimer: { color: colors.gameTextSoft, fontSize: 13, fontWeight: '700' },
  claimerDead: { color: colors.gameTextSubtle, textDecorationLine: 'line-through' },
  claimers: {
    flexDirection: 'row',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: 4, minHeight: 32 },
  headerPressed: { opacity: 0.65 },
  index: {
    color: colors.gameTextSubtle,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    width: 18,
  },
  roleName: { color: colors.gameText, flex: 1, fontSize: 14, fontWeight: '700', minWidth: 0 },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.gameBorder,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    minHeight: 36,
  },
  section: { gap: 2 },
  title: {
    color: colors.noteDayHeader,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  unclaimed: { color: colors.gameTextSubtle, fontSize: 13 },
});

function NightOrderRowView({
  index,
  row,
  showClaimers,
}: {
  index: number;
  row: NightOrderRow;
  showClaimers: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.index}>{index + 1}</Text>
      <RoleIcon role={row.role} size={22} />
      <Text numberOfLines={1} style={styles.roleName}>
        {row.role.name}
      </Text>
      {showClaimers ? (
        <View style={styles.claimers}>
          {row.claimers.length === 0 ? (
            <Text style={styles.unclaimed}>Unclaimed</Text>
          ) : (
            row.claimers.map((claimer) => (
              <Text key={claimer.id} style={[styles.claimer, claimer.dead && styles.claimerDead]}>
                {claimer.name}
              </Text>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}
