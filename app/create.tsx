import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Check, GripVertical, Play, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import { Keyboard, Pressable, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';

import { FriendSuggestions } from '@/components/friends/friend-suggestions';
import { GameScriptPicker } from '@/components/scripts/game-script-picker';
import { Text, TextInput } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { hasDuplicatePlayerName, normalizePlayerName } from '@/utils/conversation-utils';
import { getFriendSummaries } from '@/utils/friend-utils';

type DraftPlayer = {
  id: string;
  name: string;
};

type ParticipantKind = 'player' | 'traveler';

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
  const scripts = useGameStore((state) => state.scripts);
  const setGameScript = useGameStore((state) => state.setGameScript);
  const storedFriends = useGameStore((state) => state.friends);
  const inputRef = useRef<RNTextInput>(null);
  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [draftPlayers, setDraftPlayers] = useState<DraftPlayer[]>([]);
  const [draftTravelers, setDraftTravelers] = useState<DraftPlayer[]>([]);
  const [participantKind, setParticipantKind] = useState<ParticipantKind>('player');
  const [draftSelectedScriptId, setDraftSelectedScriptId] = useState<string | null>(
    scriptIdParam ?? null,
  );
  const editingGame = gameIdParam ? games.find((game) => game.id === gameIdParam) : undefined;
  const isEditing = Boolean(gameIdParam);
  const players = editingGame
    ? editingGame.players
        .filter((player) => !player.isAppUser && !player.isTraveler)
        .map(({ id, name }) => ({ id, name }))
    : draftPlayers;
  const travelers = editingGame
    ? editingGame.players
        .filter((player) => !player.isAppUser && player.isTraveler)
        .map(({ id, name }) => ({ id, name }))
    : draftTravelers;
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
  const selectedNames = useMemo(
    () => [
      fixedPlayerName,
      ...players.map((player) => player.name),
      ...travelers.map((traveler) => traveler.name),
    ],
    [fixedPlayerName, players, travelers],
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
    if (scriptIdParam) {
      setDraftSelectedScriptId(scriptIdParam);
    } else if (isEditing) {
      setDraftSelectedScriptId(editingGame?.script?.id ?? null);
    }
  }, [editingGame?.script?.id, isEditing, scriptIdParam]);

  const helperText = useMemo(() => {
    if (duplicateName) {
      return 'That player already exists.';
    }

    if (players.length < 1) {
      return 'Add at least 1 other player.';
    }

    if (participantKind === 'traveler') {
      return 'Travelers are added after the main player seats.';
    }

    return isEditing
      ? 'Add or remove players, choose a script, then tap Done.'
      : 'Long press a player to drag them into seat order.';
  }, [duplicateName, isEditing, participantKind, players.length]);

  function handleAddParticipant() {
    if (!canAddPlayer) {
      return;
    }

    const isTraveler = participantKind === 'traveler';
    if (isEditing && editingGame) {
      addPlayer(editingGame.id, normalizedName, isTraveler);
    } else if (isTraveler) {
      setDraftTravelers((currentTravelers) => [
        ...currentTravelers,
        { id: createDraftId(), name: normalizedName },
      ]);
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

    const isTraveler = participantKind === 'traveler';
    if (isEditing && editingGame) {
      addPlayer(editingGame.id, normalizedFriendName, isTraveler);
    } else if (isTraveler) {
      setDraftTravelers((currentTravelers) => [
        ...currentTravelers,
        { id: createDraftId(), name: normalizedFriendName },
      ]);
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
    setDraftTravelers((currentTravelers) =>
      currentTravelers.filter((traveler) => traveler.id !== playerId),
    );
  }

  function handleStart() {
    if (!canStart) {
      return;
    }

    Keyboard.dismiss();

    if (isEditing && editingGame) {
      setGameScript(editingGame.id, selectedScript);
      router.back();
      return;
    }

    const game = createGame({
      playerNames: players.map((player) => player.name),
      script: selectedScript,
      travelerNames: travelers.map((traveler) => traveler.name),
    });
    router.replace({ pathname: '/game/[id]', params: { id: game.id } });
  }

  return (
    <>
      <Stack.Screen
        options={{ headerRight: () => null, title: isEditing ? 'Edit Players' : 'New Game' }}
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

          <View style={{ gap: 8 }}>
            <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
              Add participant as
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <ParticipantKindButton
                kind="player"
                onPress={() => setParticipantKind('player')}
                selected={participantKind === 'player'}
              />
              <ParticipantKindButton
                kind="traveler"
                onPress={() => setParticipantKind('traveler')}
                selected={participantKind === 'traveler'}
              />
            </View>
            <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
              {participantKind === 'traveler' ? 'Traveler name' : 'Player name'}
            </Text>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              enterKeyHint="done"
              ref={inputRef}
              onBlur={() => setNameFocused(false)}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onSubmitEditing={handleAddParticipant}
              returnKeyType="done"
              submitBehavior="submit"
              value={name}
              style={{
                backgroundColor: colors.surface,
                borderColor: duplicateName ? colors.danger : colors.border,
                borderRadius: 8,
                borderWidth: 1,
                color: colors.text,
                fontSize: 18,
                minHeight: 52,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            />
          </View>

          {nameFocused ? (
            <FriendSuggestions friends={suggestedFriends} onSelectFriend={handleSelectFriend} />
          ) : null}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              disabled={!canAddPlayer}
              onPress={handleAddParticipant}
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
                flex: 1,
                flexDirection: 'row',
                gap: 7,
                justifyContent: 'center',
                minHeight: 48,
                paddingVertical: 13,
              })}
            >
              <Plus
                color={canAddPlayer ? colors.text : colors.onDisabled}
                size={17}
                strokeWidth={2.7}
              />
              <Text
                style={{ color: canAddPlayer ? colors.text : colors.onDisabled, fontWeight: '800' }}
              >
                {participantKind === 'traveler' ? 'Add traveler' : 'Add'}
              </Text>
            </Pressable>

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
              {isEditing ? (
                <Check
                  color={canStart ? colors.onPrimary : colors.onDisabled}
                  size={16}
                  strokeWidth={2.7}
                />
              ) : (
                <Play
                  color={canStart ? colors.onPrimary : colors.onDisabled}
                  size={16}
                  strokeWidth={2.7}
                />
              )}
              <Text
                style={{
                  color: canStart ? colors.onPrimary : colors.onDisabled,
                  fontWeight: '800',
                }}
              >
                {isEditing ? 'Done' : 'Start'}
              </Text>
            </Pressable>
          </View>

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

        <View style={{ gap: 10, paddingHorizontal: 20, paddingTop: 4 }}>
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
            contentContainerStyle={{ gap: 10, padding: 20, paddingTop: 4, paddingBottom: 40 }}
            data={players}
            keyExtractor={(item) => item.id}
            ListFooterComponent={
              travelers.length > 0 ? (
                <TravelersSection onRemove={handleRemovePlayer} travelers={travelers} />
              ) : null
            }
            onDragEnd={({ data }) => {
              if (!isEditing) {
                setDraftPlayers(data);
              }
            }}
            renderItem={(params) => (
              <PlayerRow
                {...params}
                isEditing={isEditing}
                index={(playerIndexes.get(params.item.id) ?? params.getIndex() ?? 0) + 1}
                onRemove={handleRemovePlayer}
              />
            )}
          />
        )}
        {players.length === 0 ? (
          <TravelersSection onRemove={handleRemovePlayer} travelers={travelers} />
        ) : null}
      </View>
    </>
  );
}

