import { Check, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { confirmRowStyle, onDarkText, solidActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

const confirmTextStyle = {
  ...onDarkText,
  flexShrink: 1,
  minWidth: 0,
};

export function VoteConfirmActions() {
  const { selectedPlayerIds, handleCancelVoting, handleConfirmVotes } = useGameRouteContext();
  return (
    <View style={confirmRowStyle}>
      <Pressable
        accessibilityRole="button"
        onPress={handleCancelVoting}
        style={solidActionStyle({ backgroundColor: colors.gameBorder, flex: 0.75 })}
      >
        <X color="#f8fafc" size={17} strokeWidth={2.7} />
        <Text style={onDarkText}>Cancel</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={handleConfirmVotes}
        style={solidActionStyle({ backgroundColor: colors.gameConfirm, flex: 1.25 })}
      >
        <Check color="#f8fafc" size={17} strokeWidth={2.7} />
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          style={confirmTextStyle}
        >
          Confirm {selectedPlayerIds.length} Votes
        </Text>
      </Pressable>
    </View>
  );
}
