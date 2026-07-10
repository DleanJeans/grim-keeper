import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FlameKindling,
  HeartPulse,
  List,
  Map as MapIcon,
  MessageCircle,
  MessagesSquare,
  Minus,
  MoveDiagonal,
  Plus,
  RotateCcw,
  RotateCw,
  Skull,
  Table2,
  Trash2,
  UserPlus,
  Vote,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';

import { AddPlayerModal } from '@/components/add-player-modal';
import { ConversationTable } from '@/components/conversation-table';
import { DeathLog } from '@/components/death-log';
import { FocusedPlayerDeathActions } from '@/components/focused-player-death-actions';
import { GameMap } from '@/components/game-map';
import { InteractionList } from '@/components/interaction-list';
import { MapModeButton } from '@/components/map-mode-button';
import { NomIcon } from '@/components/nom-icon';
import { NominationList } from '@/components/nomination-list';
import { Text } from '@/components/text';
import { getGameById, useGameStore } from '@/store/game-store';
import { getLastDayWithData } from '@/utils/game-utils';
import {
  getTokenSize,
  maxTokenSize,
  minTokenSize,
  rotatePlayerMapPositions,
  tokenSizeStep,
} from '@/utils/layout-utils';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';

type GameTab = 'map' | 'interactions' | 'nominations';
type InteractionSubtab = 'list' | 'table';
type TrackingMode = 'interaction' | 'nomination';

