import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  List,
  Map as MapIcon,
  MessageCircle,
  Moon,
  Pointer,
  RotateCcw,
  RotateCw,
  Skull,
  Table2,
  Trash2,
  Undo2,
  UserPlus,
  Vote,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { AddPlayerModal } from '@/components/add-player-modal';
import { ConversationTable } from '@/components/conversation-table';
import { GameMap } from '@/components/game-map';
import { InteractionList } from '@/components/interaction-list';
import { NominationList } from '@/components/nomination-list';
import { Text } from '@/components/text';
import { getGameById, useGameStore } from '@/store/game-store';
import { rotatePlayerMapPositions } from '@/utils/layout-utils';

type GameTab = 'map' | 'interactions' | 'nominations';
type InteractionSubtab = 'list' | 'table';
type TrackingMode = 'interaction' | 'nomination';

const gameTabs: { label: string; value: GameTab }[] = [
  { label: 'Map', value: 'map' },
  { label: 'Interactions', value: 'interactions' },
  { label: 'Noms', value: 'nominations' },
];
const interactionSubtabs: { label: string; value: InteractionSubtab }[] = [
  { label: 'List', value: 'list' },
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
  }
}

function renderInteractionSubtabIcon(tab: InteractionSubtab, color: string) {
  switch (tab) {
    case 'list':
      return <List color={color} size={15} strokeWidth={2.5} />;
    case 'table':
      return <Table2 color={color} size={15} strokeWidth={2.5} />;
  }
}

