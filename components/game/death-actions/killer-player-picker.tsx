import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';

type KillerPlayerPickerProps = {
  onClear: () => void;
  onToggle: (playerId: string) => void;
  players: Player[];
  selectedPlayerIds: string[];
  targetPlayerId: string;
};

export function KillerPlayerPicker({
  onClear,
  onToggle,
  players,
  selectedPlayerIds,
  targetPlayerId,
}: KillerPlayerPickerProps) {
  const selectablePlayers = players.filter((player) => player.id !== targetPlayerId);

  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '800' }}>
        Killer players
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <KillerOption label="Unknown" selected={selectedPlayerIds.length === 0} onPress={onClear} />
        {selectablePlayers.map((player) => (
          <KillerOption
            key={player.id}
            player={player}
            selected={selectedPlayerIds.includes(player.id)}
            onPress={() => onToggle(player.id)}
          />
        ))}
      </View>
    </View>
  );
}

function KillerOption({
  label,
  onPress,
  player,
  selected,
}: {
  label?: string;
  onPress: () => void;
  player?: Player;
  selected: boolean;
}) {
  const displayLabel = player?.name ?? label ?? 'Unknown';

  return (
    <Pressable
      accessibilityLabel={`${selected ? 'Selected' : 'Select'} killer ${displayLabel}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed
          ? colors.surfacePressed
          : selected
            ? colors.surfaceRaised
            : colors.surface,
        borderColor: selected ? colors.primary : colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 9,
      })}
    >
      {selected ? <Check color={colors.primary} size={14} strokeWidth={3} /> : null}
      {player ? (
        <PlayerNameWithRole
          player={player}
          roleIconSize={18}
          textStyle={{ color: selected ? colors.text : colors.textMuted, fontWeight: '700' }}
        />
      ) : (
        <Text
          selectable
          style={{ color: selected ? colors.text : colors.textMuted, fontWeight: '700' }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
