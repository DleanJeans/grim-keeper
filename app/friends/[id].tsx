import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { FriendNameEditor } from '@/components/friends/friend-name-editor';
import { SavedNotes } from '@/components/saved-notes';
import { Text } from '@/components/text';
import { getNotesForPlayer, useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { SavedNote } from '@/types/game';
import { getFriendSummaries } from '@/utils/friend-utils';

export default function FriendDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appUserName = useGameStore((state) => state.appUserName);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const scripts = useGameStore((state) => state.scripts);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const removeNoteFromFutureGames = useGameStore((state) => state.removeNoteFromFutureGames);
  const renameFriend = useGameStore((state) => state.renameFriend);
  const friends = useMemo(
    () => getFriendSummaries(games, storedFriends, appUserName),
    [appUserName, games, storedFriends],
  );
  const friend = friends.find((candidate) => candidate.id === id);
  const notes = friend ? getNotesForPlayer(savedNotes, friend.name) : [];

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

  const currentFriendName = friend.name;
  function handleDeleteNote(note: SavedNote) {
    Alert.alert('Delete note?', note.text, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          removeNoteFromFutureGames(currentFriendName, [], note.text, note.id),
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: friend.name }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
        style={{ backgroundColor: colors.background, flex: 1 }}
      >
        <View style={{ gap: 8 }}>
          <FriendNameEditor
            friend={friend}
            friends={friends}
            onSave={(name) => renameFriend(friend.id, friend.name, name)}
            reservedName={appUserName}
          />
          <Text selectable style={{ color: colors.textMuted, fontSize: 14 }}>
            {friend.gamesPlayed} {friend.gamesPlayed === 1 ? 'game played' : 'games played'}
          </Text>
        </View>

        {notes.length ? (
          <SavedNotes
            games={games}
            notes={notes}
            onDeleteNote={handleDeleteNote}
            roles={roleCatalog}
            scripts={scripts}
          />
        ) : (
          <Text selectable style={{ color: colors.textMuted, fontSize: 15 }}>
            No saved notes yet.
          </Text>
        )}
      </ScrollView>
    </>
  );
}
