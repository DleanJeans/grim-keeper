import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FullscreenButton } from '@/components/fullscreen-button';
import { EditGameButton } from '@/components/game/edit-game-button';
import { ViewScriptButton } from '@/components/game/view-script-button';
import { colors } from '@/theme/colors';
import type { Game } from '@/types/game';
import { goBackOrHome } from '@/utils/navigation-utils';

// Visual gap between the bottom of the header and the first content item.
// Combined with the row height to compute the total reserved space the scroll
// content needs to stay below the absolutely-positioned header.
const ROW_HEIGHT = 40;
const VISUAL_GAP = 20;
export const INLINE_GAME_HEADER_HEIGHT = ROW_HEIGHT + VISUAL_GAP;

type InlineGameHeaderProps = {
  activeGame: Game;
  headerTranslateY: SharedValue<number>;
};

export function InlineGameHeader({ activeGame, headerTranslateY }: InlineGameHeaderProps) {
  const insets = useSafeAreaInsets();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }));
  const gameScriptId = activeGame.script?.id;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.header,
        { paddingTop: insets.top, height: insets.top + ROW_HEIGHT },
        animatedStyle,
      ]}
    >
      <View style={styles.row}>
        <View>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={goBackOrHome}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <ChevronLeft color={colors.text} size={24} strokeWidth={2.5} />
          </Pressable>
        </View>

        <View style={styles.slot}>
          <EditGameButton
            onPress={() => router.push({ pathname: '/create', params: { gameId: activeGame.id } })}
          />
        </View>
        <View style={styles.slot}>
          {gameScriptId ? (
            <ViewScriptButton
              onPress={() =>
                router.push({ pathname: '/scripts/[id]', params: { id: gameScriptId } })
              }
            />
          ) : null}
        </View>
        <FullscreenButton />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    marginLeft: -8,
    width: 36,
  },
  header: {
    backgroundColor: colors.background,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  pressed: {
    opacity: 0.65,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    height: ROW_HEIGHT,
    paddingHorizontal: 8,
    gap: 8,
  },
  slot: {
    alignItems: 'stretch',
    flex: 1,
  },
});
