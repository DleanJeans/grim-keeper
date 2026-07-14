import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';

type KillerPlayerPickerProps = {
  players: Player[];
  selectedPlayerId: string | null;
  targetPlayerId: string;
  onSelect: (playerId: string | null) => void;
};

export function KillerPlayerPicker({
  onSelect,
  players,
  selectedPlayerId,
  targetPlayerId,
}: KillerPlayerPickerProps) {
  const selectablePlayers = players.filter((player) => player.id !== targetPlayerId);

  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '800' }}>
        Killer player
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <KillerOption
          label="Unknown"
          selected={selectedPlayerId === null}
          onPress={() => onSelect(null)}
        />
        {selectablePlayers.map((player) => (
          <KillerOption
            key={player.id}
            label={player.name}
            selected={selectedPlayerId === player.id}
            onPress={() => onSelect(player.id)}
          />
        ))}
      </View>
    </View>
  );
}

function KillerOption({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`${selected ? 'Selected' : 'Select'} killer ${label}`}
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
      <Text
        selectable
        style={{ color: selected ? colors.text : colors.textMuted, fontWeight: '700' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
