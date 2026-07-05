import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';

import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { hasDuplicatePlayerName, normalizePlayerName } from '@/utils/conversation-utils';

type DraftPlayer = {
  id: string;
  name: string;
};

export default function CreateRoute() {
  const createGame = useGameStore((state) => state.createGame);
  const [name, setName] = useState('');
  const [players, setPlayers] = useState<DraftPlayer[]>([]);
  const playerOrderKey = useMemo(() => players.map((player) => player.id).join('|'), [players]);
  const playerIndexes = useMemo(
    () => new Map(players.map((player, index) => [player.id, index])),
    [players],
  );
  const normalizedName = normalizePlayerName(name);
  const duplicateName = hasDuplicatePlayerName(
    players.map((player) => player.name),
    name,
  );
  const canAddPlayer = normalizedName.length > 0 && !duplicateName;
  const canStart = players.length >= 2 && !(normalizedName.length > 0 && duplicateName);

  const helperText = useMemo(() => {
    if (duplicateName) {
      return 'That player already exists.';
    }

    if (players.length < 2) {
      return 'Add at least 2 players.';
    }

    return 'Long press a player to drag them into seat order.';
  }, [duplicateName, players.length]);

  function handleAddPlayer() {
    if (!canAddPlayer) {
      return;
    }

    setPlayers((currentPlayers) => [
      ...currentPlayers,
      { id: createDraftId(), name: normalizedName },
    ]);
    setName('');
  }

  function handleStart() {
    if (!canStart) {
      return;
    }

    Keyboard.dismiss();
    const game = createGame({ playerNames: players.map((player) => player.name) });
    router.replace({ pathname: '/game/[id]', params: { id: game.id } });
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <View style={{ gap: 14, padding: 20, paddingBottom: 12 }}>
        <View style={{ gap: 6 }}>
          <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>
            Seat the circle
          </Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 15, lineHeight: 22 }}>
            Add players in any order, then long press to set the final seat order.
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
            Player name
          </Text>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            enterKeyHint="done"
            onChangeText={setName}
            onSubmitEditing={handleAddPlayer}
            returnKeyType="done"
            value={name}
            style={{
              backgroundColor: colors.surface,
              borderColor: duplicateName ? colors.danger : colors.border,
              borderRadius: 8,
              borderWidth: 1,
              color: colors.text,
              fontSize: 18,
              minHeight: 52,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            disabled={!canAddPlayer}
            onPress={handleAddPlayer}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: !canAddPlayer
                ? colors.disabled
                : pressed
                  ? colors.surfacePressed
                  : colors.surfaceRaised,
              borderColor: colors.border,
              borderRadius: 8,
              borderWidth: 1,
              flex: 1,
              minHeight: 48,
              paddingVertical: 13,
            })}
          >
            <Text
              style={{ color: canAddPlayer ? colors.text : colors.onDisabled, fontWeight: '800' }}
            >
              Add
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={!canStart}
            onPress={handleStart}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: !canStart
                ? colors.disabled
                : pressed
                  ? colors.surfacePressed
                  : colors.primary,
              borderRadius: 8,
              flex: 1,
              minHeight: 48,
              paddingVertical: 13,
            })}
          >
            <Text
              style={{ color: canStart ? colors.onPrimary : colors.onDisabled, fontWeight: '800' }}
            >
              Start
            </Text>
          </Pressable>
        </View>

        <Text
          selectable
          style={{
            color: duplicateName ? colors.danger : colors.textMuted,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {helperText}
        </Text>
      </View>

      {players.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: 8,
            borderWidth: 1,
            gap: 8,
            marginHorizontal: 20,
            padding: 18,
          }}
        >
          <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
            No players yet.
          </Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
            Type a name and press Enter or Add.
          </Text>
        </View>
      ) : (
        <DraggableFlatList
          activationDistance={8}
          containerStyle={{ backgroundColor: colors.background, flex: 1 }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          extraData={playerOrderKey}
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ gap: 10, padding: 20, paddingTop: 4, paddingBottom: 40 }}
          data={players}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => setPlayers(data)}
          renderItem={(params) => (
            <PlayerRow
              {...params}
              index={playerIndexes.get(params.item.id) ?? params.getIndex() ?? 0}
            />
          )}
        />
      )}
    </View>
  );
}

function PlayerRow({
  drag,
  index,
  isActive,
  item,
}: RenderItemParams<DraftPlayer> & { index: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      onLongPress={drag}
      style={{
        backgroundColor: isActive ? colors.surfacePressed : colors.surface,
        borderColor: isActive ? colors.primary : colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 12,
        minHeight: 54,
        padding: 16,
      }}
    >
      <Text
        selectable
        style={{ color: colors.textMuted, fontVariant: ['tabular-nums'], width: 24 }}
      >
        {index + 1}
      </Text>
      <Text selectable style={{ color: colors.text, flex: 1, fontSize: 17, fontWeight: '700' }}>
        {item.name}
      </Text>
      <Text selectable style={{ color: colors.textSubtle, fontSize: 13 }}>
        Hold
      </Text>
    </Pressable>
  );
}

function createDraftId() {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
