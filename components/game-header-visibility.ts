import { useSharedValue } from 'react-native-reanimated';

// Module-level singleton shared value. Both the game screen (writer) and the
// GameHeader (reader, via useAnimatedStyle) import this same instance, so the
// header can be animated from the screen's scroll handler without needing a
// provider that wraps the navigator-rendered header.
export const gameHeaderTranslateY = useSharedValue(0);
