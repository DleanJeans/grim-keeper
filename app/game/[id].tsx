import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, useWindowDimensions, View } from 'react-native';
import { AddPlayerModal } from '@/components/game/add-player-modal';
import { DeathLog } from '@/components/game/death-log';
import { FocusedPlayerActions } from '@/components/game/focused-player-actions';
import { GameMap } from '@/components/game/game-map';
import { GameTabs } from '@/components/game/game-tabs';
import { HeaderLeft } from '@/components/game/header-left';
import { HeaderRight } from '@/components/game/header-right';
import { HeaderTitle } from '@/components/game/header-title';
import { InteractionsTab } from '@/components/game/interactions-tab';
import { MapModeActions } from '@/components/game/map-mode-actions';
import { NominationList } from '@/components/game/nomination-list';
import { RearrangeActions } from '@/components/game/rearrange-actions';
import { RotateActions } from '@/components/game/rotate-actions';
import { TrackingConfirmActions } from '@/components/game/tracking-confirm-actions';
import { VoteConfirmActions } from '@/components/game/vote-confirm-actions';
import {
  type GameRouteContextValue,
  GameRouteProvider,
  type GameTab,
  type TrackingMode,
} from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { getGameById, useGameStore } from '@/store/game-store';
import type { PlayerPosition } from '@/types/game';
import { getLastDayWithData } from '@/utils/game-utils';
import { getTokenSize, rotatePlayerMapPositions } from '@/utils/layout-utils';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';

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
  const [activeTab, setActiveTab] = useState<GameTab>('interactions');
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

  function exitMapModes() {
    setIsRotatingMode(false);
    setIsRearrangeMode(false);
  }

  function exitRotateMode() {
    setIsRotatingMode(false);
  }

  function exitRearrangeMode() {
    setIsRearrangeMode(false);
  }

  function enterRotateMode() {
    setIsRearrangeMode(false);
    setIsRotatingMode(true);
  }

  function enterRearrangeMode() {
    setIsRotatingMode(false);
    setIsRearrangeMode(true);
  }

  function handleAddPlayer(name: string) {
    addPlayer(activeGame.id, name);
  }

  function handleDeleteConversation(conversationId: string) {
    deleteConversation(activeGame.id, conversationId);
  }

  function handleDeleteNomination(nominationId: string) {
    deleteConversation(activeGame.id, nominationId);
  }

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
    setActiveTab('nominations');
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

  function handleMovePlayer(playerId: string, position: PlayerPosition) {
    updatePlayerPosition(activeGame.id, playerId, position);
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

  const contextValue: GameRouteContextValue = {
    game: activeGame,
    players: activeGame.players,
    conversations: activeGame.conversations,
    activeDay: activeGame.activeDay,
    lastDayWithData,
    activeTokenSize,
    alivePlayerCount,
    deadPlayerCount,
    disabledPlayerIds,
    nominatedPlayerIds,
    hideConnectionCurves,
    interactionMode: !!trackingMode || !!votingNominationId,
    mapWidth,
    mapHeight,
    nominationCurvePlayerIds: trackingMode === 'nomination' ? selectedPlayerIds : [],
    activeTab,
    addPlayerVisible,
    trackingMode,
    votingNominationId,
    votingReturnTab,
    focusedPlayerId,
    focusedPlayer,
    focusedPlayerIsDead,
    focusedPlayerNote,
    nominationDisabled,
    noteDraft,
    noteEditorVisible,
    isRotatingMode,
    isRearrangeMode,
    selectedPlayerIds,
    highlightedPlayerIds,
    trackingConfirmLabel,
    trackingCancelFlex,
    trackingConfirmFlex,
    setActiveTab,
    setAddPlayerVisible,
    setNoteDraft,
    exitMapModes,
    exitRotateMode,
    exitRearrangeMode,
    handleSelectPlayer,
    handleMovePlayer,
    handleStartTracking,
    handleCancelTracking,
    handleConfirmTracking,
    handleConfirmVotes,
    handleCancelVoting,
    handleEditNominationVotes,
    handleChangeDay,
    handleRotateTokens,
    handleResizeTokens,
    handleSetFocusedPlayerDeath,
    handleReviveFocusedPlayer,
    handleUndoFocusedPlayerDeath,
    handleShowFocusedPlayerNote,
    handleSaveFocusedPlayerNote,
    confirmDeletePlayer,
    handleDeleteConversation,
    handleDeleteNomination,
    handleAddPlayer,
    enterRearrangeMode,
    enterRotateMode,
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          title: `Day ${activeGame.activeDay}/${lastDayWithData}`,
          headerLeft: () => (
            <HeaderLeft alivePlayerCount={alivePlayerCount} deadPlayerCount={deadPlayerCount} />
          ),
          headerTitle: () => (
            <HeaderTitle
              activeDay={activeGame.activeDay}
              lastDayWithData={lastDayWithData}
              onChangeDay={handleChangeDay}
            />
          ),
          headerRight: () => <HeaderRight onAddPlayer={() => setAddPlayerVisible(true)} />,
        }}
      />

      <GameRouteProvider value={contextValue}>
        <AddPlayerModal
          players={activeGame.players}
          visible={addPlayerVisible}
          onAddPlayer={handleAddPlayer}
          onClose={() => setAddPlayerVisible(false)}
        />

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: '#0b1120', flex: 1 }}
          contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 40 }}
        >
          <GameMap />

          {votingNominationId ? (
            <View key="vote-actions">
              <VoteConfirmActions />
            </View>
          ) : trackingMode ? (
            <View key="tracking-actions">
              <TrackingConfirmActions />
            </View>
          ) : focusedPlayer ? (
            <View key="focused-player-actions">
              <FocusedPlayerActions />
            </View>
          ) : isRotatingMode ? (
            <View key="rotate-actions">
              <RotateActions />
            </View>
          ) : isRearrangeMode ? (
            <View key="rearrange-actions">
              <RearrangeActions />
            </View>
          ) : (
            <View key="map-mode-actions">
              <MapModeActions />
            </View>
          )}

          <View key="tab-bar">
            <GameTabs />
          </View>

          {activeTab === 'nominations' ? (
            <View key="nominations-tab">
              <NominationList />
            </View>
          ) : activeTab === 'deaths' ? (
            <View key="deaths-tab">
              <DeathLog activeDay={activeGame.activeDay} players={activeGame.players} />
            </View>
          ) : (
            <View key="interactions-tab">
              <InteractionsTab />
            </View>
          )}
        </ScrollView>
      </GameRouteProvider>
    </>
  );
}
