import { Minus, Plus, RotateCcw, RotateCw } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { MapModeButton } from '@/components/game/map-mode-button';
import { onDarkTextStrong, outlinedActionRow, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';
import { maxTokenSize, minTokenSize, tokenSizeStep } from '@/utils/layout-utils';

const tokenSizeDisplayStyle = {
  alignItems: 'center' as const,
  backgroundColor: '#111827',
  borderColor: '#334155',
  borderRadius: 8,
  borderWidth: 1,
  justifyContent: 'center' as const,
  paddingHorizontal: 12,
  paddingVertical: 14,
  width: 58,
};

export function RearrangeActions() {
  const { activeTokenSize, exitRearrangeMode, handleResizeTokens, handleRotateTokens } =
    useGameRouteContext();
  const canShrink = activeTokenSize > minTokenSize;
  const canEnlarge = activeTokenSize < maxTokenSize;

  return (
    <View style={{ alignSelf: 'stretch', gap: 10 }}>
      <View style={outlinedActionRow}>
        <Pressable
          accessibilityLabel="Shrink player tokens"
          accessibilityRole="button"
          disabled={!canShrink}
          onPress={() => handleResizeTokens(-tokenSizeStep)}
          style={({ pressed }) => outlinedActionStyle({ pressed, disabled: !canShrink, flex: 1 })}
        >
          <Minus color="#f8fafc" size={17} strokeWidth={2.7} />
        </Pressable>
        <View style={tokenSizeDisplayStyle}>
          <Text style={onDarkTextStrong}>{activeTokenSize}</Text>
        </View>
        <Pressable
          accessibilityLabel="Enlarge player tokens"
          accessibilityRole="button"
          disabled={!canEnlarge}
          onPress={() => handleResizeTokens(tokenSizeStep)}
          style={({ pressed }) => outlinedActionStyle({ pressed, disabled: !canEnlarge, flex: 1 })}
        >
          <Plus color="#f8fafc" size={17} strokeWidth={2.7} />
        </Pressable>
      </View>
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
        <MapModeButton
          accessibilityLabel="Done rearranging tokens"
          onPress={exitRearrangeMode}
          variant="confirm"
          width={tokenSizeDisplayStyle.width}
        />
        <Pressable
          accessibilityLabel="Rotate tokens right"
          accessibilityRole="button"
          onPress={() => handleRotateTokens(rotationStepRadians)}
          style={({ pressed }) => outlinedActionStyle({ pressed, flex: 1 })}
        >
          <RotateCw color="#f8fafc" size={17} strokeWidth={2.7} />
          <Text style={onDarkTextStrong}>Right</Text>
        </Pressable>
      </View>
    </View>
  );
}

const rotationStepRadians = Math.PI / 8;
