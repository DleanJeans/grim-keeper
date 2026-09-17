import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import { Keyboard, KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { CreateFormHeader } from '@/components/create/create-form-header';
import { CreateHeaderDoneButton } from '@/components/create/create-header-done-button';
import { ExportGameButton } from '@/components/create/export-game-button';
import { type DraftPlayer, PlayerRow } from '@/components/create/player-row';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';
import { hasDuplicatePlayerName, normalizePlayerName } from '@/utils/conversation-utils';
import {
  getFriendSummaries,
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

export default function CreateRoute() {
  const { gameId: gameIdParam, scriptId: scriptIdParam } = useLocalSearchParams<{
    gameId?: string;
    scriptId?: string;
  }>();
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
  const [draftSelectedScriptId, setDraftSelectedScriptId] = useState<string | null>(
    scriptIdParam ?? null,
  );
  const [selectedLoricIds, setSelectedLoricIds] = useState<string[]>([]);
  const [selectedSushiRoleIds, setSelectedSushiRoleIds] = useState<string[]>([]);
  const [draftSelectedStorytellerId, setDraftSelectedStorytellerId] = useState<string | null>(null);
  const draftGameId = useRef<string | null>(null);
  const sushiSelectionKeyRef = useRef<string | null>(null);
  const sushiSelectionChangedRef = useRef(false);
  const editingGame = gameIdParam ? games.find((game) => game.id === gameIdParam) : undefined;
  const isEditing = Boolean(editingGame);
  const players =
    editingGame && draftGameId.current !== editingGame.id
      ? editingGame.players
          .filter((player) => player.id !== APP_USER_ID && !player.isStoryteller)
          .map(({ id, name }) => ({ id, name }))
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
  const selectedStoryteller = friends.find((friend) => friend.id === draftSelectedStorytellerId);
  const seatedNames = useMemo(
    () => [fixedPlayerName, ...players.map((player) => player.name)],
    [fixedPlayerName, players],
  );
  const selectedNames = useMemo(
    () => [...seatedNames, ...(selectedStoryteller ? [selectedStoryteller.name] : [])],
    [seatedNames, selectedStoryteller],
  );
  const storytellerFriends = useMemo(
    () =>
      sortStorytellerSummaries(
        friends.filter((friend) => !hasDuplicatePlayerName(seatedNames, friend.name)),
      ),
    [friends, seatedNames],
  );
  const playerPickerFriends = useMemo(
    () => friends.filter((friend) => friend.id !== draftSelectedStorytellerId),
    [draftSelectedStorytellerId, friends],
  );
  const selectedFriendIds = useMemo(() => {
    const friendIds = new Set(playerPickerFriends.map((friend) => friend.id));

    return players.flatMap((player) => (friendIds.has(player.id) ? [player.id] : []));
  }, [playerPickerFriends, players]);
  const playerOrderKey = useMemo(() => players.map((player) => player.id).join('|'), [players]);
  const playerIndexes = useMemo(
    () => new Map(players.map((player, index) => [player.id, index])),
    [players],
  );
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
      setDraftPlayers(
        editingGame.players
          .filter((player) => player.id !== APP_USER_ID && !player.isStoryteller)
          .map(({ id, name }) => ({ id, name })),
      );
      setDraftSelectedStorytellerId(
        editingGame.players.find((player) => player.isStoryteller)?.id ?? null,
      );
    }
  }, [editingGame]);

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

    return isEditing
      ? 'Add or remove players, choose a script, then tap Done.'
      : 'Long press a player to drag them into seat order.';
  }, [duplicateName, isEditing, players.length]);

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

  function handleRemovePlayer(playerId: string) {
    setDraftPlayers((currentPlayers) => currentPlayers.filter((player) => player.id !== playerId));
  }

  function handleStart() {
    if (!canStart) {
      return;
    }

    Keyboard.dismiss();

    if (isEditing && editingGame) {
      updateGamePlayers(editingGame.id, players, selectedStoryteller);
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
      storyteller: selectedStoryteller,
      sushiRoleIds: isSushiBuffet ? selectedSushiRoleIds : undefined,
    });
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
        style={{ backgroundColor: colors.background, flex: 1 }}
      >
        <DraggableFlatList
          activationDistance={8}
          automaticallyAdjustKeyboardInsets
          containerStyle={{ backgroundColor: colors.background, flex: 1 }}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
          data={players}
          extraData={playerOrderKey}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: 8,
                borderWidth: 1,
                gap: 8,
                padding: 18,
              }}
            >
              <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
                No other players yet.
              </Text>
              <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
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
              onSelectStoryteller={(friendId) => setDraftSelectedStorytellerId(friendId ?? null)}
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
              selectedStorytellerId={draftSelectedStorytellerId}
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
          onDragEnd={({ data }) => {
            setDraftPlayers(data);
          }}
          renderItem={(params) => (
            <PlayerRow
              drag={params.drag}
              index={(playerIndexes.get(params.item.id) ?? params.getIndex() ?? 0) + 1}
              isActive={params.isActive}
              isEditing={isEditing}
              item={params.item}
              onRemove={handleRemovePlayer}
            />
          )}
          style={{ backgroundColor: colors.background }}
        />
      </KeyboardAvoidingView>
    </>
  );
}

function createDraftId() {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const styles = StyleSheet.create({
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
});
