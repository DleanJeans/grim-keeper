import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { ConversationTable } from '@/components/conversation-table';
import { GameMap } from '@/components/game-map';
import { InteractionList } from '@/components/interaction-list';
import { Text } from '@/components/text';
import { getGameById, useGameStore } from '@/store/game-store';

type GameTab = 'map' | 'table' | 'interactions';

const gameTabs: { label: string; value: GameTab }[] = [
  { label: 'Map', value: 'map' },
  { label: 'Table', value: 'table' },
  { label: 'Interactions', value: 'interactions' },
];

export default function GameRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const games = useGameStore((state) => state.games);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const addConversation = useGameStore((state) => state.addConversation);
  const deleteConversation = useGameStore((state) => state.deleteConversation);
  const setActiveDay = useGameStore((state) => state.setActiveDay);
  const [activeTab, setActiveTab] = useState<GameTab>('map');
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

  function handleChangeDay(day: number) {
    handleCancelInteraction();
    setActiveDay(activeGame.id, day);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: '#0b1120', flex: 1 }}
      contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 40 }}
    >
      <Stack.Screen options={{ title: `Day ${activeGame.activeDay}` }} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          disabled={activeGame.activeDay === 1}
          onPress={() => handleChangeDay(activeGame.activeDay - 1)}
          style={{
            alignItems: 'center',
            backgroundColor: activeGame.activeDay === 1 ? '#1f2937' : '#334155',
            borderRadius: 8,
            flex: 1,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: activeGame.activeDay === 1 ? '#64748b' : '#f8fafc' }}>
            Previous
          </Text>
        </Pressable>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#111827',
            borderColor: '#334155',
            borderRadius: 8,
            borderWidth: 1,
            flex: 1,
            justifyContent: 'center',
            paddingVertical: 12,
          }}
        >
          <Text selectable style={{ color: '#f8fafc', fontWeight: '900' }}>
            Day {activeGame.activeDay}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => handleChangeDay(activeGame.activeDay + 1)}
          style={{
            alignItems: 'center',
            backgroundColor: '#334155',
            borderRadius: 8,
            flex: 1,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: '#f8fafc' }}>Next</Text>
        </Pressable>
      </View>

      <View
        style={{ backgroundColor: '#111827', borderRadius: 8, flexDirection: 'row', padding: 4 }}
      >
        {gameTabs.map((tab) => (
          <Pressable
            key={tab.value}
            accessibilityRole="button"
            onPress={() => setActiveTab(tab.value)}
            style={{
              alignItems: 'center',
              backgroundColor: activeTab === tab.value ? '#f8fafc' : 'transparent',
              borderRadius: 6,
              flex: 1,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                color: activeTab === tab.value ? '#0b1120' : '#94a3b8',
                fontSize: 13,
                fontWeight: '800',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'map' ? (
        <>
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
            onMovePlayer={(playerId, position) =>
              updatePlayerPosition(activeGame.id, playerId, position)
            }
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
        </>
      ) : activeTab === 'table' ? (
        <ConversationTable
          activeDay={activeGame.activeDay}
          conversations={activeGame.conversations}
          players={activeGame.players}
        />
      ) : (
        <InteractionList
          activeDay={activeGame.activeDay}
          conversations={activeGame.conversations}
          players={activeGame.players}
          onDeleteConversation={(conversationId) =>
            deleteConversation(activeGame.id, conversationId)
          }
        />
      )}
    </ScrollView>
  );
}
