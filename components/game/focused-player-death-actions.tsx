import { HeartPulse, Undo2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';

type FocusedPlayerDeathActionsProps = {
  canRevive: boolean;
  isAlive: boolean;
  onRevive: () => void;
  playerName: string;
};

export function FocusedPlayerDeathActions({
  canRevive,
  isAlive,
  onRevive,
  playerName,
}: FocusedPlayerDeathActionsProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <FocusedPlayerReviveButton
        disabled={!canRevive}
        onPress={onRevive}
        playerName={playerName}
        subtitle={
          isAlive
            ? 'Player is already alive'
            : 'Mark player as alive and add a revive to the death log'
        }
      />
    </View>
  );
}

export function FocusedPlayerUndoDeathButton({
  disabled,
  onPress,
  playerName,
}: {
  disabled: boolean;
  onPress: () => void;
  playerName: string;
}) {
  return (
    <Pressable
      accessibilityHint="Remove the death entry from the death log"
      accessibilityLabel={`Undo death for ${playerName}`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? '#1f2937' : '#111827',
        borderColor: disabled ? '#1f2937' : '#334155',
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        minWidth: 48,
        opacity: disabled ? 0.48 : 1,
        paddingVertical: 14,
      })}
    >
      <Undo2 color={disabled ? '#94a3b8' : '#f8fafc'} size={17} strokeWidth={2.7} />
    </Pressable>
  );
}

function FocusedPlayerReviveButton({
  disabled,
  onPress,
  playerName,
  subtitle,
}: {
  disabled: boolean;
  onPress: () => void;
  playerName: string;
  subtitle: string;
}) {
  return (
    <Pressable
      accessibilityHint={subtitle}
      accessibilityLabel={`Revive ${playerName}`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? '#1f2937' : '#111827',
        borderColor: disabled ? '#1f2937' : '#22c55e',
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        flexBasis: 0,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        minWidth: 0,
        opacity: disabled ? 0.48 : 1,
        paddingVertical: 14,
      })}
    >
      <HeartPulse color={disabled ? '#94a3b8' : '#86efac'} size={17} strokeWidth={2.7} />
      <Text
        style={{
          color: disabled ? '#94a3b8' : '#f8fafc',
          fontWeight: '900',
        }}
      >
        Revive
      </Text>
    </Pressable>
  );
}
