import { Minus, Plus, RotateCcw, RotateCw, Undo2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { MapModeButton } from '@/components/game/map-mode-button';
import { onDarkTextStrong, outlinedActionRow, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';
import {
  mapHeightStep,
  mapWidthStep,
  maxMapHeight,
  maxMapWidth,
  maxTokenSize,
  minMapHeight,
  minMapWidth,
  minTokenSize,
  tokenSizeStep,
} from '@/utils/layout-utils';

const dimensionDisplayWidth = 58;

export function RearrangeActions() {
  const {
    activeTokenSize,
    canUndoRotation,
    exitRearrangeMode,
    handleResizeMapWidth,
    handleResizeMapHeight,
    handleResizeTokens,
    handleRotateTokens,
    handleUndoRotation,
    mapHeight,
    mapWidth,
  } = useGameRouteContext();
  const canShrinkTokens = activeTokenSize > minTokenSize;
  const canEnlargeTokens = activeTokenSize < maxTokenSize;
  const canShrinkMap = mapHeight > minMapHeight;
  const canEnlargeMap = mapHeight < maxMapHeight;
  const canShrinkMapWidth = mapWidth > minMapWidth;
  const canEnlargeMapWidth = mapWidth < maxMapWidth;

  return (
    <View style={styles.root}>
      <DimensionAdjustRow
        canDecrease={canShrinkTokens}
        canIncrease={canEnlargeTokens}
        decreaseAccessibilityLabel="Shrink player tokens"
        increaseAccessibilityLabel="Enlarge player tokens"
        onDecrease={() => handleResizeTokens(-tokenSizeStep)}
        onIncrease={() => handleResizeTokens(tokenSizeStep)}
        title="Token"
        value={activeTokenSize}
      />
      <DimensionAdjustRow
        canDecrease={canShrinkMapWidth}
        canIncrease={canEnlargeMapWidth}
        decreaseAccessibilityLabel="Decrease game map width"
        increaseAccessibilityLabel="Increase game map width"
        onDecrease={() => handleResizeMapWidth(-mapWidthStep)}
        onIncrease={() => handleResizeMapWidth(mapWidthStep)}
        title="Width"
        value={mapWidth}
      />
      <DimensionAdjustRow
        canDecrease={canShrinkMap}
        canIncrease={canEnlargeMap}
        decreaseAccessibilityLabel="Decrease game map height"
        increaseAccessibilityLabel="Increase game map height"
        onDecrease={() => handleResizeMapHeight(-mapHeightStep)}
        onIncrease={() => handleResizeMapHeight(mapHeightStep)}
        title="Height"
        value={mapHeight}
      />
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
          width={dimensionDisplayWidth}
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
      <View style={outlinedActionRow}>
        <Pressable
          accessibilityLabel="Undo last token rotation"
          accessibilityRole="button"
          disabled={!canUndoRotation}
          onPress={handleUndoRotation}
          style={({ pressed }) =>
            outlinedActionStyle({ pressed, disabled: !canUndoRotation, flex: 1 })
          }
        >
          <Undo2 color="#f8fafc" size={17} strokeWidth={2.7} />
          <Text style={onDarkTextStrong}>Undo</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DimensionAdjustRow({
  canDecrease,
  canIncrease,
  decreaseAccessibilityLabel,
  increaseAccessibilityLabel,
  onDecrease,
  onIncrease,
  title,
  value,
}: {
  canDecrease: boolean;
  canIncrease: boolean;
  decreaseAccessibilityLabel: string;
  increaseAccessibilityLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
  title: string;
  value: number;
}) {
  return (
    <View style={outlinedActionRow}>
      <Pressable
        accessibilityLabel={decreaseAccessibilityLabel}
        accessibilityRole="button"
        disabled={!canDecrease}
        onPress={onDecrease}
        style={({ pressed }) => outlinedActionStyle({ pressed, disabled: !canDecrease, flex: 1 })}
      >
        <Minus color="#f8fafc" size={17} strokeWidth={2.7} />
      </Pressable>
      <View style={styles.dimensionDisplay}>
        <Text style={styles.dimensionTitle}>{title}</Text>
        <Text selectable style={onDarkTextStrong}>
          {value}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={increaseAccessibilityLabel}
        accessibilityRole="button"
        disabled={!canIncrease}
        onPress={onIncrease}
        style={({ pressed }) => outlinedActionStyle({ pressed, disabled: !canIncrease, flex: 1 })}
      >
        <Plus color="#f8fafc" size={17} strokeWidth={2.7} />
      </Pressable>
    </View>
  );
}

const rotationStepRadians = Math.PI / 8;

const styles = StyleSheet.create({
  dimensionDisplay: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 2,
    paddingVertical: 10,
    width: dimensionDisplayWidth,
  },
  dimensionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
  },
  root: {
    alignSelf: 'stretch',
    gap: 10,
  },
});
