import { router } from 'expo-router';
import { GripVertical, Play, Plus } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import { Keyboard, Pressable, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';

import { FriendSuggestions } from '@/components/friend-suggestions';
import { Text, TextInput } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { hasDuplicatePlayerName, normalizePlayerName } from '@/utils/conversation-utils';
import { getFriendSummaries } from '@/utils/friend-utils';

type DraftPlayer = {
  id: string;
  name: string;
};

export default function CreateRoute() {
  const appUserName = useGameStore((state) => state.appUserName);
  const createGame = useGameStore((state) => state.createGame);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const inputRef = useRef<RNTextInput>(null);
  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [players, setPlayers] = useState<DraftPlayer[]>([]);
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
  const duplicateName = hasDuplicatePlayerName(
    [appUserName, ...players.map((player) => player.name)],
    name,
  );
  const canAddPlayer = normalizedName.length > 0 && !duplicateName;
  const canStart = players.length >= 1 && !(normalizedName.length > 0 && duplicateName);
  const suggestedFriends = useMemo(() => {
    const key = normalizedName.toLocaleLowerCase();
    const selectedNames = [appUserName, ...players.map((player) => player.name)];

    return friends
      .filter(
        (friend) =>
          !hasDuplicatePlayerName(selectedNames, friend.name) &&
          (!key || friend.name.toLocaleLowerCase().includes(key)),
      )
      .slice(0, 5);
  }, [appUserName, friends, normalizedName, players]);

  const helperText = useMemo(() => {
    if (duplicateName) {
      return 'That player already exists.';
    }

    if (players.length < 1) {
      return 'Add at least 1 other player.';
    }

    return 'Long press a player to drag them into seat order.';
  }, [duplicateName, players.length]);

  function handleAddPlayer() {
    if (!canAddPlayer) {
      return;
    }

    setPlayers((currentPlayers) => [
      ...currentPlayers,
      { id: createDraftId(), name: normalizedName },
    ]);
    setName('');
    setNameFocused(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSelectFriend(friendName: string) {
    const normalizedFriendName = normalizePlayerName(friendName);

    if (
      !normalizedFriendName ||
      hasDuplicatePlayerName(
        [appUserName, ...players.map((player) => player.name)],
        normalizedFriendName,
      )
    ) {
      return;
    }

    setPlayers((currentPlayers) => [
      ...currentPlayers,
      { id: createDraftId(), name: normalizedFriendName },
    ]);
    setName('');
    setNameFocused(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleStart() {
    if (!canStart) {
      return;
    }

    Keyboard.dismiss();
    const game = createGame({ playerNames: players.map((player) => player.name) });
    router.replace({ pathname: '/game/[id]', params: { id: game.id } });
  }

  return (
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

        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
            Player name
          </Text>
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
              Add
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
            <Play
              color={canStart ? colors.onPrimary : colors.onDisabled}
              size={16}
              strokeWidth={2.7}
            />
            <Text
              style={{ color: canStart ? colors.onPrimary : colors.onDisabled, fontWeight: '800' }}
            >
              Start
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
        <FixedPlayerRow name={appUserName} />
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
          onDragEnd={({ data }) => setPlayers(data)}
          renderItem={(params) => (
            <PlayerRow
              {...params}
              index={(playerIndexes.get(params.item.id) ?? params.getIndex() ?? 0) + 1}
            />
          )}
        />
      )}
    </View>
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

function PlayerRow({
  drag,
  index,
  isActive,
  item,
}: RenderItemParams<DraftPlayer> & { index: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      onLongPress={drag}
      style={{
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
      <Text
        selectable
        style={{ color: colors.textMuted, fontVariant: ['tabular-nums'], width: 24 }}
      >
        {index + 1}
      </Text>
      <Text selectable style={{ color: colors.text, flex: 1, fontSize: 17, fontWeight: '700' }}>
        {item.name}
      </Text>
      <GripVertical color={colors.textSubtle} size={18} strokeWidth={2.5} />
    </Pressable>
  );
}

function createDraftId() {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
