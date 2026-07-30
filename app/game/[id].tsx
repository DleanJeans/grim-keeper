import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { type ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ActiveGameTab } from '@/components/game/active-game-tab';
import { CharacterTypeCountEditor } from '@/components/game/character-type-counts';
import { DayCount } from '@/components/game/day-count';
import { GameMap } from '@/components/game/game-map';
import {
  type GameRouteContextValue,
  GameRouteProvider,
  type GameTab,
  type TrackingMode,
} from '@/components/game/game-route-context';
import { GameTabContent } from '@/components/game/game-tab-content';
import { GameTabs } from '@/components/game/game-tabs';
import { INLINE_GAME_HEADER_HEIGHT, InlineGameHeader } from '@/components/game/inline-game-header';
import { MapModeActions } from '@/components/game/map-mode-actions';
import { PlayerCountStatus } from '@/components/game/player-count-status';
import { RearrangeActions } from '@/components/game/rearrange-actions';
import { RevealRolesButton } from '@/components/game/reveal-roles-button';
import { Text } from '@/components/text';
import { getGameById, useGameStore } from '@/store/game-store';
import type { KillAttribution, PlayerPosition, PlayerRoleAssignment } from '@/types/game';
import { getLastDayWithData } from '@/utils/game-utils';
import {
  clampMapHeight,
  getDefaultMapHeight,
  getDefaultMapWidth,
  getLegacyMapHeight,
  getMapScale,
  getTokenSize,
  resolveTokenCollisions,
  rotatePlayerMapPositions,
  scalePlayerMapPositions,
} from '@/utils/layout-utils';
import { hasDeadVoteAvailable, isPlayerCurrentlyDead } from '@/utils/player-utils';
import {
  addRoleToScript,
  getRoleAssignmentForDay,
  getRolesForDayOrPrevious,
  isTravelerRole,
} from '@/utils/role-utils';

