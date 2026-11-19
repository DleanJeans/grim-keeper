import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Circle,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Square,
  Undo2,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { DimensionSlider } from '@/components/game/dimension-slider';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { MapModeButton } from '@/components/game/map-mode-button';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
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

const shiftStep = 10;
const rotationStepRadians = Math.PI / 8;

/** Rearrange mode's controls: sliders for the map size and one bar for everything else. */
export function RearrangeActions() {
  const {
    activeTokenSize,
    canUndoRotation,
    exitRearrangeMode,
    handleArrangeTokens,
    handleSetMapHeight,
    handleSetMapWidth,
    handleResizeTokens,
    handleRotateTokens,
    handleShiftTokens,
    handleUndoRotation,
    mapHeight,
    mapWidth,
  } = useGameRouteContext();

  return (
    <View style={styles.root}>
      <View style={styles.sliders}>
        <DimensionSlider
          accessibilityLabel="Game map width"
          label="Width"
          max={maxMapWidth}
          min={minMapWidth}
          onChange={handleSetMapWidth}
          step={mapWidthStep}
          value={mapWidth}
        />
        <DimensionSlider
          accessibilityLabel="Game map height"
          label="Height"
          max={maxMapHeight}
          min={minMapHeight}
          onChange={handleSetMapHeight}
          step={mapHeightStep}
          value={mapHeight}
        />
      </View>
      <View style={styles.bar}>
        <Text style={styles.shiftTitle}>Move all</Text>
        <View style={styles.spacer} />
        <BarButton
          accessibilityLabel="Shift tokens left"
          icon={ArrowLeft}
          onPress={() => handleShiftTokens(-shiftStep, 0)}
        />
        <BarButton
          accessibilityLabel="Shift tokens up"
          icon={ArrowUp}
          onPress={() => handleShiftTokens(0, -shiftStep)}
        />
        <BarButton
          accessibilityLabel="Shift tokens down"
          icon={ArrowDown}
          onPress={() => handleShiftTokens(0, shiftStep)}
        />
        <BarButton
          accessibilityLabel="Shift tokens right"
          icon={ArrowRight}
          onPress={() => handleShiftTokens(shiftStep, 0)}
        />
      </View>
      <View style={styles.bar}>
        <BarButton
          accessibilityLabel="Rotate tokens left"
          icon={RotateCcw}
          onPress={() => handleRotateTokens(-rotationStepRadians)}
        />
        <BarButton
          accessibilityLabel="Rotate tokens right"
          icon={RotateCw}
          onPress={() => handleRotateTokens(rotationStepRadians)}
        />
        <BarButton
          accessibilityLabel="Arrange tokens in a circle"
          icon={Circle}
          onPress={() => handleArrangeTokens('circle')}
        />
        <BarButton
          accessibilityLabel="Arrange tokens in a square"
          icon={Square}
          onPress={() => handleArrangeTokens('square')}
        />
        <View style={styles.divider} />
        <BarButton
          accessibilityLabel="Shrink player tokens"
          disabled={activeTokenSize <= minTokenSize}
          icon={Minus}
          onPress={() => handleResizeTokens(-tokenSizeStep)}
        />
        <View style={styles.tokenSize}>
          <Text style={styles.tokenSizeTitle}>Token</Text>
          <Text selectable style={styles.tokenSizeValue}>
            {activeTokenSize}
          </Text>
        </View>
        <BarButton
          accessibilityLabel="Enlarge player tokens"
          disabled={activeTokenSize >= maxTokenSize}
          icon={Plus}
          onPress={() => handleResizeTokens(tokenSizeStep)}
        />
        <View style={styles.spacer} />
        <BarButton
          accessibilityLabel="Undo last token rearrangement"
          disabled={!canUndoRotation}
          icon={Undo2}
          onPress={handleUndoRotation}
        />
        <MapModeButton
          accessibilityLabel="Done rearranging tokens"
          onPress={exitRearrangeMode}
          variant="confirm"
          width={52}
        />
      </View>
    </View>
  );
}

function BarButton({
  accessibilityLabel,
  disabled = false,
  icon: Icon,
  onPress,
}: {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: typeof Minus;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.barButton, pressed && styles.barButtonPressed]}
    >
      <Icon color={disabled ? colors.gameBorder : colors.gameText} size={17} strokeWidth={2.7} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 6,
  },
  barButton: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  barButtonPressed: { backgroundColor: colors.gameSurfacePressed },
  divider: {
    alignSelf: 'stretch',
    backgroundColor: colors.gameBorder,
    marginHorizontal: 2,
    width: 1,
  },
  root: { alignSelf: 'stretch', gap: 8 },
  sliders: { paddingHorizontal: 4 },
  shiftTitle: { color: colors.gameTextMuted, fontSize: 12, fontWeight: '800', paddingLeft: 8 },
  spacer: { flex: 1 },
  tokenSize: { alignItems: 'center', minWidth: 40 },
  tokenSizeTitle: { color: colors.gameTextMuted, fontSize: 10, fontWeight: '800' },
  tokenSizeValue: { color: colors.gameText, fontSize: 13, fontWeight: '900' },
});
