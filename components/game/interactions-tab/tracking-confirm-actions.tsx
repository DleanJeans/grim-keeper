import { Check, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { confirmRowStyle, onDarkText, solidActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function TrackingConfirmActions() {
  const {
    focusedPlayer,
    players,
    selectedPlayerIds,
    trackingMode,
    handleCancelTracking: onCancel,
    handleConfirmTracking: onConfirm,
  } = useGameRouteContext();

  const { confirmLabel, confirmPlayer, cancelFlex, confirmFlex } = (() => {
    if (trackingMode === 'nomination') {
      // handleStartTracking seeds selectedPlayerIds with the nominator (focused
      // player); the actual nominee is the first player the user taps after
      // that, so it sits at index 1. Voters fill the rest.
      const nomineeId = selectedPlayerIds[1];
      const nominee = players.find((player) => player.id === nomineeId);
      return {
        confirmLabel: nominee ? `Confirm: ${nominee.name}` : 'Confirm Nomination',
        confirmPlayer: nominee,
        cancelFlex: 0.82,
        confirmFlex: 1.18,
      };
    }
    // 'interaction' (or any future mode): fall back to focused player name.
    return {
      confirmLabel: focusedPlayer ? `Confirm: ${focusedPlayer.name}` : 'Confirm',
      confirmPlayer: focusedPlayer,
      cancelFlex: 1,
      confirmFlex: 1,
    };
  })();

  const disabled = selectedPlayerIds.length < 2;
  const confirmTextStyle = [styles.confirmText, disabled && styles.confirmTextDisabled];
  return (
    <View style={confirmRowStyle}>
      <Pressable
        accessibilityRole="button"
        onPress={onCancel}
        style={solidActionStyle({ backgroundColor: colors.gameBorder, flex: cancelFlex })}
      >
        <X color={colors.gameText} size={17} strokeWidth={2.7} />
        <Text style={onDarkText}>Cancel</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onConfirm}
        style={solidActionStyle({
          backgroundColor: disabled ? colors.gameBorder : colors.gameConfirm,
          flex: confirmFlex,
        })}
      >
        <Check
          color={disabled ? colors.gameTextMuted : colors.gameText}
          size={17}
          strokeWidth={2.7}
        />
        {confirmPlayer ? (
          <View style={styles.confirmPlayer}>
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              numberOfLines={1}
              style={confirmTextStyle}
            >
              Confirm:
            </Text>
            <PlayerNameWithRole
              player={confirmPlayer}
              iconSize={14}
              style={styles.confirmPlayerName}
              textStyle={confirmTextStyle}
            />
          </View>
        ) : (
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={1}
            style={confirmTextStyle}
          >
            {confirmLabel}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  confirmPlayer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 4,
  },
  confirmPlayerName: {
    flexShrink: 1,
  },
  confirmText: {
    ...onDarkText,
    flexShrink: 1,
    minWidth: 0,
  },
  confirmTextDisabled: {
    color: colors.gameTextMuted,
  },
});