export default function GameRoute() {
  const {
    id,
    day: dayParam,
    playerId: playerIdParam,
    tab: tabParam,
  } = useLocalSearchParams<{
    day?: string;
    id: string;
    playerId?: string;
    tab?: string;
  }>();
  const { height, width } = useWindowDimensions();
  const games = useGameStore((state) => state.games);
  const setPlayerDeath = useGameStore((state) => state.setPlayerDeath);
  const setPlayerRevive = useGameStore((state) => state.setPlayerRevive);
  const setPlayerRoleAssignment = useGameStore((state) => state.setPlayerRoleAssignment);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const setGameScript = useGameStore((state) => state.setGameScript);
  const addPlayerDayNote = useGameStore((state) => state.addPlayerDayNote);
  const editPlayerDayNote = useGameStore((state) => state.editPlayerDayNote);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const updatePlayerPositions = useGameStore((state) => state.updatePlayerPositions);
  const addConversation = useGameStore((state) => state.addConversation);
  const updateNominationVotes = useGameStore((state) => state.updateNominationVotes);
  const deleteConversation = useGameStore((state) => state.deleteConversation);
  const setActiveDay = useGameStore((state) => state.setActiveDay);
  const setMapDimensions = useGameStore((state) => state.setMapDimensions);
  const setTokenSize = useGameStore((state) => state.setTokenSize);
  const setCharacterTypeCounts = useGameStore((state) => state.setCharacterTypeCounts);
  const [activeTab, setActiveTab] = useState<GameTab>('interactions');
  const [trackingMode, setTrackingMode] = useState<TrackingMode | null>(null);
  const [votingNominationId, setVotingNominationId] = useState<string | null>(null);
  const [votingReturnTab, setVotingReturnTab] = useState<GameTab | null>(null);
  const [focusedPlayerId, setFocusedPlayerId] = useState<string | null>(null);
  const [highlightedVoterIds, setHighlightedVoterIds] = useState<string[] | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteEditor, setNoteEditor] = useState<{
    day: number;
    noteId: string | null;
    playerId: string;
  } | null>(null);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [roleAssignmentKind, setRoleAssignmentKind] = useState<PlayerRoleAssignment['kind'] | null>(
    null,
  );
  const [roleAssignmentRoleIds, setRoleAssignmentRoleIds] = useState<string[]>([]);
  const [rumorSubjectPlayerId, setRumorSubjectPlayerId] = useState<string | null>(null);
  const [showRoles, setShowRoles] = useState(false);
  const game = getGameById(games, id);
  const viewportMapWidth = getDefaultMapWidth(width);
  const fallbackMapDimensions = useRef<{
    gameId: string;
    legacyMapHeight: number;
    mapHeight: number;
    mapWidth: number;
  } | null>(null);
  if (!fallbackMapDimensions.current || fallbackMapDimensions.current.gameId !== id) {
    const mapWidth = viewportMapWidth;
    fallbackMapDimensions.current = {
      gameId: id,
      legacyMapHeight: getLegacyMapHeight(mapWidth, height),
      mapHeight: getDefaultMapHeight(mapWidth, height),
      mapWidth,
    };
  }
  const fallbackDimensions = fallbackMapDimensions.current;
  const mapWidth = Math.max(1, Math.round(game?.mapWidth ?? fallbackDimensions.mapWidth));
  const mapHeight = clampMapHeight(game?.mapHeight ?? fallbackDimensions.mapHeight);
  const mapScale = getMapScale(viewportMapWidth, mapWidth);
  const openedGameId = useRef<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (
      !game ||
      (game.mapWidth !== undefined && game.mapHeight !== undefined && game.mapHeight === mapHeight)
    ) {
      return;
    }

    const legacyPositions = scalePlayerMapPositions(
      game.players,
      game.mapWidth ?? fallbackDimensions.mapWidth,
      game.mapHeight ?? fallbackDimensions.legacyMapHeight,
      mapWidth,
      mapHeight,
      getTokenSize(game.tokenSize),
    );
    if (Object.keys(legacyPositions).length > 0) {
      updatePlayerPositions(game.id, legacyPositions);
    }
    setMapDimensions(game.id, mapWidth, mapHeight);
  }, [
    fallbackDimensions.legacyMapHeight,
    fallbackDimensions.mapWidth,
    game,
    mapHeight,
    mapWidth,
    setMapDimensions,
    updatePlayerPositions,
  ]);

  // Slide the entire header up off-screen on scroll-down, slide it back in on
  // scroll-up.
  const gameHeaderTranslateY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const delta = y - lastScrollY.value;
      if (Math.abs(delta) < 4) {
        lastScrollY.value = y;
        return;
      }
      const goingDown = delta > 0;
      if (!goingDown || y <= 0) {
        gameHeaderTranslateY.value = withTiming(0, { duration: 180 });
      } else {
        gameHeaderTranslateY.value = withTiming(-120, { duration: 180 });
      }
      lastScrollY.value = y;
    },
  });

  // Always open the saved game on its last day with data, unless a deep link
  // requested a specific day.
  useEffect(() => {
    if (!game || openedGameId.current === game.id) return;
    openedGameId.current = game.id;
    const requestedDay = Number.parseInt(dayParam ?? '', 10);
    if (Number.isFinite(requestedDay) && requestedDay > 0) {
      if (game.activeDay !== requestedDay) {
        setActiveDay(game.id, requestedDay);
      }
      return;
    }
    const lastDayWithData = getLastDayWithData(game);
    if (game.activeDay < lastDayWithData) {
      setActiveDay(game.id, lastDayWithData);
    }
  }, [dayParam, game, setActiveDay]);

  // Apply deep-link focus and tab on first mount.
  useEffect(() => {
    if (!game) return;
    if (playerIdParam && game.players.some((player) => player.id === playerIdParam)) {
      setFocusedPlayerId(playerIdParam);
    }
    if (
      tabParam === 'interactions' ||
      tabParam === 'nominations' ||
      tabParam === 'deaths' ||
      tabParam === 'notes'
    ) {
      setActiveTab(tabParam);
    }
  }, [game, playerIdParam, tabParam]);

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
  const highlightedPlayerIds = trackingMode
    ? selectedPlayerIds
    : votingNominationId
      ? selectedPlayerIds
      : (highlightedVoterIds ??
        (() => {
          const ids: string[] = [];
          if (focusedPlayerId) {
            ids.push(focusedPlayerId);
          }
          // When in rumor mode with a chosen subject, highlight the subject
          // alongside the focused player so the user can see the source/subject
          // pairing on the map.
          if (roleAssignmentKind === 'rumor' && rumorSubjectPlayerId) {
            ids.push(rumorSubjectPlayerId);
          }
          return ids;
        })());
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
  const deadVoteUnavailablePlayerIds = new Set(
    activeGame.players
      .filter(
        (player) =>
          isPlayerCurrentlyDead(player, activeGame.activeDay) && player.deadVoteUsed === true,
      )
      .map((player) => player.id),
  );
  const disabledPlayerIds =
    trackingMode === 'nomination'
      ? [...nominatedPlayerIds].filter((playerId) => playerId !== selectedPlayerIds[0])
      : votingNominationId
        ? [...deadVoteUnavailablePlayerIds].filter(
            (playerId) => !selectedPlayerIds.includes(playerId),
          )
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
    setHighlightedVoterIds(null);
    deleteConversation(activeGame.id, nominationId);
  }

  function handleSelectPlayer(playerId: string) {
    setHighlightedVoterIds(null);

    if (roleAssignmentKind === 'rumor') {
      handleConfirmRumorSubject(playerId);
      return;
    }

    setRoleAssignmentKind(null);
    setRoleAssignmentRoleIds([]);

    if (votingNominationId) {
      const player = activeGame.players.find((currentPlayer) => currentPlayer.id === playerId);
      if (
        player &&
        !selectedPlayerIds.includes(playerId) &&
        !hasDeadVoteAvailable(player, activeGame.activeDay) &&
        isPlayerCurrentlyDead(player, activeGame.activeDay)
      ) {
        return;
      }

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
    setHighlightedVoterIds(null);
    setIsRearrangeMode(false);
    setSelectedPlayerIds([focusedPlayerId]);
  }

  function handleCancelTracking() {
    setIsRearrangeMode(false);
    setTrackingMode(null);
    setVotingNominationId(null);
    setVotingReturnTab(null);
    setFocusedPlayerId(null);
    setHighlightedVoterIds(null);
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

  function handleToggleVoterHighlights() {
    const voterIds = [
      ...new Set(activeDayNominations.flatMap((nomination) => nomination.voterIds ?? [])),
    ];

    setHighlightedVoterIds((currentIds) =>
      currentIds ? null : voterIds.length > 0 ? voterIds : null,
    );
  }

  function handleChangeDay(day: number) {
    const selectedPlayerId = focusedPlayerId;
    handleCancelTracking();
    setHighlightedVoterIds(null);
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
    const nextSize = getTokenSize(activeTokenSize + sizeDelta);
    setTokenSize(activeGame.id, nextSize);
    // Pushing is only needed when tokens grow into each other; shrinking can
    // never create new overlaps.
    if (nextSize <= activeTokenSize) {
      return;
    }
    const { positions } = resolveTokenCollisions(activeGame.players, mapWidth, mapHeight, nextSize);
    if (Object.keys(positions).length > 0) {
      updatePlayerPositions(activeGame.id, positions);
    }
  }

  function handleResizeMapHeight(sizeDelta: number) {
    const nextHeight = clampMapHeight(mapHeight + sizeDelta);
    if (nextHeight === mapHeight) {
      return;
    }

    setMapDimensions(activeGame.id, mapWidth, nextHeight);
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
    if (kind === 'rumor') {
      // Enter subject-picking mode immediately so the user can tap any
      // player on the map. The empty string marks "subject pending".
      setRumorSubjectPlayerId('');
    } else {
      setRumorSubjectPlayerId(null);
    }
  }

  function handleConfirmRumorSubject(subjectPlayerId: string) {
    if (!focusedPlayer || !activeGame.script || roleAssignmentKind !== 'rumor') {
      return;
    }
    if (subjectPlayerId === focusedPlayer.id) {
      // Tapping the source player is a no-op; the rumor is always about someone else.
      return;
    }
    setRumorSubjectPlayerId(subjectPlayerId);
  }

  function handleCancelRoleAssignment() {
    setRoleAssignmentKind(null);
    setRoleAssignmentRoleIds([]);
    setRumorSubjectPlayerId(null);
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

    if (travelerRole && isTravelerRole(travelerRole)) {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({ animated: true, y: 0 });
      });
    }
  }

  function handleSaveRoleAssignment(roleIds = roleAssignmentRoleIds.slice(0, 1)) {
    if (!focusedPlayer || !roleAssignmentKind || !activeGame.script) {
      return;
    }

    if (roleAssignmentKind === 'rumor' && !rumorSubjectPlayerId) {
      return;
    }

    setPlayerRoleAssignment(
      activeGame.id,
      focusedPlayer.id,
      activeGame.activeDay,
      roleAssignmentKind,
      roleIds,
      roleAssignmentKind === 'rumor' ? (rumorSubjectPlayerId ?? undefined) : undefined,
    );
    handleCancelRoleAssignment();
  }

  function handleMovePlayer(playerId: string, position: PlayerPosition) {
    updatePlayerPosition(activeGame.id, playerId, position);
    // Push any tokens the dragged player is now overlapping out of the way.
    // The dragged player is the anchor — it stays at `position`, the others
    // get shoved.
    const playersWithMoved = activeGame.players.map((player) =>
      player.id === playerId ? { ...player, position } : player,
    );
    const { positions } = resolveTokenCollisions(
      playersWithMoved,
      mapWidth,
      mapHeight,
      activeTokenSize,
      playerId,
    );
    if (Object.keys(positions).length > 0) {
      updatePlayerPositions(activeGame.id, positions);
    }
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

  function handleStartEditNote(playerId: string, day: number, noteId: string) {
    if (!activeGame.players.some((p) => p.id === playerId)) {
      return;
    }
    const existing = activeGame.playerDayNotes
      ?.find((entry) => entry.playerId === playerId && entry.day === day)
      ?.notes.find((note) => note.id === noteId);
    if (!existing) {
      return;
    }
    setNoteEditor({ day, noteId, playerId });
    setNoteDraft(existing.text);
  }

  function handleStartAddNote(playerId: string, day: number) {
    if (!activeGame.players.some((player) => player.id === playerId)) {
      return;
    }
    setNoteEditor({ day, noteId: null, playerId });
    setNoteDraft('');
  }

  function handleCancelNoteEdit() {
    setNoteEditor(null);
    setNoteDraft('');
  }

  function handleSaveNoteEdit() {
    if (!noteEditor) {
      return;
    }

    if (noteEditor.noteId) {
      editPlayerDayNote(
        activeGame.id,
        noteEditor.playerId,
        noteEditor.day,
        noteEditor.noteId,
        noteDraft,
      );
    } else {
      addPlayerDayNote(activeGame.id, noteEditor.playerId, noteEditor.day, noteDraft);
    }
    handleCancelNoteEdit();
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
    mapScale,
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
    noteEditingNoteId: noteEditor?.noteId ?? null,
    noteEditorDay: noteEditor?.day ?? null,
    noteEditorPlayerId: noteEditor?.playerId ?? null,
    addingNewNote: !!noteEditor && noteEditor.noteId === null,
    isRearrangeMode,
    selectedPlayerIds,
    highlightedPlayerIds,
    voterHighlightsActive: highlightedVoterIds !== null,
    roleAssignmentKind,
    roleAssignmentRoleIds,
    rumorSubjectPlayerId,
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
    handleToggleVoterHighlights,
    handleChangeDay,
    handleResizeMapHeight,
    handleRotateTokens,
    handleResizeTokens,
    handleStartRoleAssignment,
    handleCancelRoleAssignment,
    handleToggleRoleAssignment,
    handleSaveRoleAssignment,
    handleConfirmRumorSubject,
    setShowRoles,
    handleSetFocusedPlayerDeath,
    handleReviveFocusedPlayer,
    handleUndoFocusedPlayerDeath,
    handleStartEditNote,
    handleStartAddNote,
    handleCancelNoteEdit,
    handleSaveNoteEdit,
    handleDeleteConversation,
    handleDeleteNomination,
    enterRearrangeMode,
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <GameRouteProvider value={contextValue}>
        <View style={styles.body}>
          <InlineGameHeader activeGame={activeGame} headerTranslateY={gameHeaderTranslateY} />
          <Animated.ScrollView
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="always"
            onScroll={scrollHandler}
            ref={scrollViewRef}
            scrollEventThrottle={16}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <GameMap />

            <View key="day-and-counts" style={styles.dayAndCountsRow}>
              <View style={styles.leftCounts}>
                <CharacterTypeCountEditor
                  counts={activeGame.characterTypeCounts}
                  onChange={(counts) => setCharacterTypeCounts(activeGame.id, counts)}
                  playerCount={nonTravelerPlayers.length}
                />
              </View>
              <View style={styles.centeredDayCount}>
                <DayCount activeDay={activeGame.activeDay} lastDayWithData={lastDayWithData} />
              </View>
              <View style={styles.rightCounts}>
                <PlayerCountStatus
                  alivePlayerCount={alivePlayerCount}
                  deadPlayerCount={deadPlayerCount}
                  travelerPlayerCount={travelerPlayerCount}
                />
              </View>
            </View>

            {isRearrangeMode ? (
              <View key="rearrange-actions">
                <RearrangeActions />
              </View>
            ) : (
              <View key="map-mode-actions">
                <MapModeActions activeDay={activeGame.activeDay} onChangeDay={handleChangeDay} />
              </View>
            )}

            <View key="tab-bar">
              <GameTabs />
            </View>

            <GameTabContent>
              <ActiveGameTab />
            </GameTabContent>
          </Animated.ScrollView>

          {focusedPlayer ? (
            <View style={styles.selectingBar}>
              <Text style={styles.selectingLabel}>Selecting: {focusedPlayer.name}</Text>
            </View>
          ) : null}

          <View style={styles.fab}>
            <RevealRolesButton
              onRevealRolesChange={setShowRoles}
              showRoles={showRoles}
              variant="icon"
            />
          </View>
        </View>
      </GameRouteProvider>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#0b1120',
    flex: 1,
    position: 'relative',
  },
  fab: {
    bottom: 32,
    elevation: 4,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 16,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  dayAndCountsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  centeredDayCount: { alignItems: 'center', flex: 1 },
  leftCounts: { alignItems: 'flex-start', flex: 1 },
  rightCounts: { alignItems: 'flex-end', flex: 1 },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 20,
    paddingHorizontal: 20,
    paddingBottom: 132,
    paddingTop: INLINE_GAME_HEADER_HEIGHT,
  },
  selectingBar: {
    backgroundColor: '#111827',
    borderTopColor: '#334155',
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  selectingLabel: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
