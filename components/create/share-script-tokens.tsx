import { StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

const TOKEN_SIZE = 52;
const TOKEN_BORDER = 2;

type ShareScriptTokensProps = {
  roles: Role[];
};

/** Every character of the shared script as a small token, so friends see what can be in play. */
export function ShareScriptTokens({ roles }: ShareScriptTokensProps) {
  if (roles.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {roles.map((role) => (
        <ShareScriptToken key={role.id} role={role} />
      ))}
    </View>
  );
}

function ShareScriptToken({ role }: { role: Role }) {
  return (
    <View accessibilityLabel={role.name} style={styles.item}>
      <View style={styles.token}>
        <RoleIcon role={role} scale={1.25} size={TOKEN_SIZE - TOKEN_BORDER * 2} />
      </View>
      <Text numberOfLines={1} style={styles.name}>
        {role.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    columnGap: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    rowGap: 10,
  },
  item: {
    alignItems: 'center',
    width: 64,
  },
  name: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
    width: '100%',
  },
  token: {
    alignItems: 'center',
    backgroundColor: colors.roleInfoTokenBackground,
    borderColor: colors.roleInfoTokenFilledBorder,
    borderRadius: TOKEN_SIZE / 2,
    borderWidth: TOKEN_BORDER,
    height: TOKEN_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: TOKEN_SIZE,
  },
});
