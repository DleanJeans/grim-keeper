import { MoveDiagonal, RotateCw } from 'lucide-react-native';
import { View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { MapModeButton } from '@/components/game/map-mode-button';
import { ShowRolesButton } from '@/components/game/show-roles-button';

export function MapModeActions() {
  const { enterRearrangeMode, enterRotateMode } = useGameRouteContext();
  return (
    <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10 }}>
      <MapModeButton
        accessibilityLabel="Enter rearrange mode"
        icon={MoveDiagonal}
        label="Rearrange"
        onPress={enterRearrangeMode}
      />
      <MapModeButton
        accessibilityLabel="Enter rotating mode"
        icon={RotateCw}
        label="Rotate"
        onPress={enterRotateMode}
      />
      <ShowRolesButton />
    </View>
  );
}