const gameTabs: { flex: number; label: string; value: GameTab }[] = [
  { flex: 0.85, label: 'Map', value: 'map' },
  { flex: 1.3, label: 'Interactions', value: 'interactions' },
  { flex: 0.85, label: 'Noms', value: 'nominations' },
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
      return <MessagesSquare color={color} size={15} strokeWidth={2.5} />;
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
  const setPlayerRevive = useGameStore((state) => state.setPlayerRevive);
  const setPlayerDayNote = useGameStore((state) => state.setPlayerDayNote);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const updatePlayerPositions = useGameStore((state) => state.updatePlayerPositions);
  const addConversation = useGameStore((state) => state.addConversation);
  const updateNominationVotes = useGameStore((state) => state.updateNominationVotes);
  const deleteConversation = useGameStore((state) => state.deleteConversation);
  const setActiveDay = useGameStore((state) => state.setActiveDay);
  const setTokenSize = useGameStore((state) => state.setTokenSize);
  const [activeTab, setActiveTab] = useState<GameTab>('map');
  const [interactionSubtab, setInteractionSubtab] = useState<InteractionSubtab>('list');
  const [addPlayerVisible, setAddPlayerVisible] = useState(false);
  const [trackingMode, setTrackingMode] = useState<TrackingMode | null>(null);
  const [votingNominationId, setVotingNominationId] = useState<string | null>(null);
  const [votingReturnTab, setVotingReturnTab] = useState<GameTab | null>(null);
  const [focusedPlayerId, setFocusedPlayerId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteEditorVisible, setNoteEditorVisible] = useState(false);
  const [isRotatingMode, setIsRotatingMode] = useState(false);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const game = getGameById(games, id);
  const mapWidth = Math.max(1, width - 40);
  const mapHeight = Math.max(mapWidth, Math.floor(height * 0.52));

  useEffect(() => {
    if (!focusedPlayerId) {
      setNoteEditorVisible(false);
      setNoteDraft('');
    }
  }, [focusedPlayerId]);

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
  const focusedPlayerIsDead = focusedPlayer
    ? isPlayerCurrentlyDead(focusedPlayer, activeGame.activeDay)
    : false;
  const focusedPlayerNote =
    focusedPlayerId === null
      ? undefined
      : activeGame.playerDayNotes?.find(
          (note) => note.playerId === focusedPlayerId && note.day === activeGame.activeDay,
        );
  const highlightedPlayerIds = trackingMode
    ? selectedPlayerIds
    : votingNominationId
      ? selectedPlayerIds
      : focusedPlayerId
        ? [focusedPlayerId]
        : [];
  const hideConnectionCurves = trackingMode === 'nomination' || !!votingNominationId;
  const trackingConfirmLabel = trackingMode === 'nomination' ? 'Confirm Nomination' : 'Confirm';
  const trackingCancelFlex = trackingMode === 'nomination' ? 0.82 : 1;
  const trackingConfirmFlex = trackingMode === 'nomination' ? 1.18 : 1;
  const activeTokenSize = getTokenSize(activeGame.tokenSize);
  const activeDayNominations = activeGame.conversations.filter(
    (conversation) =>
      conversation.day === activeGame.activeDay && conversation.kind === 'nomination',
  );
  const nominatedPlayerIds = new Set(
    activeDayNominations.flatMap((nomination) =>
      nomination.participantIds.filter((playerId) => playerId !== nomination.initiatorId),
    ),
  );
  const focusedPlayerAlreadyNominatedToday = activeDayNominations.some(
    (nomination) => nomination.initiatorId === focusedPlayerId,
  );
  const nominationDisabled = focusedPlayerIsDead || focusedPlayerAlreadyNominatedToday;
  const disabledPlayerIds =
    trackingMode === 'nomination'
      ? [...nominatedPlayerIds].filter((playerId) => playerId !== selectedPlayerIds[0])
      : [];
  const deadPlayerCount = activeGame.players.filter((player) =>
    isPlayerCurrentlyDead(player, activeGame.activeDay),
  ).length;
  const alivePlayerCount = activeGame.players.length - deadPlayerCount;
  const lastDayWithData = getLastDayWithData(activeGame);

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
      setIsRearrangeMode(false);
      setNoteEditorVisible(false);
      setFocusedPlayerId((currentPlayerId) => (currentPlayerId === playerId ? null : playerId));
      return;
    }

    if (trackingMode === 'nomination') {
      if (nominatedPlayerIds.has(playerId) && playerId !== selectedPlayerIds[0]) {
        return;
      }

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

    if (mode === 'nomination' && nominationDisabled) {
      return;
    }

    setTrackingMode(mode);
    setIsRotatingMode(false);
    setIsRearrangeMode(false);
    setSelectedPlayerIds([focusedPlayerId]);
  }

  function handleCancelTracking() {
    setIsRotatingMode(false);
    setIsRearrangeMode(false);
    setTrackingMode(null);
    setVotingNominationId(null);
    setVotingReturnTab(null);
    setFocusedPlayerId(null);
    setNoteEditorVisible(false);
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
    setIsRearrangeMode(false);
    setActiveDay(activeGame.id, day);
  }

  function handleRotateTokens(angleRadians: number) {
    updatePlayerPositions(
      activeGame.id,
      rotatePlayerMapPositions(
        activeGame.players,
        mapWidth,
        mapHeight,
        angleRadians,
        activeTokenSize,
      ),
    );
  }

  function handleResizeTokens(sizeDelta: number) {
    setTokenSize(activeGame.id, activeTokenSize + sizeDelta);
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

  function handleReviveFocusedPlayer() {
    if (!focusedPlayer?.death) {
      return;
    }

    setPlayerRevive(activeGame.id, focusedPlayer.id, {
      day: activeGame.activeDay,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleUndoFocusedPlayerDeath() {
    if (!focusedPlayer?.death) {
      return;
    }

    setPlayerDeath(activeGame.id, focusedPlayer.id, null);
  }

  function handleShowFocusedPlayerNote() {
    setNoteDraft(focusedPlayerNote?.text ?? '');
    setNoteEditorVisible(true);
  }

  function handleSaveFocusedPlayerNote() {
    if (!focusedPlayer) {
      return;
    }

    setPlayerDayNote(activeGame.id, focusedPlayer.id, activeGame.activeDay, noteDraft);
    setNoteEditorVisible(false);
  }

  function confirmDeletePlayer() {
    if (!focusedPlayer || focusedPlayer.isAppUser) {
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
          title: `Day ${activeGame.activeDay}/${lastDayWithData}`,
          headerLeft: () => (
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: 3 }}>
                <HeartPulse color="#86efac" size={16} strokeWidth={2.7} />
                <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '900' }}>
                  {alivePlayerCount}
                </Text>
              </View>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: 3 }}>
                <Skull color="#fca5a5" size={16} strokeWidth={2.7} />
                <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '900' }}>
                  {deadPlayerCount}
                </Text>
              </View>
            </View>
          ),
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
                Day {activeGame.activeDay}/{lastDayWithData}
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
          style={{ backgroundColor: '#111827', borderRadius: 8, flexDirection: 'row', padding: 4 }}
        >
          {gameTabs.map((tab) => (
            <Pressable
              key={tab.value}
              accessibilityRole="button"
              onPress={() => {
                setIsRotatingMode(false);
                setIsRearrangeMode(false);
                setActiveTab(tab.value);
              }}
              style={{
                alignItems: 'center',
                backgroundColor: activeTab === tab.value ? '#f8fafc' : 'transparent',
                borderRadius: 6,
                flex: tab.flex,
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
              disabledPlayerIds={disabledPlayerIds}
              hideConnectionCurves={hideConnectionCurves}
              interactionMode={!!trackingMode || !!votingNominationId}
              mapHeight={mapHeight}
              mapWidth={mapWidth}
              nominationCurvePlayerIds={trackingMode === 'nomination' ? selectedPlayerIds : []}
              players={activeGame.players}
              rearrangeMode={isRearrangeMode}
              tokenSize={activeTokenSize}
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
                    flex: 0.75,
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
                    flex: 1.25,
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
                    Confirm {selectedPlayerIds.length} Votes
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
                        focusedPlayerIsDead && focusedPlayer.death?.kind === 'execution'
                          ? '#fca5a5'
                          : '#334155',
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
                    <FlameKindling color="#fca5a5" size={17} strokeWidth={2.7} />
                    <Text style={{ color: '#f8fafc', fontWeight: '900' }}>
                      Execute
                      {focusedPlayerIsDead && focusedPlayer.death?.kind === 'execution' ? 'd' : ''}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Mark ${focusedPlayer.name} dead at night`}
                    accessibilityRole="button"
                    onPress={() => handleSetFocusedPlayerDeath('night')}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: pressed ? '#1f2937' : '#111827',
                      borderColor:
                        focusedPlayerIsDead && focusedPlayer.death?.kind === 'night'
                          ? '#93c5fd'
                          : '#334155',
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
                    <Skull color="#93c5fd" size={17} strokeWidth={2.7} />
                    <Text style={{ color: '#f8fafc', fontWeight: '900' }}>
                      {focusedPlayerIsDead && focusedPlayer.death?.kind === 'night'
                        ? 'Killed'
                        : 'Night'}
                    </Text>
                  </Pressable>
                </View>

                <FocusedPlayerDeathActions
                  canRevive={focusedPlayerIsDead}
                  canUndo={focusedPlayerIsDead}
                  isAlive={!focusedPlayerIsDead}
                  onRevive={handleReviveFocusedPlayer}
                  onUndo={handleUndoFocusedPlayerDeath}
                  playerName={focusedPlayer.name}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    accessibilityLabel={`Delete ${focusedPlayer.name}`}
                    accessibilityRole="button"
                    disabled={focusedPlayer.isAppUser}
                    onPress={confirmDeletePlayer}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: focusedPlayer.isAppUser
                        ? '#1f2937'
                        : pressed
                          ? '#2a1517'
                          : '#111827',
                      borderColor: focusedPlayer.isAppUser ? '#334155' : '#fca5a5',
                      borderRadius: 8,
                      borderWidth: 1,
                      justifyContent: 'center',
                      minWidth: 48,
                      opacity: focusedPlayer.isAppUser ? 0.48 : 1,
                      paddingVertical: 14,
                    })}
                  >
                    <Trash2
                      color={focusedPlayer.isAppUser ? '#94a3b8' : '#fca5a5'}
                      size={17}
                      strokeWidth={2.7}
                    />
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
                    disabled={nominationDisabled}
                    onPress={() => handleStartTracking('nomination')}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: pressed ? '#1f2937' : '#111827',
                      borderColor: nominationDisabled ? '#1f2937' : '#334155',
                      borderRadius: 8,
                      borderWidth: 1,
                      flex: 1,
                      flexBasis: 0,
                      flexDirection: 'row',
                      gap: 6,
                      justifyContent: 'center',
                      minWidth: 0,
                      opacity: nominationDisabled ? 0.48 : 1,
                      paddingVertical: 14,
                    })}
                  >
                    <NomIcon
                      color={nominationDisabled ? '#94a3b8' : '#f8fafc'}
                      size={17}
                      strokeWidth={2.7}
                    />
                    <Text
                      style={{
                        color: nominationDisabled ? '#94a3b8' : '#f8fafc',
                        fontWeight: '900',
                      }}
                    >
                      {`Nominate${nominationDisabled ? 'd' : ''}`}
                    </Text>
                  </Pressable>
                </View>

                <View style={{ gap: 10 }}>
                  <Pressable
                    accessibilityLabel={`Add day ${activeGame.activeDay} note for ${focusedPlayer.name}`}
                    accessibilityRole="button"
                    onPress={handleShowFocusedPlayerNote}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      backgroundColor: pressed ? '#1f2937' : '#111827',
                      borderColor: focusedPlayerNote ? '#38bdf8' : '#334155',
                      borderRadius: 8,
                      borderWidth: 1,
                      flexDirection: 'row',
                      gap: 6,
                      justifyContent: 'center',
                      paddingVertical: 14,
                    })}
                  >
                    <MessageCircle color="#38bdf8" size={17} strokeWidth={2.7} />
                    <Text style={{ color: '#f8fafc', fontWeight: '900' }}>
                      {focusedPlayerNote ? 'Edit Note' : 'Note'}
                    </Text>
                  </Pressable>

                  {noteEditorVisible ? (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TextInput
                        accessibilityLabel={`Day ${activeGame.activeDay} note for ${focusedPlayer.name}`}
                        multiline
                        onChangeText={setNoteDraft}
                        placeholder={`What did ${focusedPlayer.name} say?`}
                        placeholderTextColor="#64748b"
                        style={{
                          backgroundColor: '#111827',
                          borderColor: '#334155',
                          borderRadius: 8,
                          borderWidth: 1,
                          color: '#f8fafc',
                          flex: 1,
                          fontSize: 15,
                          minHeight: 48,
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          textAlignVertical: 'top',
                        }}
                        value={noteDraft}
                      />
                      <Pressable
                        accessibilityLabel={`Save day ${activeGame.activeDay} note for ${focusedPlayer.name}`}
                        accessibilityRole="button"
                        onPress={handleSaveFocusedPlayerNote}
                        style={({ pressed }) => ({
                          alignItems: 'center',
                          backgroundColor: pressed ? '#15803d' : '#16a34a',
                          borderRadius: 8,
                          justifyContent: 'center',
                          minWidth: 48,
                          width: 48,
                        })}
                      >
                        <Check color="#f8fafc" size={18} strokeWidth={2.8} />
                      </Pressable>
                    </View>
                  ) : focusedPlayerNote ? (
                    <Text
                      selectable
                      style={{
                        color: '#cbd5e1',
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      {focusedPlayerNote.text}
                    </Text>
                  ) : null}
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
                <MapModeButton
                  accessibilityLabel="Done rotating tokens"
                  onPress={() => setIsRotatingMode(false)}
                  variant="confirm"
                />
              </View>
            ) : isRearrangeMode ? (
              <View
                key="rearrange-actions"
                style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10 }}
              >
                <Pressable
                  accessibilityLabel="Shrink player tokens"
                  accessibilityRole="button"
                  disabled={activeTokenSize <= minTokenSize}
                  onPress={() => handleResizeTokens(-tokenSizeStep)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? '#1f2937' : '#111827',
                    borderColor: activeTokenSize <= minTokenSize ? '#1f2937' : '#334155',
                    borderRadius: 8,
                    borderWidth: 1,
                    flex: 1,
                    flexBasis: 0,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    minWidth: 0,
                    opacity: activeTokenSize <= minTokenSize ? 0.48 : 1,
                    paddingVertical: 14,
                  })}
                >
                  <Minus color="#f8fafc" size={17} strokeWidth={2.7} />
                </Pressable>
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#111827',
                    borderColor: '#334155',
                    borderRadius: 8,
                    borderWidth: 1,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 14,
                    width: 58,
                  }}
                >
                  <Text style={{ color: '#f8fafc', fontWeight: '900' }}>{activeTokenSize}</Text>
                </View>
                <Pressable
                  accessibilityLabel="Enlarge player tokens"
                  accessibilityRole="button"
                  disabled={activeTokenSize >= maxTokenSize}
                  onPress={() => handleResizeTokens(tokenSizeStep)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? '#1f2937' : '#111827',
                    borderColor: activeTokenSize >= maxTokenSize ? '#1f2937' : '#334155',
                    borderRadius: 8,
                    borderWidth: 1,
                    flex: 1,
                    flexBasis: 0,
                    flexDirection: 'row',
                    gap: 6,
                    justifyContent: 'center',
                    minWidth: 0,
                    opacity: activeTokenSize >= maxTokenSize ? 0.48 : 1,
                    paddingVertical: 14,
                  })}
                >
                  <Plus color="#f8fafc" size={17} strokeWidth={2.7} />
                </Pressable>
                <MapModeButton
                  accessibilityLabel="Done rearranging tokens"
                  onPress={() => setIsRearrangeMode(false)}
                  variant="confirm"
                />
              </View>
            ) : (
              <View
                key="map-mode-actions"
                style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10 }}
              >
                <MapModeButton
                  accessibilityLabel="Enter rearrange mode"
                  icon={MoveDiagonal}
                  label="Rearrange"
                  onPress={() => {
                    setIsRotatingMode(false);
                    setIsRearrangeMode(true);
                  }}
                />
                <MapModeButton
                  accessibilityLabel="Enter rotating mode"
                  icon={RotateCw}
                  label="Rotate"
                  onPress={() => {
                    setIsRearrangeMode(false);
                    setIsRotatingMode(true);
                  }}
                />
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

        <DeathLog activeDay={activeGame.activeDay} players={activeGame.players} />
      </ScrollView>
    </>
  );
}
