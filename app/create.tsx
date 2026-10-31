import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import { FlatList, Keyboard, KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { CreateFormHeader } from '@/components/create/create-form-header';
import { CreateHeaderDoneButton } from '@/components/create/create-header-done-button';
import { ExportGameButton } from '@/components/create/export-game-button';
import { PlayerMoveTarget } from '@/components/create/player-move-target';
import { type DraftPlayer, PlayerRow } from '@/components/create/player-row';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { FriendSummary, Game } from '@/types/game';
import { hasDuplicatePlayerName, normalizePlayerName } from '@/utils/conversation-utils';
import {
  getFriendByName,
  getFriendSummaries,
  getSelectedFriendIds,
  getUnsavedPlayerFriends,
  mergeFriendPlayerSelection,
  sortFriendSummaries,
  sortStorytellerSummaries,
} from '@/utils/friend-utils';
import { defaultMapHeight, defaultMapWidth } from '@/utils/layout-utils';
import { APP_USER_ID } from '@/utils/object-id';
import { DESKTOP_CONTENT_MAX_WIDTH } from '@/utils/responsive-utils';
import { SUSHI_BUFFET_SCRIPT_ID } from '@/utils/script-constants';
import { createSushiBuffetScript, isSushiBuffetScript } from '@/utils/script-service';
import { getScriptPlayCounts, sortScriptsByMostPlayed } from '@/utils/script-utils';
import { isNoOpGap, movePlayerToGap, swapPlayers } from '@/utils/seat-order-utils';
import { requestWebFullscreen } from '@/utils/web-fullscreen';

export default function CreateRoute() {
  const {
    copyPlayersFrom: copyPlayersFromParam,
    gameId: gameIdParam,
    scriptId: scriptIdParam,
  } = useLocalSearchParams<{
    copyPlayersFrom?: string;
    gameId?: string;
    scriptId?: string;
  }>();
  const addFriend = useGameStore((state) => state.addFriend);
  const appUserName = useGameStore((state) => state.appUserName);
  const createGame = useGameStore((state) => state.createGame);
  const updateGamePlayers = useGameStore((state) => state.updateGamePlayers);
  const games = useGameStore((state) => state.games);
  const scripts = useGameStore((state) => state.scripts);
  const setGameScript = useGameStore((state) => state.setGameScript);
  const setGameSushiRoleIds = useGameStore((state) => state.setGameSushiRoleIds);
  const setGameLorics = useGameStore((state) => state.setGameLorics);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const storedFriends = useGameStore((state) => state.friends);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const inputRef = useRef<RNTextInput>(null);
  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [draftPlayers, setDraftPlayers] = useState<DraftPlayer[]>([]);
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);
  const [draftSelectedScriptId, setDraftSelectedScriptId] = useState<string | null>(
    scriptIdParam ?? null,
  );
  const [selectedLoricIds, setSelectedLoricIds] = useState<string[]>([]);
  const [selectedSushiRoleIds, setSelectedSushiRoleIds] = useState<string[]>([]);
  const [draftSelectedStorytellerIds, setDraftSelectedStorytellerIds] = useState<string[]>([]);
  const draftGameId = useRef<string | null>(null);
  const copiedPlayersGameId = useRef<string | null>(null);
  const sushiSelectionKeyRef = useRef<string | null>(null);
  const sushiSelectionChangedRef = useRef(false);
  const editingGame = gameIdParam ? games.find((game) => game.id === gameIdParam) : undefined;
  const isEditing = Boolean(editingGame);
  const copyPlayersSourceGame =
    !gameIdParam && copyPlayersFromParam
      ? games.find((game) => game.id === copyPlayersFromParam)
      : undefined;
  const players =
    editingGame && draftGameId.current !== editingGame.id
      ? getDraftPlayers(editingGame)
      : draftPlayers;
  const fixedPlayerName =
    editingGame?.players.find((player) => player.id === APP_USER_ID)?.name ?? appUserName;
  const legacyScript = editingGame?.script;
  const sushiBuffetScript = useMemo(
    () =>
      createSushiBuffetScript(
        roleCatalog,
        legacyScript && isSushiBuffetScript(legacyScript) ? legacyScript.roles : [],
      ),
    [legacyScript, roleCatalog],
  );
  const availableScripts = useMemo(() => {
    const regularScripts = scripts.filter((script) => script.id !== SUSHI_BUFFET_SCRIPT_ID);
    const scriptsForPicker =
      !legacyScript ||
      isSushiBuffetScript(legacyScript) ||
      regularScripts.some((script) => script.id === legacyScript.id)
        ? regularScripts
        : [legacyScript, ...regularScripts];

    return isEditing ? scriptsForPicker : sortScriptsByMostPlayed(scriptsForPicker, games);
  }, [games, isEditing, legacyScript, scripts]);
  const scriptPlayCounts = useMemo(
    () => (isEditing ? undefined : getScriptPlayCounts(games)),
    [games, isEditing],
  );
  const selectedScriptId = draftSelectedScriptId;
  const isSushiBuffet = selectedScriptId === SUSHI_BUFFET_SCRIPT_ID;
  const selectedScript = isSushiBuffet
    ? sushiBuffetScript
    : availableScripts.find((script) => script.id === selectedScriptId);
  const sushiSelectionKey = `${editingGame?.id ?? 'new'}:${selectedScriptId ?? 'none'}`;
  const mapWidth = defaultMapWidth;
  const mapHeight = defaultMapHeight;
  const friends = useMemo(
    () => sortFriendSummaries(getFriendSummaries(games, storedFriends, appUserName), savedNotes),
    [appUserName, games, savedNotes, storedFriends],
  );
  const selectedStorytellers = useMemo(
    () =>
      draftSelectedStorytellerIds.flatMap((friendId) => {
        const friend = friends.find((candidate) => candidate.id === friendId);
        return friend ? [friend] : [];
      }),
    [draftSelectedStorytellerIds, friends],
  );
  const seatedNames = useMemo(
    () => [fixedPlayerName, ...players.map((player) => player.name)],
    [fixedPlayerName, players],
  );
  const selectedNames = useMemo(
    () => [...seatedNames, ...selectedStorytellers.map((storyteller) => storyteller.name)],
    [seatedNames, selectedStorytellers],
  );
  const storytellerFriends = useMemo(
    () =>
      sortStorytellerSummaries(
        friends.filter((friend) => !hasDuplicatePlayerName(seatedNames, friend.name)),
      ),
    [friends, seatedNames],
  );
  const playerPickerFriends = useMemo(() => {
    const pickerFriends = friends.filter(
      (friend) => !draftSelectedStorytellerIds.includes(friend.id),
    );

    return [...getUnsavedPlayerFriends(players, pickerFriends), ...pickerFriends];
  }, [draftSelectedStorytellerIds, friends, players]);
  const selectedFriendIds = useMemo(
    () => getSelectedFriendIds(players, playerPickerFriends),
    [playerPickerFriends, players],
  );
  const movingPlayer = players.find((player) => player.id === movingPlayerId);
  const normalizedName = normalizePlayerName(name);
  const duplicateName = hasDuplicatePlayerName(selectedNames, name);
  const canAddPlayer = normalizedName.length > 0 && !duplicateName;
  const canStart = players.length >= 1 && !(normalizedName.length > 0 && duplicateName);
  const suggestedFriends = useMemo(() => {
    const key = normalizedName.toLocaleLowerCase();

    return friends
      .filter(
        (friend) =>
          !hasDuplicatePlayerName(selectedNames, friend.name) &&
          (!key || friend.name.toLocaleLowerCase().includes(key)),
      )
      .slice(0, 5);
  }, [friends, normalizedName, selectedNames]);

  useEffect(() => {
    if (editingGame && draftGameId.current !== editingGame.id) {
      draftGameId.current = editingGame.id;
      setDraftPlayers(getDraftPlayers(editingGame));
      setDraftSelectedStorytellerIds(getStorytellerIds(editingGame));
    }
  }, [editingGame]);

  useEffect(() => {
    if (copyPlayersSourceGame && copiedPlayersGameId.current !== copyPlayersSourceGame.id) {
      copiedPlayersGameId.current = copyPlayersSourceGame.id;
      setDraftPlayers(getDraftPlayers(copyPlayersSourceGame));
      setDraftSelectedStorytellerIds(getStorytellerIds(copyPlayersSourceGame));
    }
  }, [copyPlayersSourceGame]);

  useEffect(() => {
    if (scriptIdParam) {
      setDraftSelectedScriptId(scriptIdParam);
    } else if (isEditing) {
      setDraftSelectedScriptId(editingGame?.scriptId ?? editingGame?.script?.id ?? null);
    }
  }, [editingGame?.script?.id, editingGame?.scriptId, isEditing, scriptIdParam]);

  useEffect(() => {
    if (isEditing) {
      setSelectedLoricIds(editingGame?.lorics ?? []);
    }
  }, [editingGame?.lorics, isEditing]);

  useEffect(() => {
    if (!isSushiBuffet) {
      return;
    }

    if (sushiSelectionKeyRef.current !== sushiSelectionKey) {
      sushiSelectionKeyRef.current = sushiSelectionKey;
      sushiSelectionChangedRef.current = false;
      setSelectedSushiRoleIds(
        editingGame && isSushiBuffetScript(editingGame.script)
          ? (editingGame.sushiRoleIds ?? editingGame.script?.roles.map((role) => role.id) ?? [])
          : sushiBuffetScript.roles.map((role) => role.id),
      );
      return;
    }

    if (
      !isEditing &&
      !sushiSelectionChangedRef.current &&
      selectedSushiRoleIds.length === 0 &&
      sushiBuffetScript.roles.length > 0
    ) {
      setSelectedSushiRoleIds(sushiBuffetScript.roles.map((role) => role.id));
    }
  }, [
    editingGame,
    isEditing,
    isSushiBuffet,
    selectedSushiRoleIds.length,
    sushiBuffetScript.roles,
    sushiSelectionKey,
  ]);

  const helperText = useMemo(() => {
    if (duplicateName) {
      return 'That player already exists.';
    }

    if (players.length < 1) {
      return 'Add at least 1 other player.';
    }

    if (isEditing) {
      return 'Add or remove players, choose a script, then tap Done.';
    }

    return movingPlayer
      ? `Tap a gap to move ${movingPlayer.name} there, or another player to swap seats. Tap ${movingPlayer.name} again to cancel.`
      : 'Tap a player to move them in seat order.';
  }, [duplicateName, isEditing, movingPlayer, players.length]);

  function handleAddPlayer() {
    if (!canAddPlayer) {
      return;
    }

    setDraftPlayers((currentPlayers) => [
      ...currentPlayers,
      { id: createDraftId(), name: normalizedName },
    ]);
    setName('');
    setNameFocused(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSelectFriend(friend: FriendSummary) {
    const normalizedFriendName = normalizePlayerName(friend.name);

    if (!normalizedFriendName || hasDuplicatePlayerName(selectedNames, normalizedFriendName)) {
      return;
    }

    setDraftPlayers((currentPlayers) => [
      ...currentPlayers,
      { id: friend.id, name: normalizedFriendName },
    ]);
    setName('');
    setNameFocused(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleApplyFriendSelection(friendIds: string[]) {
    setDraftPlayers((currentPlayers) =>
      mergeFriendPlayerSelection(currentPlayers, playerPickerFriends, friendIds),
    );
  }

  function handleAddFriend(friendName: string) {
    addFriend(friendName);

    const state = useGameStore.getState();
    const friend = getFriendByName(
      getFriendSummaries(state.games, state.friends, appUserName),
      friendName,
    );

    return friend && !draftSelectedStorytellerIds.includes(friend.id) ? friend.id : undefined;
  }

  function handleRemovePlayer(playerId: string) {
    setDraftPlayers((currentPlayers) => currentPlayers.filter((player) => player.id !== playerId));
    if (movingPlayerId === playerId) {
      setMovingPlayerId(null);
    }
  }

  function handlePressPlayer(playerId: string) {
    if (!movingPlayerId || movingPlayerId === playerId) {
      setMovingPlayerId(movingPlayerId === playerId ? null : playerId);
      return;
    }

    setDraftPlayers((currentPlayers) => swapPlayers(currentPlayers, movingPlayerId, playerId));
    setMovingPlayerId(null);
  }

  function handleMoveToGap(gapIndex: number) {
    if (!movingPlayerId) {
      return;
    }

    setDraftPlayers((currentPlayers) => movePlayerToGap(currentPlayers, movingPlayerId, gapIndex));
    setMovingPlayerId(null);
  }

  function handleStart() {
    if (!canStart) {
      return;
    }

    Keyboard.dismiss();

    if (isEditing && editingGame) {
      updateGamePlayers(editingGame.id, players, selectedStorytellers);
      setGameScript(editingGame.id, selectedScript);
      if (isSushiBuffet) {
        setGameSushiRoleIds(editingGame.id, selectedSushiRoleIds);
      }
      setGameLorics(
        editingGame.id,
        roleCatalog.filter((role) => selectedLoricIds.includes(role.id)),
      );
      router.back();
      return;
    }

    const game = createGame({
      lorics: roleCatalog.filter((role) => selectedLoricIds.includes(role.id)),
      mapHeight,
      mapWidth,
      playerNames: players.map((player) => player.name),
      script: selectedScript,
      storytellers: selectedStorytellers,
      sushiRoleIds: isSushiBuffet ? selectedSushiRoleIds : undefined,
    });
    void requestWebFullscreen();
    router.replace({ pathname: '/game/[id]', params: { id: game.id } });
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <TitleHeader
              right={
                isEditing ? (
                  <CreateHeaderDoneButton canStart={canStart} onPress={handleStart} />
                ) : undefined
              }
              title={isEditing ? 'Edit Game' : 'New Game'}
            />
          ),
          title: isEditing ? 'Edit Game' : 'New Game',
        }}
      />
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
        style={styles.screen}
      >
        <FlatList
          automaticallyAdjustKeyboardInsets
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
          data={players}
          extraData={movingPlayerId}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text selectable style={styles.emptyTitle}>
                No other players yet.
              </Text>
              <Text selectable style={styles.emptyText}>
                Type a name and press Enter or Add.
              </Text>
            </View>
          }
          ListHeaderComponent={
            <CreateFormHeader
              allFriends={playerPickerFriends}
              canAddPlayer={canAddPlayer}
              canStart={canStart}
              duplicateName={duplicateName}
              featuredScript={sushiBuffetScript}
              fixedPlayerName={fixedPlayerName}
              friends={suggestedFriends}
              helperText={helperText}
              inputRef={inputRef}
              isEditing={isEditing}
              isSushiBuffet={isSushiBuffet}
              name={name}
              nameFocused={nameFocused}
              onAddFriend={handleAddFriend}
              onAddPlayer={handleAddPlayer}
              onApplyFriendSelection={handleApplyFriendSelection}
              onBlurName={() => setNameFocused(false)}
              onBrowseScripts={() =>
                router.push({
                  pathname: '/scripts',
                  params:
                    isEditing && editingGame
                      ? { gameId: editingGame.id, selectForGame: 'true' }
                      : { selectForGame: 'true' },
                })
              }
              onChangeName={setName}
              onFocusName={() => setNameFocused(true)}
              onSelectFriend={handleSelectFriend}
              onSelectScript={setDraftSelectedScriptId}
              onSelectSushiRoles={(roleIds) => {
                sushiSelectionChangedRef.current = true;
                setSelectedSushiRoleIds(roleIds);
              }}
              onSelectStorytellers={setDraftSelectedStorytellerIds}
              lorics={roleCatalog.filter((role) => role.team?.toLocaleLowerCase() === 'loric')}
              onSelectLorics={setSelectedLoricIds}
              onStart={handleStart}
              onSubmitName={handleAddPlayer}
              scripts={availableScripts}
              scriptPlayCounts={scriptPlayCounts}
              selectedScriptId={selectedScriptId}
              selectedSushiRoleIds={selectedSushiRoleIds}
              selectedFriendIds={selectedFriendIds}
              selectedLoricIds={selectedLoricIds}
              selectedStorytellerIds={draftSelectedStorytellerIds}
              storytellers={storytellerFriends}
              sushiRoles={sushiBuffetScript.roles}
            />
          }
          ListHeaderComponentStyle={styles.listHeader}
          ListFooterComponent={
            isEditing && editingGame ? (
              <ExportGameButton game={editingGame} roleCatalog={roleCatalog} scripts={scripts} />
            ) : null
          }
          renderItem={({ index, item }) => (
            <SeatListItem
              index={index}
              isEditing={isEditing}
              item={item}
              movingPlayer={movingPlayer}
              onMoveToGap={handleMoveToGap}
              onPressPlayer={handlePressPlayer}
              onRemove={handleRemovePlayer}
              players={players}
            />
          )}
          style={styles.screen}
        />
      </KeyboardAvoidingView>
    </>
  );
}

