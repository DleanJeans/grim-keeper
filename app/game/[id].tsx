import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  List,
  Map as MapIcon,
  Plus,
  RotateCcw,
  RotateCw,
  Table2,
  UserPlus,
  Vote,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { AddPlayerModal } from '@/components/add-player-modal';
import { ConversationTable } from '@/components/conversation-table';
import { GameMap } from '@/components/game-map';
import { InteractionList } from '@/components/interaction-list';
import { NominationList } from '@/components/nomination-list';
import { Text } from '@/components/text';
import { getGameById, useGameStore } from '@/store/game-store';
import { rotatePlayerMapPositions } from '@/utils/layout-utils';

type GameTab = 'map' | 'table' | 'interactions' | 'nominations';
type TrackingMode = 'interaction' | 'nomination';

const gameTabs: { label: string; value: GameTab }[] = [
  { label: 'Map', value: 'map' },
  { label: 'Interactions', value: 'interactions' },
  { label: 'Noms', value: 'nominations' },
  { label: 'Table', value: 'table' },
];
const rotationStepRadians = Math.PI / 8;

function renderGameTabIcon(tab: GameTab, color: string) {
  switch (tab) {
    case 'map':
      return <MapIcon color={color} size={15} strokeWidth={2.5} />;
    case 'interactions':
      return <List color={color} size={15} strokeWidth={2.5} />;
    case 'nominations':
      return <Vote color={color} size={15} strokeWidth={2.5} />;
    case 'table':
      return <Table2 color={color} size={15} strokeWidth={2.5} />;
  }
}

