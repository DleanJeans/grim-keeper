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
    focusedPlayer,
    players,
    selectedPlayerIds,
    trackingMode,
    handleCancelTracking: onCancel,
    handleConfirmTracking: onConfirm,
  } = useGameRouteContext();

  const { confirmLabel, cancelFlex, confirmFlex } = (() => {
    if (trackingMode === 'nomination') {
      // handleStartTracking seeds selectedPlayerIds with the nominator (focused
      // player); the actual nominee is the first player the user taps after
      // that, so it sits at index 1. Voters fill the rest.
      const nomineeId = selectedPlayerIds[1];
      const nominee = players.find((player) => player.id === nomineeId);
      return {
        confirmLabel: nominee ? `Confirm: ${nominee.name}` : 'Confirm Nomination',
        cancelFlex: 0.82,
        confirmFlex: 1.18,
      };
    }
    // 'interaction' (or any future mode): fall back to focused player name.
    return {
      confirmLabel: focusedPlayer ? `Confirm: ${focusedPlayer.name}` : 'Confirm',
      cancelFlex: 1,
      confirmFlex: 1,
    };
  })();

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
