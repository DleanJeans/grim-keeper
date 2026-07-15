import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { FocusedDeathActionPanel } from '@/components/game/death-actions';
import { DeathLog } from '@/components/game/death-log';
import { GameMap } from '@/components/game/game-map';
import {
  type GameRouteContextValue,
  GameRouteProvider,
  type GameTab,
  type TrackingMode,
} from '@/components/game/game-route-context';
import { GameTabs } from '@/components/game/game-tabs';
import { HeaderLeft } from '@/components/game/header-left';
import { HeaderTitle } from '@/components/game/header-title';
import { InteractionsTab } from '@/components/game/interactions-tab';
import { MapModeActions } from '@/components/game/map-mode-actions';
import { NominationList } from '@/components/game/nomination-list';
import { NotesTab } from '@/components/game/notes-tab';
import { RearrangeActions } from '@/components/game/rearrange-actions';
import { RevealRolesButton } from '@/components/game/show-roles-button';
import { TrackingConfirmActions } from '@/components/game/tracking-confirm-actions';
import { VoteConfirmActions } from '@/components/game/vote-confirm-actions';
import { Text } from '@/components/text';
import { getGameById, useGameStore } from '@/store/game-store';
import type { KillAttribution, PlayerPosition, PlayerRoleAssignment } from '@/types/game';
import { getLastDayWithData } from '@/utils/game-utils';
import { getTokenSize, rotatePlayerMapPositions } from '@/utils/layout-utils';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';
import {
  addRoleToScript,
  getRoleAssignmentForDay,
  getRolesForDayOrPrevious,
  isTravelerRole,
} from '@/utils/role-utils';

