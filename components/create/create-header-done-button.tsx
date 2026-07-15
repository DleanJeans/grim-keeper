import { Check } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function CreateHeaderDoneButton({
  canStart,
  onPress,
}: {
  canStart: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel="Done editing players"
      accessibilityRole="button"
      disabled={!canStart}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: !canStart
          ? colors.disabled
          : pressed
            ? colors.surfacePressed
            : colors.primary,
        borderRadius: 8,
        flexDirection: 'row',
        gap: 5,
        opacity: !canStart ? 0.75 : 1,
        paddingHorizontal: 10,
        paddingVertical: 7,
      })}
    >
      <Check color={canStart ? colors.onPrimary : colors.onDisabled} size={15} strokeWidth={2.7} />
      <Text style={{ color: canStart ? colors.onPrimary : colors.onDisabled, fontWeight: '800' }}>
        Done
      </Text>
    </Pressable>
  );
}
