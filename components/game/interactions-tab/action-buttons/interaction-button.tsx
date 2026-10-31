import { MessageCircle } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { onDarkTextStrong, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type InteractionButtonProps = {
  flex?: number;
  onPress: () => void;
  playerName: string;
};

export function InteractionButton({ flex = 1, onPress, playerName }: InteractionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`Track interaction from ${playerName}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => outlinedActionStyle({ pressed, flex })}
    >
      <MessageCircle color={colors.gameText} size={17} strokeWidth={2.7} />
      <Text style={onDarkTextStrong}>Track Interaction</Text>
    </Pressable>
  );
}
