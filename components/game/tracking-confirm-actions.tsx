import { Check, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { confirmRowStyle, onDarkText, solidActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';

const confirmTextBase = {
  ...onDarkText,
  flexShrink: 1,
  minWidth: 0,
};

export function TrackingConfirmActions() {
  const {
    selectedPlayerIds,
    trackingConfirmLabel: confirmLabel,
    trackingCancelFlex: cancelFlex,
    trackingConfirmFlex: confirmFlex,
    handleCancelTracking: onCancel,
    handleConfirmTracking: onConfirm,
  } = useGameRouteContext();
  const disabled = selectedPlayerIds.length < 2;
  return (
    <View style={confirmRowStyle}>
      <Pressable
        accessibilityRole="button"
        onPress={onCancel}
        style={solidActionStyle({ backgroundColor: '#334155', flex: cancelFlex })}
      >
        <X color="#f8fafc" size={17} strokeWidth={2.7} />
        <Text style={onDarkText}>Cancel</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onConfirm}
        style={solidActionStyle({
          backgroundColor: disabled ? '#334155' : '#16a34a',
          flex: confirmFlex,
        })}
      >
        <Check color={disabled ? '#94a3b8' : '#f8fafc'} size={17} strokeWidth={2.7} />
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          style={{
            ...confirmTextBase,
            color: disabled ? '#94a3b8' : '#f8fafc',
          }}
        >
          {confirmLabel}
        </Text>
      </Pressable>
    </View>
  );
}
