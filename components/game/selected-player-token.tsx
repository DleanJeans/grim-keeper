import { ImageBackground, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useRoleIconSource } from '@/hooks/use-role-icon-source';
import type { Player, Role } from '@/types/game';
import { isTravelerRole } from '@/utils/role-utils';

type SelectedPlayerTokenProps = {
  isDead: boolean;
  player: Player;
  roles: Role[];
  showRoles: boolean;
};

export function SelectedPlayerToken({
  isDead,
  player,
  roles,
  showRoles,
}: SelectedPlayerTokenProps) {
  const visibleRoles = showRoles ? roles : roles.filter(isTravelerRole);
  const backgroundRole = visibleRoles.find(isTravelerRole) ?? visibleRoles[0];
  const roleIconSource = useRoleIconSource(backgroundRole);

  return (
    <View
      accessibilityLabel={`Selected player: ${player.name}`}
      accessible
      style={[styles.token, isDead ? styles.tokenDead : styles.tokenAlive]}
    >
      {backgroundRole ? (
        <ImageBackground
          source={roleIconSource}
          style={StyleSheet.absoluteFill}
          imageStyle={styles.backgroundImage}
        />
      ) : null}
      <View style={styles.labelStack}>
        {visibleRoles.length > 0 ? (
          <Text
            adjustsFontSizeToFit
            ellipsizeMode="tail"
            minimumFontScale={0.55}
            numberOfLines={1}
            style={[styles.label, isDead ? styles.labelDead : styles.labelAlive]}
          >
            {visibleRoles.map((role) => role.name).join(' / ')}
          </Text>
        ) : null}
        <Text
          adjustsFontSizeToFit
          ellipsizeMode="tail"
          minimumFontScale={0.55}
          numberOfLines={1}
          style={[styles.name, isDead ? styles.labelDead : styles.labelAlive]}
        >
          {player.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    borderRadius: 18,
    opacity: 0.48,
  },
  label: {
    fontSize: 6,
    fontWeight: '900',
  },
  labelAlive: {
    color: '#0b1120',
  },
  labelDead: {
    color: '#cbd5e1',
  },
  labelStack: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  name: {
    fontSize: 8,
    fontWeight: '900',
  },
  token: {
    alignItems: 'center',
    borderColor: '#22c55e',
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 3,
    width: 36,
  },
  tokenAlive: {
    backgroundColor: '#f8fafc',
  },
  tokenDead: {
    backgroundColor: '#1f2937',
  },
});