function FixedPlayerRow({ name }: { name: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceRaised,
        borderColor: colors.primary,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 12,
        minHeight: 54,
        padding: 16,
      }}
    >
      <Text
        selectable
        style={{ color: colors.textMuted, fontVariant: ['tabular-nums'], width: 24 }}
      >
        1
      </Text>
      <Text selectable style={{ color: colors.text, flex: 1, fontSize: 17, fontWeight: '800' }}>
        {name}
      </Text>
      <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '800' }}>
        You
      </Text>
    </View>
  );
}

function ParticipantKindButton({
  kind,
  onPress,
  selected,
}: {
  kind: ParticipantKind;
  onPress: () => void;
  selected: boolean;
}) {
  const label = kind === 'traveler' ? 'Traveler' : 'Player';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed || selected ? colors.surfacePressed : colors.surface,
        borderColor: selected ? colors.primary : colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 11,
      })}
    >
      <Text style={{ color: selected ? colors.primary : colors.text, fontWeight: '800' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function TravelersSection({
  onRemove,
  travelers,
}: {
  onRemove: (playerId: string) => void;
  travelers: DraftPlayer[];
}) {
  if (travelers.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: 8, paddingTop: 16 }}>
      <View style={{ gap: 2 }}>
        <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
          Travelers
        </Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
          Travelers are added after the main player seats.
        </Text>
      </View>
      {travelers.map((traveler) => (
        <TravelerRow key={traveler.id} onRemove={onRemove} traveler={traveler} />
      ))}
    </View>
  );
}

function TravelerRow({
  onRemove,
  traveler,
}: {
  onRemove: (playerId: string) => void;
  traveler: DraftPlayer;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 12,
        minHeight: 54,
        padding: 16,
      }}
    >
      <Text selectable style={{ color: colors.text, flex: 1, fontSize: 17, fontWeight: '700' }}>
        {traveler.name}
      </Text>
      <Text selectable style={{ color: colors.primary, fontSize: 13, fontWeight: '800' }}>
        Traveler
      </Text>
      <Pressable
        accessibilityLabel={`Remove ${traveler.name}`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={() => onRemove(traveler.id)}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? colors.surfacePressed : 'transparent',
          borderRadius: 8,
          height: 30,
          justifyContent: 'center',
          width: 30,
        })}
      >
        <Trash2 color={colors.danger} size={17} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

function PlayerRow({
  drag,
  index,
  isActive,
  item,
  isEditing,
  onRemove,
}: RenderItemParams<DraftPlayer> & {
  index: number;
  isEditing: boolean;
  onRemove: (playerId: string) => void;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: isActive ? colors.surfacePressed : colors.surface,
        borderColor: isActive ? colors.primary : colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 12,
        minHeight: 54,
        padding: 16,
      }}
    >
      <Pressable
        accessibilityRole="button"
        onLongPress={isEditing ? undefined : drag}
        style={{ alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12 }}
      >
        <Text
          selectable
          style={{ color: colors.textMuted, fontVariant: ['tabular-nums'], width: 24 }}
        >
          {index + 1}
        </Text>
        <Text selectable style={{ color: colors.text, flex: 1, fontSize: 17, fontWeight: '700' }}>
          {item.name}
        </Text>
        {isEditing ? null : <GripVertical color={colors.textSubtle} size={18} strokeWidth={2.5} />}
      </Pressable>
      <Pressable
        accessibilityLabel={`Remove ${item.name}`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={() => onRemove(item.id)}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? colors.surfacePressed : 'transparent',
          borderRadius: 8,
          height: 30,
          justifyContent: 'center',
          width: 30,
        })}
      >
        <Trash2 color={colors.danger} size={17} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

function createDraftId() {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
