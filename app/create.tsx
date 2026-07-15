import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Play, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import { Keyboard, Pressable, View } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { CreateHeaderDoneButton } from '@/components/create/create-header-done-button';
import { FixedPlayerRow } from '@/components/create/fixed-player-row';
import { type DraftPlayer, PlayerRow } from '@/components/create/player-row';
import { FriendSuggestions } from '@/components/friends/friend-suggestions';
import { TravelerRolePicker } from '@/components/game/traveler-role-picker';
import { GameScriptPicker } from '@/components/scripts/game-script-picker';
import { Text, TextInput } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { hasDuplicatePlayerName, normalizePlayerName } from '@/utils/conversation-utils';
import { getFriendSummaries } from '@/utils/friend-utils';
import { isTravelerRole } from '@/utils/role-utils';

export default function CreateRoute() {
  const { gameId: gameIdParam, scriptId: scriptIdParam } = useLocalSearchParams<{
    gameId?: string;
    scriptId?: string;
  }>();
  const appUserName = useGameStore((state) => state.appUserName);
  const addPlayer = useGameStore((state) => state.addPlayer);
  const createGame = useGameStore((state) => state.createGame);
  const deletePlayer = useGameStore((state) => state.deletePlayer);
  const games = useGameStore((state) => state.games);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const scripts = useGameStore((state) => state.scripts);
  const setGameScript = useGameStore((state) => state.setGameScript);
  const storedFriends = useGameStore((state) => state.friends);
  const inputRef = useRef<RNTextInput>(null);
  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [draftPlayers, setDraftPlayers] = useState<DraftPlayer[]>([]);
  const [selectedTravelerRoleIds, setSelectedTravelerRoleIds] = useState<string[]>([]);
  const [draftSelectedScriptId, setDraftSelectedScriptId] = useState<string | null>(
    scriptIdParam ?? null,
  );
  const editingGame = gameIdParam ? games.find((game) => game.id === gameIdParam) : undefined;
  const isEditing = Boolean(gameIdParam);
  const players = editingGame
    ? editingGame.players
        .filter((player) => !player.isAppUser)
        .map(({ id, name }) => ({ id, name }))
    : draftPlayers;
  const fixedPlayerName =
    editingGame?.players.find((player) => player.isAppUser)?.name ?? appUserName;
  const legacyScript = editingGame?.script;
  const availableScripts = useMemo(() => {
    if (!legacyScript || scripts.some((script) => script.id === legacyScript.id)) {
      return scripts;
    }

    return [legacyScript, ...scripts];
  }, [legacyScript, scripts]);
  const selectedScriptId = draftSelectedScriptId;
  const selectedScript = availableScripts.find((script) => script.id === selectedScriptId);
  const travelerRoles = useMemo(() => roleCatalog.filter(isTravelerRole), [roleCatalog]);
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

  const selectedScriptForGame = useMemo(() => {
    if (!selectedScript) {
      return undefined;
    }

    const selectedTravelerRoleIdSet = new Set(selectedTravelerRoleIds);
    const existingRoleIds = new Set(selectedScript.roles.map((role) => role.id));
    const roles = selectedScript.roles.filter(
      (role) => !isTravelerRole(role) || selectedTravelerRoleIdSet.has(role.id),
    );
    const addedTravelerRoles = travelerRoles.filter(
      (role) => selectedTravelerRoleIdSet.has(role.id) && !existingRoleIds.has(role.id),
    );

    return {
      ...selectedScript,
      roles: [...roles, ...addedTravelerRoles],
      updatedAt: new Date().toISOString(),
    };
  }, [selectedScript, selectedTravelerRoleIds, travelerRoles]);

  useEffect(() => {
    if (scriptIdParam) {
      setDraftSelectedScriptId(scriptIdParam);
    } else if (isEditing) {
      setDraftSelectedScriptId(editingGame?.script?.id ?? null);
    }
  }, [editingGame?.script?.id, isEditing, scriptIdParam]);

  useEffect(() => {
    setSelectedTravelerRoleIds(
      selectedScript?.roles.filter(isTravelerRole).map((role) => role.id) ?? [],
    );
  }, [selectedScript]);

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

    if (isEditing && editingGame) {
      addPlayer(editingGame.id, normalizedName);
    } else {
      setDraftPlayers((currentPlayers) => [
        ...currentPlayers,
        { id: createDraftId(), name: normalizedName },
      ]);
    }
    setName('');
    setNameFocused(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSelectFriend(friendName: string) {
    const normalizedFriendName = normalizePlayerName(friendName);

    if (!normalizedFriendName || hasDuplicatePlayerName(selectedNames, normalizedFriendName)) {
      return;
    }

    if (isEditing && editingGame) {
      addPlayer(editingGame.id, normalizedFriendName);
    } else {
      setDraftPlayers((currentPlayers) => [
        ...currentPlayers,
        { id: createDraftId(), name: normalizedFriendName },
      ]);
    }
    setName('');
    setNameFocused(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleRemovePlayer(playerId: string) {
    if (isEditing && editingGame) {
      deletePlayer(editingGame.id, playerId);
      return;
    }

    setDraftPlayers((currentPlayers) => currentPlayers.filter((player) => player.id !== playerId));
  }

  function handleToggleTravelerRole(roleId: string) {
    setSelectedTravelerRoleIds((currentRoleIds) =>
      currentRoleIds.includes(roleId)
        ? currentRoleIds.filter((currentRoleId) => currentRoleId !== roleId)
        : [...currentRoleIds, roleId],
    );
  }

  function handleStart() {
    if (!canStart) {
      return;
    }

    Keyboard.dismiss();

    if (isEditing && editingGame) {
      setGameScript(editingGame.id, selectedScriptForGame);
      router.back();
      return;
    }

    const game = createGame({
      playerNames: players.map((player) => player.name),
      script: selectedScriptForGame,
    });
    router.replace({ pathname: '/game/[id]', params: { id: game.id } });
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: isEditing
            ? () => <CreateHeaderDoneButton canStart={canStart} onPress={handleStart} />
            : undefined,
          title: isEditing ? 'Edit Players' : 'New Game',
        }}
      />
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <View style={{ gap: 14, padding: 20, paddingBottom: 12 }}>
          <View style={{ gap: 6 }}>
            <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>
              Seat the circle
            </Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 15, lineHeight: 22 }}>
              Add players from the player on the left then clockwise.
            </Text>
          </View>

          <GameScriptPicker
            onBrowse={() =>
              router.push({
                pathname: '/scripts',
                params:
                  isEditing && editingGame
                    ? { gameId: editingGame.id, selectForGame: 'true' }
                    : { selectForGame: 'true' },
              })
            }
            onSelect={setDraftSelectedScriptId}
            scripts={availableScripts}
            selectedScriptId={selectedScriptId}
          />

          <TravelerRolePicker
            onToggleRole={handleToggleTravelerRole}
            roles={travelerRoles}
            selectedRoleIds={selectedTravelerRoleIds}
            selectedScriptName={selectedScript?.name}
          />

          <View style={{ gap: 8 }}>
            <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
              Player name
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                enterKeyHint="done"
                ref={inputRef}
                onBlur={() => setNameFocused(false)}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onSubmitEditing={handleAddPlayer}
                returnKeyType="done"
                submitBehavior="submit"
                value={name}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: duplicateName ? colors.danger : colors.border,
                  borderRadius: 8,
                  borderWidth: 1,
                  color: colors.text,
                  flex: 1,
                  fontSize: 18,
                  minHeight: 52,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              />
              <Pressable
                accessibilityRole="button"
                disabled={!canAddPlayer}
                onPress={handleAddPlayer}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: !canAddPlayer
                    ? colors.disabled
                    : pressed
                      ? colors.surfacePressed
                      : colors.surfaceRaised,
                  borderColor: colors.border,
                  borderRadius: 8,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: 7,
                  justifyContent: 'center',
                  minHeight: 52,
                  paddingHorizontal: 12,
                })}
              >
                <Plus
                  color={canAddPlayer ? colors.text : colors.onDisabled}
                  size={17}
                  strokeWidth={2.7}
                />
                <Text
                  style={{
                    color: canAddPlayer ? colors.text : colors.onDisabled,
                    fontWeight: '800',
                  }}
                >
                  Add
                </Text>
              </Pressable>
            </View>
          </View>

          {nameFocused ? (
            <FriendSuggestions friends={suggestedFriends} onSelectFriend={handleSelectFriend} />
          ) : null}

          {!isEditing ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                accessibilityRole="button"
                disabled={!canStart}
                onPress={handleStart}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: !canStart
                    ? colors.disabled
                    : pressed
                      ? colors.surfacePressed
                      : colors.primary,
                  borderRadius: 8,
                  flex: 1,
                  flexDirection: 'row',
                  gap: 7,
                  justifyContent: 'center',
                  minHeight: 48,
                  paddingVertical: 13,
                })}
              >
                <Play
                  color={canStart ? colors.onPrimary : colors.onDisabled}
                  size={16}
                  strokeWidth={2.7}
                />
                <Text
                  style={{
                    color: canStart ? colors.onPrimary : colors.onDisabled,
                    fontWeight: '800',
                  }}
                >
                  Start
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Text
            selectable
            style={{
              color: duplicateName ? colors.danger : colors.textMuted,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {helperText}
          </Text>
        </View>

        <View style={{ gap: 6, paddingHorizontal: 20 }}>
          <FixedPlayerRow name={fixedPlayerName} />
        </View>

        {players.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 8,
              borderWidth: 1,
              gap: 8,
              marginHorizontal: 20,
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
        ) : (
          <DraggableFlatList
            activationDistance={8}
            containerStyle={{ backgroundColor: colors.background, flex: 1 }}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            extraData={playerOrderKey}
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={{ gap: 6, padding: 20, paddingTop: 0, paddingBottom: 40 }}
            data={players}
            keyExtractor={(item) => item.id}
            onDragEnd={({ data }) => {
              if (!isEditing) {
                setDraftPlayers(data);
              }
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
          />
        )}
      </View>
    </>
  );
}

function createDraftId() {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
