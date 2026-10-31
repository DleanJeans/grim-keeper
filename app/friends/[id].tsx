import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DjSongSection } from '@/components/dj/dj-song-section';
import { FriendGamesList } from '@/components/friends/friend-games-list';
import { FriendNameEditToggle } from '@/components/friends/friend-name-edit-toggle';
import { FriendNameInputRow } from '@/components/friends/friend-name-input-row';
import { FriendNameSaveButton } from '@/components/friends/friend-name-save-button';
import { GameStatsCards } from '@/components/game-stats-cards';
import { NotFoundScreen } from '@/components/not-found-screen';
import { ResponsiveContent } from '@/components/responsive-content';
import { SavedNotes } from '@/components/saved-notes';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { ViewAllStatsButton } from '@/components/view-all-stats-button';
import { useDjStore } from '@/store/dj-store';
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
  const remapDjFriendTarget = useDjStore((state) => state.remapFriendTarget);
  const djEnabled = useDjStore((state) => state.enabled);
  const friends = useMemo(
    () => getFriendSummaries(games, storedFriends, appUserName),
    [appUserName, games, storedFriends],
  );
  const friend = friends.find((candidate) => candidate.id === id);
  const notes = friend ? getNotesForPlayer(savedNotes, friend.name) : [];
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

  if (!friend) {
    return <NotFoundScreen message="Friend not found." title="Friend not found" />;
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
        remapDjFriendTarget(friend.id, renamedFriendId);
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
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        <ResponsiveContent style={styles.content}>
          {editing && duplicateName ? (
            <Text selectable style={styles.duplicateName}>
              That name is already in use.
            </Text>
          ) : null}

          <GameStatsCards games={games} playerId={friend.id} />

          {djEnabled ? (
            <DjSongSection editable target={{ id: friend.id, type: 'friend' }} title="DJ songs" />
          ) : null}

          {notes.length ? (
            <View style={styles.notesSection}>
              <Text selectable style={styles.notesLabel}>
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
            <Text selectable style={styles.emptyNotes}>
              No saved notes yet.
            </Text>
          )}

          <View style={styles.gamesSection}>
            <View style={styles.gamesHeader}>
              <Text selectable style={styles.sectionLabel}>
                {friend.gamesPlayed} {friend.gamesPlayed === 1 ? 'game played' : 'games played'}
              </Text>
              <ViewAllStatsButton friendId={friend.id} />
            </View>
            <FriendGamesList
              friendName={friend.name}
              games={games}
              roleCatalog={roleCatalog}
              scripts={scripts}
            />
          </View>
        </ResponsiveContent>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    padding: 20,
  },
  duplicateName: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyNotes: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  gamesHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  gamesSection: {
    gap: 6,
  },
  notesLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  notesSection: {
    gap: 6,
  },
  scroll: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionLabel: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
