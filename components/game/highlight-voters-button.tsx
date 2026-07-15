import { Users } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { onDarkText, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';

type HighlightVotersButtonProps = {
  active: boolean;
  disabled: boolean;
  onPress: () => void;
};

export function HighlightVotersButton({ active, disabled, onPress }: HighlightVotersButtonProps) {
  const label = active ? 'Clear voter highlights' : 'Highlight voters';
  const iconColor = disabled ? '#64748b' : active ? '#86efac' : '#f8fafc';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) =>
        outlinedActionStyle({
          borderColor: active ? '#86efac' : undefined,
          disabled,
          paddingVertical: 12,
          pressed,
        })
      }
    >
      <Users color={iconColor} size={17} strokeWidth={2.6} />
      <Text style={{ ...onDarkText, color: iconColor }}>{label}</Text>
    </Pressable>
  );
}
