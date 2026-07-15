import { ImageBackground, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import type { Player, Role } from '@/types/game';
import { getRoleIconUrl, isTravelerRole } from '@/utils/role-utils';

type SelectedPlayerHeaderTokenProps = {
  isDead: boolean;
  player: Player;
  roles: Role[];
  showRoles: boolean;
};

export function SelectedPlayerHeaderToken({
  isDead,
  player,
  roles,
  showRoles,
}: SelectedPlayerHeaderTokenProps) {
  const visibleRoles = showRoles ? roles : roles.filter(isTravelerRole);
  const backgroundRole = visibleRoles.find(isTravelerRole) ?? visibleRoles[0];

  return (
    <View
      accessibilityLabel={`Selected player: ${player.name}`}
      accessible
      style={{
        alignItems: 'center',
        backgroundColor: isDead ? '#1f2937' : '#f8fafc',
        borderColor: '#22c55e',
        borderRadius: 18,
        borderWidth: 2,
        height: 36,
        justifyContent: 'center',
        overflow: 'hidden',
        paddingHorizontal: 3,
        width: 36,
      }}
    >
      {backgroundRole ? (
        <ImageBackground
          source={{ uri: getRoleIconUrl(backgroundRole) }}
          style={StyleSheet.absoluteFill}
          imageStyle={{ borderRadius: 18, opacity: 0.48 }}
        />
      ) : null}
      <View style={{ alignItems: 'center', justifyContent: 'center', maxWidth: '100%' }}>
        {visibleRoles.length > 0 ? (
          <Text
            adjustsFontSizeToFit
            ellipsizeMode="tail"
            minimumFontScale={0.55}
            numberOfLines={1}
            style={{ color: isDead ? '#cbd5e1' : '#0b1120', fontSize: 6, fontWeight: '900' }}
          >
            {visibleRoles.map((role) => role.name).join(' / ')}
          </Text>
        ) : null}
        <Text
          adjustsFontSizeToFit
          ellipsizeMode="tail"
          minimumFontScale={0.55}
          numberOfLines={1}
          style={{ color: isDead ? '#cbd5e1' : '#0b1120', fontSize: 8, fontWeight: '900' }}
        >
          {player.name}
        </Text>
      </View>
    </View>
  );
}
