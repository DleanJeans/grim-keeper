import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';

import { useGameStore } from '@/store/game-store';
import { hasDuplicatePlayerName, normalizePlayerName } from '@/utils/conversation-utils';

type DraftPlayer = {
  id: string;
  name: string;
};

export default function CreateRoute() {
  const createGame = useGameStore((state) => state.createGame);
  const [name, setName] = useState('');
  const [players, setPlayers] = useState<DraftPlayer[]>([]);
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
    <DraggableFlatList
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: '#0b1120', flex: 1 }}
      contentContainerStyle={{ gap: 12, padding: 20, paddingBottom: 40 }}
      data={players}
      keyExtractor={(item) => item.id}
      onDragEnd={({ data }) => setPlayers(data)}
      ListHeaderComponent={
        <View style={{ gap: 12, paddingBottom: 8 }}>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            enterKeyHint="done"
            onChangeText={setName}
            onSubmitEditing={handleAddPlayer}
            placeholder="Player name"
            placeholderTextColor="#64748b"
            returnKeyType="done"
            value={name}
            style={{
              backgroundColor: '#111827',
              borderColor: duplicateName ? '#ef4444' : '#334155',
              borderRadius: 8,
              borderWidth: 1,
              color: '#f8fafc',
              fontSize: 18,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              disabled={!canAddPlayer}
              onPress={handleAddPlayer}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: !canAddPlayer ? '#334155' : pressed ? '#e2e8f0' : '#f8fafc',
                borderRadius: 8,
                flex: 1,
                paddingVertical: 13,
              })}
            >
              <Text style={{ color: canAddPlayer ? '#0b1120' : '#94a3b8', fontWeight: '800' }}>
                Add
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={!canStart}
              onPress={handleStart}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: !canStart ? '#334155' : pressed ? '#22c55e' : '#16a34a',
                borderRadius: 8,
                flex: 1,
                paddingVertical: 13,
              })}
            >
              <Text style={{ color: canStart ? '#f8fafc' : '#94a3b8', fontWeight: '800' }}>
                Start
              </Text>
            </Pressable>
          </View>

          <Text
            selectable
            style={{
              color: duplicateName ? '#fca5a5' : '#94a3b8',
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {helperText}
          </Text>
        </View>
      }
      renderItem={renderPlayerRow}
      ListEmptyComponent={
        <View
          style={{
            borderColor: '#1f2937',
            borderRadius: 8,
            borderWidth: 1,
            padding: 16,
          }}
        >
          <Text selectable style={{ color: '#94a3b8', fontSize: 16 }}>
            No players yet.
          </Text>
        </View>
      }
    />
  );
}

function renderPlayerRow({ item, drag, isActive, getIndex }: RenderItemParams<DraftPlayer>) {
  const index = getIndex() ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      onLongPress={drag}
      style={{
        backgroundColor: isActive ? '#1e293b' : '#111827',
        borderColor: isActive ? '#f8fafc' : '#334155',
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 12,
        padding: 16,
      }}
    >
      <Text selectable style={{ color: '#94a3b8', fontVariant: ['tabular-nums'], width: 24 }}>
        {index + 1}
      </Text>
      <Text selectable style={{ color: '#f8fafc', flex: 1, fontSize: 17, fontWeight: '700' }}>
        {item.name}
      </Text>
      <Text selectable style={{ color: '#64748b', fontSize: 13 }}>
        Hold
      </Text>
    </Pressable>
  );
}

function createDraftId() {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
