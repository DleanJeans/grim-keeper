import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { FriendGamesList } from '@/components/friends/friend-games-list';
import {
  FriendNameEditToggle,
  FriendNameInputRow,
  FriendNameSaveButton,
} from '@/components/friends/friend-name-editor';
import { SavedNotes } from '@/components/saved-notes';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { getNotesForPlayer, useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { getFriendSummaries } from '@/utils/friend-utils';

export default function FriendDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appUserName = useGameStore((state) => state.appUserName);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const scripts = useGameStore((state) => state.scripts);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const renameFriend = useGameStore((state) => state.renameFriend);
  const friends = useMemo(
    () => getFriendSummaries(games, storedFriends, appUserName),
    [appUserName, games, storedFriends],
  );
  const friend = friends.find((candidate) => candidate.id === id);
  const notes = friend ? getNotesForPlayer(savedNotes, friend.name) : [];
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

  if (!friend) {
    return (
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 }}>
        <Stack.Screen options={{ title: 'Friend not found' }} />
        <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
          Friend not found.
        </Text>
      </View>
    );
  }

  const handleToggleEditing = () => {
    if (editing) {
      setEditing(false);
      return;
    }
    setDraftName(friend.name);
    setEditing(true);
  };

  const handleSave = () => {
    const normalizedName = normalizePlayerName(draftName);
    if (normalizedName && normalizedName !== friend.name) {
      const renamedFriendId = renameFriend(friend.id, friend.name, normalizedName);
      if (renamedFriendId) {
        router.replace({
          pathname: '/friends/[id]',
          params: { id: renamedFriendId },
        });
      }
    }
    setEditing(false);
  };

  const draftNormalized = normalizePlayerName(draftName);
  const duplicateName =
    editing &&
    (normalizePlayerName(appUserName).toLocaleLowerCase() === draftNormalized.toLocaleLowerCase() ||
      friends.some(
        (candidate) =>
          candidate.id !== friend.id &&
          normalizePlayerName(candidate.name).toLocaleLowerCase() ===
            draftNormalized.toLocaleLowerCase(),
      ));
  const canSave = editing && draftNormalized.length > 0 && !duplicateName;

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <TitleHeader
              center={
                editing ? (
                  <FriendNameInputRow
                    duplicateName={!!duplicateName}
                    name={draftName}
                    onChangeName={setDraftName}
                    onSubmit={handleSave}
                  />
                ) : undefined
              }
              right={
                editing ? (
                  <FriendNameSaveButton canSave={!!canSave} onPress={handleSave} />
                ) : (
                  <FriendNameEditToggle
                    editing={false}
                    friendName={friend.name}
                    onToggleEditing={handleToggleEditing}
                  />
                )
              }
              title={friend.name}
            />
          ),
          title: friend.name,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
        style={{ backgroundColor: colors.background, flex: 1 }}
      >
        {editing && duplicateName ? (
          <Text selectable style={{ color: colors.danger, fontSize: 14, textAlign: 'center' }}>
            That name is already in use.
          </Text>
        ) : null}

        {notes.length ? (
          <View style={{ gap: 6 }}>
            <Text
              selectable
              style={{
                color: colors.textMuted,
                fontSize: 12,
                fontWeight: '900',
                letterSpacing: 0.5,
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              Notes
            </Text>
            <SavedNotes
              games={games}
              mode="note"
              notes={notes}
              roles={roleCatalog}
              scripts={scripts}
            />
          </View>
        ) : (
          <Text selectable style={{ color: colors.textMuted, fontSize: 15, textAlign: 'center' }}>
            No saved notes yet.
          </Text>
        )}

        <View style={{ gap: 6 }}>
          <Text
            selectable
            style={{
              color: colors.textMuted,
              fontSize: 12,
              fontWeight: '900',
              letterSpacing: 0.5,
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
          >
            {friend.gamesPlayed} {friend.gamesPlayed === 1 ? 'game played' : 'games played'}
          </Text>
          <FriendGamesList
            friendName={friend.name}
            games={games}
            roleCatalog={roleCatalog}
            scripts={scripts}
          />
        </View>
      </ScrollView>
    </>
  );
}