export default function GameRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { height, width } = useWindowDimensions();
  const games = useGameStore((state) => state.games);
  const addPlayer = useGameStore((state) => state.addPlayer);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const updatePlayerPositions = useGameStore((state) => state.updatePlayerPositions);
  const addConversation = useGameStore((state) => state.addConversation);
  const updateNominationVotes = useGameStore((state) => state.updateNominationVotes);
  const deleteConversation = useGameStore((state) => state.deleteConversation);
  const setActiveDay = useGameStore((state) => state.setActiveDay);
  const [activeTab, setActiveTab] = useState<GameTab>('map');
  const [addPlayerVisible, setAddPlayerVisible] = useState(false);
  const [trackingMode, setTrackingMode] = useState<TrackingMode | null>(null);
  const [votingNominationId, setVotingNominationId] = useState<string | null>(null);
  const [focusedPlayerId, setFocusedPlayerId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const game = getGameById(games, id);
  const mapWidth = Math.max(1, width - 40);
  const mapHeight = Math.max(mapWidth, Math.floor(height * 0.52));

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
  const focusedPlayer = activeGame.players.find((player) => player.id === focusedPlayerId);
  const highlightedPlayerIds = trackingMode
    ? selectedPlayerIds
    : votingNominationId
      ? selectedPlayerIds
      : focusedPlayerId
        ? [focusedPlayerId]
        : [];
  const trackingConfirmLabel = trackingMode === 'nomination' ? 'Confirm Nomination' : 'Confirm';

  function handleSelectPlayer(playerId: string) {
    if (votingNominationId) {
      setSelectedPlayerIds((currentIds) =>
        currentIds.includes(playerId)
          ? currentIds.filter((currentId) => currentId !== playerId)
          : [...currentIds, playerId],
      );
      return;
    }

    if (!trackingMode) {
      setFocusedPlayerId((currentPlayerId) => (currentPlayerId === playerId ? null : playerId));
      return;
    }

    if (trackingMode === 'nomination') {
      setSelectedPlayerIds((currentIds) =>
        currentIds[0] === playerId ? currentIds : [currentIds[0], playerId],
      );
      return;
    }

    setSelectedPlayerIds((currentIds) =>
      currentIds[0] === playerId
        ? currentIds
        : currentIds.includes(playerId)
          ? currentIds.filter((currentId) => currentId !== playerId)
          : [...currentIds, playerId],
    );
  }

  function handleStartTracking(mode: TrackingMode) {
    if (!focusedPlayerId) {
      return;
    }

    setTrackingMode(mode);
    setSelectedPlayerIds([focusedPlayerId]);
  }

  function handleCancelTracking() {
    setTrackingMode(null);
    setVotingNominationId(null);
    setFocusedPlayerId(null);
    setSelectedPlayerIds([]);
  }

  function handleConfirmTracking() {
    if (selectedPlayerIds.length < 2 || !trackingMode) {
      return;
    }

    const conversation = addConversation(
      activeGame.id,
      activeGame.activeDay,
      selectedPlayerIds,
      trackingMode,
    );

    if (trackingMode === 'nomination' && conversation) {
      setTrackingMode(null);
      setVotingNominationId(conversation.id);
      setFocusedPlayerId(null);
      setSelectedPlayerIds([]);
      return;
    }

    handleCancelTracking();
  }

  function handleConfirmVotes() {
    if (!votingNominationId) {
      return;
    }

    updateNominationVotes(activeGame.id, votingNominationId, selectedPlayerIds);
    handleCancelTracking();
  }

  function handleChangeDay(day: number) {
    handleCancelTracking();
    setActiveDay(activeGame.id, day);
  }

  function handleRotateTokens(angleRadians: number) {
    updatePlayerPositions(
      activeGame.id,
      rotatePlayerMapPositions(activeGame.players, mapWidth, mapHeight, angleRadians),
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Day ${activeGame.activeDay}`,
          headerRight: () => (
            <Pressable
              accessibilityLabel="Add missing player"
              accessibilityRole="button"
              onPress={() => setAddPlayerVisible(true)}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed ? '#1f2937' : '#111827',
                borderColor: '#334155',
                borderRadius: 999,
                borderWidth: 1,
                flexDirection: 'row',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 7,
              })}
            >
              <UserPlus color="#f8fafc" size={15} strokeWidth={2.5} />
              <Text style={{ color: '#f8fafc', fontSize: 13, fontWeight: '900' }}>Player</Text>
            </Pressable>
          ),
        }}
      />

      <AddPlayerModal
        players={activeGame.players}
        visible={addPlayerVisible}
        onAddPlayer={(name) => addPlayer(activeGame.id, name)}
        onClose={() => setAddPlayerVisible(false)}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: '#0b1120', flex: 1 }}
        contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 40 }}
      >
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
              flexDirection: 'row',
              gap: 6,
              justifyContent: 'center',
              paddingVertical: 12,
            }}
          >
            <ChevronLeft
              color={activeGame.activeDay === 1 ? '#64748b' : '#f8fafc'}
              size={17}
              strokeWidth={2.7}
            />
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
              flexDirection: 'row',
              gap: 6,
              justifyContent: 'center',
              paddingVertical: 12,
            }}
          >
            <ChevronRight color="#f8fafc" size={17} strokeWidth={2.7} />
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
                flexDirection: 'row',
                gap: 4,
                justifyContent: 'center',
                paddingVertical: 10,
              }}
            >
              {renderGameTabIcon(tab.value, activeTab === tab.value ? '#0b1120' : '#94a3b8')}
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
            <GameMap
              activeDay={activeGame.activeDay}
              conversations={activeGame.conversations}
              interactionMode={!!trackingMode || !!votingNominationId}
              mapHeight={mapHeight}
              mapWidth={mapWidth}
              players={activeGame.players}
              onMovePlayer={(playerId, position) =>
                updatePlayerPosition(activeGame.id, playerId, position)
              }
              onSelectPlayer={handleSelectPlayer}
              selectedPlayerIds={highlightedPlayerIds}
            />

            {votingNominationId ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleCancelTracking}
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#334155',
                    borderRadius: 8,
                    flex: 1,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    paddingVertical: 14,
                  }}
                >
                  <X color="#f8fafc" size={17} strokeWidth={2.7} />
                  <Text style={{ color: '#f8fafc', fontWeight: '800' }}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleConfirmVotes}
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#16a34a',
                    borderRadius: 8,
                    flex: 1,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    paddingVertical: 14,
                  }}
                >
                  <Check color="#f8fafc" size={17} strokeWidth={2.7} />
                  <Text style={{ color: '#f8fafc', fontWeight: '800' }}>Confirm Votes</Text>
                </Pressable>
              </View>
            ) : trackingMode ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleCancelTracking}
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#334155',
                    borderRadius: 8,
                    flex: 1,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    paddingVertical: 14,
                  }}
                >
                  <X color="#f8fafc" size={17} strokeWidth={2.7} />
                  <Text style={{ color: '#f8fafc', fontWeight: '800' }}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={selectedPlayerIds.length < 2}
                  onPress={handleConfirmTracking}
                  style={{
                    alignItems: 'center',
                    backgroundColor: selectedPlayerIds.length < 2 ? '#334155' : '#16a34a',
                    borderRadius: 8,
                    flex: 1,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    paddingVertical: 14,
                  }}
                >
                  <Check
                    color={selectedPlayerIds.length < 2 ? '#94a3b8' : '#f8fafc'}
                    size={17}
                    strokeWidth={2.7}
                  />
                  <Text
                    style={{
                      color: selectedPlayerIds.length < 2 ? '#94a3b8' : '#f8fafc',
                      fontWeight: '800',
                    }}
                  >
                    {trackingConfirmLabel}
                  </Text>
                </Pressable>
              </View>
            ) : focusedPlayer ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  accessibilityLabel={`Track interaction from ${focusedPlayer.name}`}
                  accessibilityRole="button"
                  onPress={() => handleStartTracking('interaction')}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? '#1f2937' : '#111827',
                    borderColor: '#334155',
                    borderRadius: 999,
                    borderWidth: 1,
                    flex: 1,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    paddingVertical: 14,
                  })}
                >
                  <Plus color="#f8fafc" size={17} strokeWidth={2.7} />
                  <Text style={{ color: '#f8fafc', fontWeight: '900' }}>Interaction</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Track nomination from ${focusedPlayer.name}`}
                  accessibilityRole="button"
                  onPress={() => handleStartTracking('nomination')}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? '#1f2937' : '#111827',
                    borderColor: '#334155',
                    borderRadius: 999,
                    borderWidth: 1,
                    flex: 1,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    paddingVertical: 14,
                  })}
                >
                  <Plus color="#f8fafc" size={17} strokeWidth={2.7} />
                  <Text style={{ color: '#f8fafc', fontWeight: '900' }}>Nomination</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  accessibilityLabel="Rotate tokens left"
                  accessibilityRole="button"
                  onPress={() => handleRotateTokens(-rotationStepRadians)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? '#1f2937' : '#111827',
                    borderColor: '#334155',
                    borderRadius: 999,
                    borderWidth: 1,
                    flex: 1,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    paddingVertical: 14,
                  })}
                >
                  <RotateCcw color="#f8fafc" size={17} strokeWidth={2.7} />
                  <Text style={{ color: '#f8fafc', fontWeight: '900' }}>Left</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Rotate tokens right"
                  accessibilityRole="button"
                  onPress={() => handleRotateTokens(rotationStepRadians)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? '#1f2937' : '#111827',
                    borderColor: '#334155',
                    borderRadius: 999,
                    borderWidth: 1,
                    flex: 1,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    paddingVertical: 14,
                  })}
                >
                  <RotateCw color="#f8fafc" size={17} strokeWidth={2.7} />
                  <Text style={{ color: '#f8fafc', fontWeight: '900' }}>Right</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : activeTab === 'table' ? (
          <ConversationTable
            activeDay={activeGame.activeDay}
            conversations={activeGame.conversations}
            players={activeGame.players}
          />
        ) : activeTab === 'nominations' ? (
          <NominationList
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
    </>
  );
}
