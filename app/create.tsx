import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import {
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { CreateFormHeader } from '@/components/create/create-form-header';
import { CreateHeaderDoneButton } from '@/components/create/create-header-done-button';
import { type DraftPlayer, PlayerRow } from '@/components/create/player-row';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { hasDuplicatePlayerName, normalizePlayerName } from '@/utils/conversation-utils';
import { getFriendSummaries } from '@/utils/friend-utils';
import { getDefaultMapHeight, getDefaultMapWidth } from '@/utils/layout-utils';
import { APP_USER_ID } from '@/utils/object-id';

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
  const setGameLorics = useGameStore((state) => state.setGameLorics);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const storedFriends = useGameStore((state) => state.friends);
  const { height: viewportHeight, width: viewportWidth } = useWindowDimensions();
  const inputRef = useRef<RNTextInput>(null);
  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [draftPlayers, setDraftPlayers] = useState<DraftPlayer[]>([]);
  const [draftSelectedScriptId, setDraftSelectedScriptId] = useState<string | null>(
    scriptIdParam ?? null,
  );
  const [selectedLoricIds, setSelectedLoricIds] = useState<string[]>([]);
  const draftGameId = useRef<string | null>(null);
  const editingGame = gameIdParam ? games.find((game) => game.id === gameIdParam) : undefined;
  const isEditing = Boolean(editingGame);
  const players =
    editingGame && draftGameId.current !== editingGame.id
      ? editingGame.players
          .filter((player) => player.id !== APP_USER_ID)
          .map(({ id, name }) => ({ id, name }))
      : draftPlayers;
  const fixedPlayerName =
    editingGame?.players.find((player) => player.id === APP_USER_ID)?.name ?? appUserName;
  const legacyScript = editingGame?.script;
  const availableScripts = useMemo(() => {
    if (!legacyScript || scripts.some((script) => script.id === legacyScript.id)) {
      return scripts;
    }

    return [legacyScript, ...scripts];
  }, [legacyScript, scripts]);
  const selectedScriptId = draftSelectedScriptId;
  const selectedScript = availableScripts.find((script) => script.id === selectedScriptId);
  const mapWidth = getDefaultMapWidth(viewportWidth);
  const mapHeight = getDefaultMapHeight(mapWidth, viewportHeight);
  const selectedNames = useMemo(
    () => [fixedPlayerName, ...players.map((player) => player.name)],
    [fixedPlayerName, players],
  );
  const friends = useMemo(
    () => getFriendSummaries(games, storedFriends, appUserName),
    [appUserName, games, storedFriends],
  );
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
          .filter((player) => player.id !== APP_USER_ID)
          .map(({ id, name }) => ({ id, name })),
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

  function handleSelectFriend(friendName: string) {
    const normalizedFriendName = normalizePlayerName(friendName);

    if (!normalizedFriendName || hasDuplicatePlayerName(selectedNames, normalizedFriendName)) {
      return;
    }

    setDraftPlayers((currentPlayers) => [
      ...currentPlayers,
      { id: createDraftId(), name: normalizedFriendName },
    ]);
    setName('');
    setNameFocused(true);
    setTimeout(() => inputRef.current?.focus(), 0);
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
      updateGamePlayers(editingGame.id, players);
      setGameScript(editingGame.id, selectedScript);
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
          contentContainerStyle={{
            gap: 6,
            paddingBottom: 40,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}
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
              canAddPlayer={canAddPlayer}
              canStart={canStart}
              duplicateName={duplicateName}
              fixedPlayerName={fixedPlayerName}
              friends={suggestedFriends}
              helperText={helperText}
              inputRef={inputRef}
              isEditing={isEditing}
              name={name}
              nameFocused={nameFocused}
              onAddPlayer={handleAddPlayer}
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
              lorics={roleCatalog.filter((role) => role.team?.toLocaleLowerCase() === 'loric')}
              onSelectLorics={setSelectedLoricIds}
              onStart={handleStart}
              onSubmitName={handleAddPlayer}
              scripts={availableScripts}
              selectedScriptId={selectedScriptId}
              selectedLoricIds={selectedLoricIds}
            />
          }
          ListHeaderComponentStyle={styles.listHeader}
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
  listHeader: {
    zIndex: 10,
  },
});