export default function GameRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { height, width } = useWindowDimensions();
  const games = useGameStore((state) => state.games);
  const setPlayerDeath = useGameStore((state) => state.setPlayerDeath);
  const setPlayerRevive = useGameStore((state) => state.setPlayerRevive);
  const setPlayerRoleAssignment = useGameStore((state) => state.setPlayerRoleAssignment);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const setGameScript = useGameStore((state) => state.setGameScript);
  const setPlayerDayNote = useGameStore((state) => state.setPlayerDayNote);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const updatePlayerPositions = useGameStore((state) => state.updatePlayerPositions);
  const addConversation = useGameStore((state) => state.addConversation);
  const updateNominationVotes = useGameStore((state) => state.updateNominationVotes);
  const deleteConversation = useGameStore((state) => state.deleteConversation);
  const setActiveDay = useGameStore((state) => state.setActiveDay);
  const setTokenSize = useGameStore((state) => state.setTokenSize);
  const [activeTab, setActiveTab] = useState<GameTab>('interactions');
  const [trackingMode, setTrackingMode] = useState<TrackingMode | null>(null);
  const [votingNominationId, setVotingNominationId] = useState<string | null>(null);
  const [votingReturnTab, setVotingReturnTab] = useState<GameTab | null>(null);
  const [focusedPlayerId, setFocusedPlayerId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteEditingDay, setNoteEditingDay] = useState<number | null>(null);
  const [noteEditingPlayerId, setNoteEditingPlayerId] = useState<string | null>(null);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [roleAssignmentKind, setRoleAssignmentKind] = useState<PlayerRoleAssignment['kind'] | null>(
    null,
  );
  const [roleAssignmentRoleIds, setRoleAssignmentRoleIds] = useState<string[]>([]);
  const [showRoles, setShowRoles] = useState(false);
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
  const gameScriptId = activeGame.script?.id;
  const focusedPlayer = activeGame.players.find((player) => player.id === focusedPlayerId);
  const focusedPlayerIsDead = focusedPlayer
    ? isPlayerCurrentlyDead(focusedPlayer, activeGame.activeDay)
    : false;
  const highlightedPlayerIds = trackingMode
    ? selectedPlayerIds
    : votingNominationId
      ? selectedPlayerIds
      : focusedPlayerId
        ? [focusedPlayerId]
        : [];
  const hideConnectionCurves = trackingMode === 'nomination' || !!votingNominationId;
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
  const nominationCurves = activeDayNominations
    .map((nomination) => {
      const nomineeId = nomination.participantIds.find(
        (playerId) => playerId !== nomination.initiatorId,
      );
      return nomineeId
        ? { conversationId: nomination.id, initiatorId: nomination.initiatorId, nomineeId }
        : null;
    })
    .filter(
      (curve): curve is { conversationId: string; initiatorId: string; nomineeId: string } =>
        !!curve,
    );
  const nominationDisabled = focusedPlayerIsDead || focusedPlayerAlreadyNominatedToday;
  const disabledPlayerIds =
    trackingMode === 'nomination'
      ? [...nominatedPlayerIds].filter((playerId) => playerId !== selectedPlayerIds[0])
      : [];
  const gameRoles = activeGame.script?.roles ?? [];
  const travelerPlayerIds = new Set(
    activeGame.players
      .filter((player) =>
        getRolesForDayOrPrevious(player.roleAssignments, activeGame.activeDay, gameRoles).some(
          isTravelerRole,
        ),
      )
      .map((player) => player.id),
  );
  const nonTravelerPlayers = activeGame.players.filter(
    (player) => !travelerPlayerIds.has(player.id),
  );
  const deadPlayerCount = nonTravelerPlayers.filter((player) =>
    isPlayerCurrentlyDead(player, activeGame.activeDay),
  ).length;
  const alivePlayerCount = nonTravelerPlayers.length - deadPlayerCount;
  const travelerPlayerCount = travelerPlayerIds.size;
  const lastDayWithData = getLastDayWithData(activeGame);

  function exitMapModes() {
    setIsRearrangeMode(false);
  }

  function exitRearrangeMode() {
    setIsRearrangeMode(false);
  }

  function enterRearrangeMode() {
    setIsRearrangeMode(true);
  }

  function handleDeleteConversation(conversationId: string) {
    deleteConversation(activeGame.id, conversationId);
  }

  function handleDeleteNomination(nominationId: string) {
    deleteConversation(activeGame.id, nominationId);
  }

  function handleSelectPlayer(playerId: string) {
    setRoleAssignmentKind(null);
    setRoleAssignmentRoleIds([]);

    if (votingNominationId) {
      setSelectedPlayerIds((currentIds) =>
        currentIds.includes(playerId)
          ? currentIds.filter((currentId) => currentId !== playerId)
          : [...currentIds, playerId],
      );
      return;
    }

    if (!trackingMode) {
      setIsRearrangeMode(false);
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
    setIsRearrangeMode(false);
    setSelectedPlayerIds([focusedPlayerId]);
  }

  function handleCancelTracking() {
    setIsRearrangeMode(false);
    setTrackingMode(null);
    setVotingNominationId(null);
    setVotingReturnTab(null);
    setFocusedPlayerId(null);
    setSelectedPlayerIds([]);
    setRoleAssignmentKind(null);
    setRoleAssignmentRoleIds([]);
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
    if (votingNominationId) {
      // The nomination was added to the log by handleConfirmTracking before
      // we entered vote-confirming. Cancelling now should drop it entirely.
      deleteConversation(activeGame.id, votingNominationId);
    }
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
    const selectedPlayerId = focusedPlayerId;
    handleCancelTracking();
    setFocusedPlayerId(selectedPlayerId);
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

  function handleStartRoleAssignment(kind: PlayerRoleAssignment['kind']) {
    if (!focusedPlayer || !activeGame.script) {
      return;
    }

    const currentAssignment = getRoleAssignmentForDay(
      focusedPlayer.roleAssignments,
      activeGame.activeDay,
      kind,
    );
    const currentRoleIds = currentAssignment?.roleIds ?? [];
    const travelerRoleIds = new Set(
      activeGame.script.roles.filter(isTravelerRole).map((role) => role.id),
    );
    const selectableRoleIds =
      kind === 'claim'
        ? currentRoleIds.filter((roleId) => !travelerRoleIds.has(roleId))
        : currentRoleIds;
    setRoleAssignmentKind(kind);
    setRoleAssignmentRoleIds(selectableRoleIds.slice(0, 1));
  }

  function handleCancelRoleAssignment() {
    setRoleAssignmentKind(null);
    setRoleAssignmentRoleIds([]);
  }

  function handleToggleRoleAssignment(roleId: string) {
    const nextRoleIds = roleAssignmentRoleIds[0] === roleId ? [] : [roleId];

    const travelerRole = roleCatalog.find((role) => role.id === roleId);
    if (travelerRole && isTravelerRole(travelerRole) && activeGame.script) {
      const nextScript = addRoleToScript(activeGame.script, travelerRole);
      if (nextScript !== activeGame.script) {
        setGameScript(activeGame.id, nextScript);
      }
    }

    handleSaveRoleAssignment(nextRoleIds);
  }

  function handleSaveRoleAssignment(roleIds = roleAssignmentRoleIds.slice(0, 1)) {
    if (!focusedPlayer || !roleAssignmentKind || !activeGame.script) {
      return;
    }

    setPlayerRoleAssignment(
      activeGame.id,
      focusedPlayer.id,
      activeGame.activeDay,
      roleAssignmentKind,
      roleIds,
    );
    handleCancelRoleAssignment();
  }

  function handleMovePlayer(playerId: string, position: PlayerPosition) {
    updatePlayerPosition(activeGame.id, playerId, position);
  }

  function handleSetFocusedPlayerDeath(kind: 'execution' | 'night', attribution?: KillAttribution) {
    if (!focusedPlayer) {
      return;
    }

    setPlayerDeath(activeGame.id, focusedPlayer.id, {
      day: activeGame.activeDay,
      kind,
      ...attribution,
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

  function handleShowPlayerNoteForDay(playerId: string, day: number) {
    if (!activeGame.players.some((p) => p.id === playerId)) {
      return;
    }
    const existing = activeGame.playerDayNotes?.find(
      (n) => n.playerId === playerId && n.day === day,
    );
    setNoteEditingPlayerId(playerId);
    setNoteEditingDay(day);
    setNoteDraft(existing?.text ?? '');
  }

  function handleSavePlayerNote() {
    if (noteEditingPlayerId === null || noteEditingDay === null) {
      return;
    }

    setPlayerDayNote(activeGame.id, noteEditingPlayerId, noteEditingDay, noteDraft);
    setNoteEditingPlayerId(null);
    setNoteEditingDay(null);
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
    travelerPlayerCount,
    disabledPlayerIds,
    nominatedPlayerIds,
    hideConnectionCurves,
    interactionMode: !!trackingMode || !!votingNominationId,
    mapWidth,
    mapHeight,
    nominationCurves,
    activeTab,
    trackingMode,
    votingNominationId,
    votingReturnTab,
    focusedPlayerId,
    focusedPlayer,
    focusedPlayerIsDead,
    nominationDisabled,
    noteDraft,
    noteEditingDay,
    noteEditingPlayerId,
    isRearrangeMode,
    selectedPlayerIds,
    highlightedPlayerIds,
    roleAssignmentKind,
    roleAssignmentRoleIds,
    showRoles,
    setActiveTab,
    setNoteDraft,
    exitMapModes,
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
    handleStartRoleAssignment,
    handleCancelRoleAssignment,
    handleToggleRoleAssignment,
    handleSaveRoleAssignment,
    setShowRoles,
    handleSetFocusedPlayerDeath,
    handleReviveFocusedPlayer,
    handleUndoFocusedPlayerDeath,
    handleShowPlayerNoteForDay,
    handleSavePlayerNote,
    handleDeleteConversation,
    handleDeleteNomination,
    enterRearrangeMode,
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          title: `Day ${activeGame.activeDay}/${lastDayWithData}`,
          headerLeft: () => (
            <HeaderLeft
              onEdit={() => router.push({ pathname: '/create', params: { gameId: activeGame.id } })}
              onViewScript={
                gameScriptId
                  ? () => router.push({ pathname: '/scripts/[id]', params: { id: gameScriptId } })
                  : undefined
              }
            />
          ),
          headerRight: () => (
            <RevealRolesButton onRevealRolesChange={setShowRoles} showRoles={showRoles} />
          ),
          headerTitle: () => (
            <HeaderTitle
              activeDay={activeGame.activeDay}
              alivePlayerCount={alivePlayerCount}
              deadPlayerCount={deadPlayerCount}
              lastDayWithData={lastDayWithData}
              onChangeDay={handleChangeDay}
              travelerPlayerCount={travelerPlayerCount}
            />
          ),
        }}
      />

      <GameRouteProvider value={contextValue}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: '#0b1120', flex: 1 }}
          contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 40 }}
        >
          <GameMap />

          {isRearrangeMode ? (
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
              {votingNominationId ? (
                <View key="vote-actions">
                  <VoteConfirmActions />
                </View>
              ) : trackingMode ? (
                <View key="tracking-actions">
                  <TrackingConfirmActions />
                </View>
              ) : null}
              <NominationList />
            </View>
          ) : activeTab === 'deaths' ? (
            <View key="deaths-tab">
              <FocusedDeathActionPanel />
              <DeathLog
                activeDay={activeGame.activeDay}
                players={activeGame.players}
                script={activeGame.script}
              />
            </View>
          ) : activeTab === 'notes' ? (
            <View key="notes-tab">
              <NotesTab />
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