/** A seated player, with the gaps around them while another player is picked to move. */
function SeatListItem({
  index,
  isEditing,
  item,
  movingPlayer,
  onMoveToGap,
  onPressPlayer,
  onRemove,
  players,
}: {
  index: number;
  isEditing: boolean;
  item: DraftPlayer;
  movingPlayer?: DraftPlayer;
  onMoveToGap: (gapIndex: number) => void;
  onPressPlayer: (playerId: string) => void;
  onRemove: (playerId: string) => void;
  players: DraftPlayer[];
}) {
  const showGap = (gapIndex: number) =>
    !!movingPlayer && !isNoOpGap(players, movingPlayer.id, gapIndex);
  const gapLabel = (gapIndex: number) => {
    const before = gapIndex === 0 ? 'you' : players[gapIndex - 1]?.name;
    const after = gapIndex === players.length ? 'you' : players[gapIndex]?.name;
    return `Move ${movingPlayer?.name} between ${before} and ${after}`;
  };

  return (
    <View style={styles.seat}>
      {index === 0 && showGap(0) ? (
        <PlayerMoveTarget label={gapLabel(0)} onPress={() => onMoveToGap(0)} />
      ) : null}
      <PlayerRow
        index={index + 1}
        isEditing={isEditing}
        isMoving={movingPlayer?.id === item.id}
        item={item}
        onPress={onPressPlayer}
        onRemove={onRemove}
      />
      {showGap(index + 1) ? (
        <PlayerMoveTarget label={gapLabel(index + 1)} onPress={() => onMoveToGap(index + 1)} />
      ) : null}
    </View>
  );
}

function getDraftPlayers(game: Game): DraftPlayer[] {
  return game.players
    .filter((player) => player.id !== APP_USER_ID && !player.isStoryteller)
    .map(({ id, name }) => ({ id, name }));
}

function getStorytellerIds(game: Game) {
  return game.players.filter((player) => player.isStoryteller).map((player) => player.id);
}

function createDraftId() {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  listContent: {
    alignSelf: 'center',
    gap: 6,
    maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
    width: '100%',
  },
  listHeader: {
    zIndex: 10,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  seat: {
    gap: 6,
  },
});