export default function GameRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { height, width } = useWindowDimensions();
  const games = useGameStore((state) => state.games);
  const addPlayer = useGameStore((state) => state.addPlayer);
  const deletePlayer = useGameStore((state) => state.deletePlayer);
  const setPlayerDeath = useGameStore((state) => state.setPlayerDeath);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const updatePlayerPositions = useGameStore((state) => state.updatePlayerPositions);
  const addConversation = useGameStore((state) => state.addConversation);
  const updateNominationVotes = useGameStore((state) => state.updateNominationVotes);
  const deleteConversation = useGameStore((state) => state.deleteConversation);
  const setActiveDay = useGameStore((state) => state.setActiveDay);
  const [activeTab, setActiveTab] = useState<GameTab>('map');
  const [interactionSubtab, setInteractionSubtab] = useState<InteractionSubtab>('list');
  const [addPlayerVisible, setAddPlayerVisible] = useState(false);
  const [trackingMode, setTrackingMode] = useState<TrackingMode | null>(null);
  const [votingNominationId, setVotingNominationId] = useState<string | null>(null);
  const [votingReturnTab, setVotingReturnTab] = useState<GameTab | null>(null);
  const [focusedPlayerId, setFocusedPlayerId] = useState<string | null>(null);
  const [isRotatingMode, setIsRotatingMode] = useState(false);
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
  const trackingCancelFlex = trackingMode === 'nomination' ? 0.82 : 1;
  const trackingConfirmFlex = trackingMode === 'nomination' ? 1.18 : 1;
  const deadPlayerCount = activeGame.players.filter((player) => player.death).length;
  const totalPlayerCount = activeGame.players.length;
  const alivePlayerCount = totalPlayerCount - deadPlayerCount;

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
      setIsRotatingMode(false);
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
    setIsRotatingMode(false);
    setSelectedPlayerIds([focusedPlayerId]);
  }

  function handleCancelTracking() {
    setIsRotatingMode(false);
    setTrackingMode(null);
    setVotingNominationId(null);
    setVotingReturnTab(null);
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
      setVotingReturnTab(null);
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

    const returnTab = votingReturnTab;
    updateNominationVotes(activeGame.id, votingNominationId, selectedPlayerIds);
    handleCancelTracking();

    if (returnTab) {
      setActiveTab(returnTab);
    }
  }

  function handleCancelVoting() {
    const returnTab = votingReturnTab;
    handleCancelTracking();

    if (returnTab) {
      setActiveTab(returnTab);
    }
  }

  function handleEditNominationVotes(nominationId: string, voterIds: string[]) {
    handleCancelTracking();
    setVotingNominationId(nominationId);
    setVotingReturnTab('nominations');
    setSelectedPlayerIds(voterIds);
    setActiveTab('map');
  }

  function handleChangeDay(day: number) {
    handleCancelTracking();
    setIsRotatingMode(false);
    setActiveDay(activeGame.id, day);
  }

  function handleRotateTokens(angleRadians: number) {
    updatePlayerPositions(
      activeGame.id,
      rotatePlayerMapPositions(activeGame.players, mapWidth, mapHeight, angleRadians),
    );
  }

  function handleSetFocusedPlayerDeath(kind: 'execution' | 'night') {
    if (!focusedPlayer) {
      return;
    }

    setPlayerDeath(activeGame.id, focusedPlayer.id, {
      day: activeGame.activeDay,
      kind,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleUndoFocusedPlayerDeath() {
    if (!focusedPlayer?.death) {
      return;
    }

    setPlayerDeath(activeGame.id, focusedPlayer.id, null);
  }

  function confirmDeletePlayer() {
    if (!focusedPlayer) {
      return;
    }

    Alert.alert(
      'Delete player?',
      `Delete ${focusedPlayer.name} and remove their related interactions, nominations, and votes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePlayer(activeGame.id, focusedPlayer.id);
            handleCancelTracking();
          },
        },
      ],
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          title: `Day ${activeGame.activeDay}`,
          headerTitle: () => (
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
              <Pressable
                accessibilityLabel="Previous day"
                accessibilityRole="button"
                disabled={activeGame.activeDay === 1}
                onPress={() => handleChangeDay(activeGame.activeDay - 1)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: activeGame.activeDay === 1 ? '#1f2937' : '#334155',
                  borderRadius: 8,
                  height: 32,
                  justifyContent: 'center',
                  opacity: pressed ? 0.75 : 1,
                  width: 34,
                })}
              >
                <ChevronLeft
                  color={activeGame.activeDay === 1 ? '#64748b' : '#f8fafc'}
                  size={15}
                  strokeWidth={2.7}
                />
              </Pressable>
              <Text
                selectable
                style={{
                  color: '#f8fafc',
                  fontSize: 15,
                  fontWeight: '900',
                  minWidth: 54,
                  textAlign: 'center',
                }}
              >
                Day {activeGame.activeDay}
              </Text>
              <Pressable
                accessibilityLabel="Next day"
                accessibilityRole="button"
                onPress={() => handleChangeDay(activeGame.activeDay + 1)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: pressed ? '#475569' : '#334155',
                  borderRadius: 8,
                  height: 32,
                  justifyContent: 'center',
                  width: 34,
                })}
              >
                <ChevronRight color="#f8fafc" size={15} strokeWidth={2.7} />
              </Pressable>
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <Pressable
                accessibilityLabel="Add missing player"
                accessibilityRole="button"
                onPress={() => setAddPlayerVisible(true)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: pressed ? '#1f2937' : '#111827',
                  borderColor: '#334155',
                  borderRadius: 8,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                })}
              >
                <UserPlus color="#f8fafc" size={15} strokeWidth={2.5} />
                <Text style={{ color: '#f8fafc', fontSize: 13, fontWeight: '900' }}>Player</Text>
              </Pressable>
            </View>
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
        <View
          style={{
            backgroundColor: '#111827',
            borderColor: '#334155',
            borderRadius: 8,
            borderWidth: 1,
            flexDirection: 'row',
            gap: 8,
            padding: 4,
          }}
        >
          {[
            { label: 'Alive', value: alivePlayerCount },
            { label: 'Dead', value: deadPlayerCount },
            { label: 'Total', value: totalPlayerCount },
          ].map((stat) => (
            <View
              key={stat.label}
              style={{
                alignItems: 'center',
                backgroundColor: '#0f172a',
                borderRadius: 6,
                flex: 1,
                gap: 3,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800' }}>
                {stat.label}
              </Text>
              <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: '900' }}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{ backgroundColor: '#111827', borderRadius: 8, flexDirection: 'row', padding: 4 }}
        >
          {gameTabs.map((tab) => (
            <Pressable
              key={tab.value}
              accessibilityRole="button"
              onPress={() => {
                setIsRotatingMode(false);
                setActiveTab(tab.value);
              }}
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
              <View
                key="vote-actions"
                style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 12 }}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={handleCancelVoting}
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#334155',
                    borderRadius: 8,
                    flex: 1,
                    flexBasis: 0,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    minWidth: 0,
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
                    flexBasis: 0,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    minWidth: 0,
                    paddingVertical: 14,
                  }}
                >
                  <Check color="#f8fafc" size={17} strokeWidth={2.7} />
                  <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                    numberOfLines={1}
                    style={{
                      color: '#f8fafc',
                      flexShrink: 1,
                      fontWeight: '800',
                      minWidth: 0,
                    }}
                  >
                    Confirm Votes
                  </Text>
                </Pressable>
              </View>
            ) : trackingMode ? (
              <View
                key="tracking-actions"
                style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 12 }}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={handleCancelTracking}
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#334155',
                    borderRadius: 8,
                    flex: trackingCancelFlex,
                    flexBasis: 0,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    minWidth: 0,
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
                    flex: trackingConfirmFlex,
                    flexBasis: 0,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    minWidth: 0,
                    paddingVertical: 14,
                  }}
                >
                  <Check
                    color={selectedPlayerIds.length < 2 ? '#94a3b8' : '#f8fafc'}
                    size={17}
                    strokeWidth={2.7}
                  />
                  <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                    numberOfLines={1}
                    style={{
                      color: selectedPlayerIds.length < 2 ? '#94a3b8' : '#f8fafc',
                      flexShrink: 1,
                      fontWeight: '800',
                      minWidth: 0,
                    }}
                  >
                    {trackingConfirmLabel}
                  </Text>
                </Pressable>
              </View>
            ) : focusedPlayer ? (
              <View key="focused-player-actions" style={{ alignSelf: 'stretch', gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    accessibilityLabel={`Mark ${focusedPlayer.name} dead by execution`}
                    accessibilityRole="button"
                    onPress={() => handleSetFocusedPlayerDeath('execution')}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: pressed ? '#1f2937' : '#111827',
                      borderColor:
                        focusedPlayer.death?.kind === 'execution' ? '#fca5a5' : '#334155',
                      borderRadius: 8,
                      borderWidth: 1,
                      flex: 1,
                      flexBasis: 0,
                      flexDirection: 'row',
                      gap: 6,
                      justifyContent: 'center',
                      minWidth: 0,
                      paddingVertical: 14,
                    })}
                  >
                    <Skull color="#fca5a5" size={17} strokeWidth={2.7} />
                    <Text style={{ color: '#f8fafc', fontWeight: '900' }}>Execution</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Mark ${focusedPlayer.name} dead at night`}
                    accessibilityRole="button"
                    onPress={() => handleSetFocusedPlayerDeath('night')}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: pressed ? '#1f2937' : '#111827',
                      borderColor: focusedPlayer.death?.kind === 'night' ? '#93c5fd' : '#334155',
                      borderRadius: 8,
                      borderWidth: 1,
                      flex: 1,
                      flexBasis: 0,
                      flexDirection: 'row',
                      gap: 6,
                      justifyContent: 'center',
                      minWidth: 0,
                      paddingVertical: 14,
                    })}
                  >
                    <Moon color="#93c5fd" size={17} strokeWidth={2.7} />
                    <Text style={{ color: '#f8fafc', fontWeight: '900' }}>Night</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Undo death for ${focusedPlayer.name}`}
                    accessibilityRole="button"
                    disabled={!focusedPlayer.death}
                    onPress={handleUndoFocusedPlayerDeath}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: pressed ? '#1f2937' : '#111827',
                      borderColor: focusedPlayer.death ? '#334155' : '#1f2937',
                      borderRadius: 8,
                      borderWidth: 1,
                      flex: 0.72,
                      flexBasis: 0,
                      flexDirection: 'row',
                      gap: 6,
                      justifyContent: 'center',
                      minWidth: 0,
                      opacity: focusedPlayer.death ? 1 : 0.48,
                      paddingVertical: 14,
                    })}
                  >
                    <Undo2 color="#f8fafc" size={17} strokeWidth={2.7} />
                    <Text style={{ color: '#f8fafc', fontWeight: '900' }}>Undo</Text>
                  </Pressable>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    accessibilityLabel={`Delete ${focusedPlayer.name}`}
                    accessibilityRole="button"
                    onPress={confirmDeletePlayer}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: pressed ? '#2a1517' : '#111827',
                      borderColor: '#fca5a5',
                      borderRadius: 8,
                      borderWidth: 1,
                      justifyContent: 'center',
                      minWidth: 48,
                      paddingVertical: 14,
                    })}
                  >
                    <Trash2 color="#fca5a5" size={17} strokeWidth={2.7} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Track interaction from ${focusedPlayer.name}`}
                    accessibilityRole="button"
                    onPress={() => handleStartTracking('interaction')}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: pressed ? '#1f2937' : '#111827',
                      borderColor: '#334155',
                      borderRadius: 8,
                      borderWidth: 1,
                      flex: 1,
                      flexBasis: 0,
                      flexDirection: 'row',
                      gap: 6,
                      justifyContent: 'center',
                      minWidth: 0,
                      paddingVertical: 14,
                    })}
                  >
                    <MessageCircle color="#f8fafc" size={17} strokeWidth={2.7} />
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
                      borderRadius: 8,
                      borderWidth: 1,
                      flex: 1,
                      flexBasis: 0,
                      flexDirection: 'row',
                      gap: 6,
                      justifyContent: 'center',
                      minWidth: 0,
                      paddingVertical: 14,
                    })}
                  >
                    <Pointer color="#f8fafc" size={17} strokeWidth={2.7} />
                    <Text style={{ color: '#f8fafc', fontWeight: '900' }}>Nomination</Text>
                  </Pressable>
                </View>
              </View>
            ) : isRotatingMode ? (
              <View
                key="rotate-actions"
                style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10 }}
              >
                <Pressable
                  accessibilityLabel="Rotate tokens left"
                  accessibilityRole="button"
                  onPress={() => handleRotateTokens(-rotationStepRadians)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? '#1f2937' : '#111827',
                    borderColor: '#334155',
                    borderRadius: 8,
                    borderWidth: 1,
                    flex: 1,
                    flexBasis: 0,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    minWidth: 0,
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
                    borderRadius: 8,
                    borderWidth: 1,
                    flex: 1,
                    flexBasis: 0,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    minWidth: 0,
                    paddingVertical: 14,
                  })}
                >
                  <RotateCw color="#f8fafc" size={17} strokeWidth={2.7} />
                  <Text style={{ color: '#f8fafc', fontWeight: '900' }}>Right</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Done rotating tokens"
                  accessibilityRole="button"
                  onPress={() => setIsRotatingMode(false)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? '#dbeafe' : '#f8fafc',
                    borderColor: '#f8fafc',
                    borderRadius: 8,
                    borderWidth: 1,
                    justifyContent: 'center',
                    minWidth: 48,
                    paddingVertical: 14,
                    width: 48,
                  })}
                >
                  <Check color="#0b1120" size={17} strokeWidth={2.8} />
                </Pressable>
              </View>
            ) : (
              <View
                key="rotate-toggle-action"
                style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10 }}
              >
                <Pressable
                  accessibilityLabel="Enter rotating mode"
                  accessibilityRole="button"
                  onPress={() => setIsRotatingMode(true)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? '#1f2937' : '#111827',
                    borderColor: '#334155',
                    borderRadius: 8,
                    borderWidth: 1,
                    flex: 1,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    paddingVertical: 14,
                  })}
                >
                  <RotateCw color="#f8fafc" size={17} strokeWidth={2.7} />
                  <Text style={{ color: '#f8fafc', fontWeight: '900' }}>Rotate</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : activeTab === 'nominations' ? (
          <NominationList
            activeDay={activeGame.activeDay}
            conversations={activeGame.conversations}
            players={activeGame.players}
            onDeleteNomination={(nominationId) => deleteConversation(activeGame.id, nominationId)}
            onEditVotes={handleEditNominationVotes}
          />
        ) : (
          <View style={{ gap: 12 }}>
            <View
              style={{
                backgroundColor: '#111827',
                borderRadius: 8,
                flexDirection: 'row',
                padding: 4,
              }}
            >
              {interactionSubtabs.map((tab) => (
                <Pressable
                  key={tab.value}
                  accessibilityRole="button"
                  onPress={() => setInteractionSubtab(tab.value)}
                  style={{
                    alignItems: 'center',
                    backgroundColor: interactionSubtab === tab.value ? '#f8fafc' : 'transparent',
                    borderRadius: 6,
                    flex: 1,
                    flexDirection: 'row',
                    gap: 5,
                    justifyContent: 'center',
                    paddingVertical: 10,
                  }}
                >
                  {renderInteractionSubtabIcon(
                    tab.value,
                    interactionSubtab === tab.value ? '#0b1120' : '#94a3b8',
                  )}
                  <Text
                    style={{
                      color: interactionSubtab === tab.value ? '#0b1120' : '#94a3b8',
                      fontSize: 13,
                      fontWeight: '800',
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {interactionSubtab === 'table' ? (
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
          </View>
        )}
      </ScrollView>
    </>
  );
}
