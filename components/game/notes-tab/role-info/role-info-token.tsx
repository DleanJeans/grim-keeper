import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import type { RoleInfoSlot } from '@/utils/role-info-utils';

const TOKEN_SIZE = 46;

export type RoleInfoTokenProps = {
  /** Omit for a read-only token, such as an auto-filled neighbor. */
  onPress?: () => void;
  player?: Player;
  role?: Role;
  slot: RoleInfoSlot;
  value?: string;
};

/** Circular token showing one info value (or an empty slot); pressable unless read-only. */
export function RoleInfoToken({ onPress, player, role, slot, value }: RoleInfoTokenProps) {
  const filled = value !== undefined;
  const valueLabel = player?.name ?? role?.name ?? value;

  return (
    <View style={styles.container}>
      {onPress ? (
        <Pressable
          accessibilityLabel={`${slot.label}: ${valueLabel ?? 'empty'}`}
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [
            styles.token,
            filled ? styles.tokenFilled : styles.tokenEmpty,
            pressed ? styles.tokenPressed : null,
          ]}
        >
          <TokenContent player={player} role={role} slot={slot} value={value} />
        </Pressable>
      ) : (
        <View
          accessibilityLabel={`${slot.label}: ${valueLabel ?? 'empty'}`}
          style={[styles.token, styles.tokenReadOnly]}
        >
          <TokenContent player={player} role={role} slot={slot} value={value} />
        </View>
      )}
      <Text numberOfLines={1} style={styles.label}>
        {slot.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 3,
    width: TOKEN_SIZE + 14,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    maxWidth: TOKEN_SIZE + 14,
    textAlign: 'center',
  },
  token: {
    alignItems: 'center',
    backgroundColor: colors.roleInfoTokenBackground,
    borderRadius: TOKEN_SIZE / 2,
    borderWidth: 1.5,
    height: TOKEN_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 3,
    width: TOKEN_SIZE,
  },
  tokenEmpty: {
    borderColor: colors.roleInfoTokenEmptyBorder,
    borderStyle: 'dashed',
  },
  tokenFilled: {
    borderColor: colors.roleInfoTokenFilledBorder,
  },
  tokenPressed: {
    backgroundColor: colors.surfacePressed,
  },
  tokenReadOnly: {
    borderColor: colors.roleInfoNeighbor,
  },
  numberText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  playerText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
    textAlign: 'center',
  },
  shortText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});

function TokenContent({ player, role, slot, value }: Omit<RoleInfoTokenProps, 'onPress'>) {
  if (value === undefined) {
    return <Plus color={colors.textSubtle} size={18} strokeWidth={2.5} />;
  }

  if (slot.kind === 'role' && role) {
    return <RoleIcon role={role} scale={1.25} size={TOKEN_SIZE - 8} />;
  }

  if (slot.kind === 'number') {
    return <Text style={styles.numberText}>{value}</Text>;
  }

  const label = slot.kind === 'player' ? (player?.name ?? '?') : (role?.name ?? value);

  return (
    <Text
      numberOfLines={2}
      style={slot.kind === 'choice' && value.length <= 4 ? styles.shortText : styles.playerText}
    >
      {label}
    </Text>
  );
}
