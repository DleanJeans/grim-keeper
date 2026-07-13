import { RotateCcw, RotateCw } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { MapModeButton } from '@/components/game/map-mode-button';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { onDarkTextStrong, outlinedActionRow, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';

const rotationStepRadians = Math.PI / 8;

export function RotateActions() {
  const { handleRotateTokens, exitRotateMode } = useGameRouteContext();
  return (
    <View style={outlinedActionRow}>
      <Pressable
        accessibilityLabel="Rotate tokens left"
        accessibilityRole="button"
        onPress={() => handleRotateTokens(-rotationStepRadians)}
        style={({ pressed }) => outlinedActionStyle({ pressed, flex: 1 })}
      >
        <RotateCcw color="#f8fafc" size={17} strokeWidth={2.7} />
        <Text style={onDarkTextStrong}>Left</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Rotate tokens right"
        accessibilityRole="button"
        onPress={() => handleRotateTokens(rotationStepRadians)}
        style={({ pressed }) => outlinedActionStyle({ pressed, flex: 1 })}
      >
        <RotateCw color="#f8fafc" size={17} strokeWidth={2.7} />
        <Text style={onDarkTextStrong}>Right</Text>
      </Pressable>
      <MapModeButton
        accessibilityLabel="Done rotating tokens"
        onPress={exitRotateMode}
        variant="confirm"
      />
    </View>
  );
}
