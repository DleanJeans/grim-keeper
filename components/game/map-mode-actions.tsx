import { MoveDiagonal } from 'lucide-react-native';
import { View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { MapModeButton } from '@/components/game/map-mode-button';

export function MapModeActions() {
  const { enterRearrangeMode } = useGameRouteContext();
  return (
    <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10 }}>
      <MapModeButton
        accessibilityLabel="Enter rearrange mode"
        icon={MoveDiagonal}
        label="Rearrange"
        onPress={enterRearrangeMode}
      />
    </View>
  );
}
