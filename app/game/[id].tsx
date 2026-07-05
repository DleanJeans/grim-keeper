import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { GameMap } from '@/components/game-map';
import { getGameById, useGameStore } from '@/store/game-store';

export default function GameRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const games = useGameStore((state) => state.games);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const addConversation = useGameStore((state) => state.addConversation);
  const [interactionMode, setInteractionMode] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const game = getGameById(games, id);
  const mapSize = Math.min(width - 40, 520);

  if (!game) {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: '#0b1120',
          flex: 1,
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <Stack.Screen options={{ title: 'Game not found' }} />
        <Text selectable style={{ color: '#f8fafc', fontSize: 17, fontWeight: '700' }}>
          Game not found.
        </Text>
      </View>
    );
  }

  const activeGame = game;

  function handleSelectPlayer(playerId: string) {
    setSelectedPlayerIds((currentIds) =>
      currentIds.includes(playerId)
        ? currentIds.filter((currentId) => currentId !== playerId)
        : [...currentIds, playerId],
    );
  }

  function handleCancelInteraction() {
    setInteractionMode(false);
    setSelectedPlayerIds([]);
  }

  function handleConfirmInteraction() {
    if (selectedPlayerIds.length < 2) {
      return;
    }

    addConversation(activeGame.id, activeGame.activeDay, selectedPlayerIds);
    handleCancelInteraction();
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: '#0b1120', flex: 1 }}
      contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 40 }}
    >
      <Stack.Screen options={{ title: `Day ${activeGame.activeDay}` }} />

      <Text selectable style={{ color: '#94a3b8', fontSize: 15, lineHeight: 21 }}>
        {interactionMode
          ? 'Select 2 or more players. The first selected player initiated the conversation.'
          : 'Long press a token to move it around the circle.'}
      </Text>

      <GameMap
        activeDay={activeGame.activeDay}
        conversations={activeGame.conversations}
        interactionMode={interactionMode}
        mapSize={mapSize}
        players={activeGame.players}
        onMovePlayer={(playerId, position) => updatePlayerPosition(activeGame.id, playerId, position)}
        onSelectPlayer={handleSelectPlayer}
        selectedPlayerIds={selectedPlayerIds}
      />

      {interactionMode ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            onPress={handleCancelInteraction}
            style={{
              alignItems: 'center',
              backgroundColor: '#334155',
              borderRadius: 8,
              flex: 1,
              paddingVertical: 14,
            }}
          >
            <Text style={{ color: '#f8fafc', fontWeight: '800' }}>Cancel</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={selectedPlayerIds.length < 2}
            onPress={handleConfirmInteraction}
            style={{
              alignItems: 'center',
              backgroundColor: selectedPlayerIds.length < 2 ? '#334155' : '#16a34a',
              borderRadius: 8,
              flex: 1,
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                color: selectedPlayerIds.length < 2 ? '#94a3b8' : '#f8fafc',
                fontWeight: '800',
              }}
            >
              Confirm
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setInteractionMode(true)}
          style={{
            alignItems: 'center',
            alignSelf: 'flex-end',
            backgroundColor: '#f8fafc',
            borderRadius: 999,
            paddingHorizontal: 20,
            paddingVertical: 14,
          }}
        >
          <Text style={{ color: '#0b1120', fontWeight: '900' }}>Add</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
