import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ResponsiveContent } from '@/components/responsive-content';
import { SearchBox } from '@/components/search-box';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { StartingNight } from '@/types/game';
import { getPhaseLabel } from '@/utils/game-phase-utils';
import { type GameNoteHit, type SavedNoteHit, searchNotes } from '@/utils/note-search-utils';

export default function SearchNotesScreen() {
  const savedNotes = useGameStore((state) => state.savedNotes);
  const games = useGameStore((state) => state.games);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const startingNight = useGameStore((state) => state.defaultStartingNight);
  const [query, setQuery] = useState('');
  const gameIds = useMemo(() => new Set(games.map((game) => game.id)), [games]);
  const results = useMemo(
    () => searchNotes(query, savedNotes, games, roleCatalog),
    [games, query, roleCatalog, savedNotes],
  );
  const hasQuery = query.trim().length > 0;
  const noResults = results.savedNotes.length === 0 && results.gameNotes.length === 0;

  return (
    <>
      <Stack.Screen
        options={{
          header: () => <TitleHeader title="Search notes" />,
          title: 'Search notes',
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        style={styles.screen}
      >
        <ResponsiveContent style={styles.content}>
          <SearchBox label="Search notes" onChangeText={setQuery} value={query} />
          {!hasQuery ? (
            <Text style={styles.hint}>
              Searches saved notes, role notes and notes from every game by text, player or
              character.
            </Text>
          ) : noResults ? (
            <Text style={styles.hint}>No notes match “{query.trim()}”.</Text>
          ) : null}

          {results.savedNotes.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved notes</Text>
              {results.savedNotes.map((note) => (
                <SavedNoteResult
                  key={note.id}
                  note={note}
                  onOpenGame={gameIds.has(note.gameId) ? openGame : undefined}
                />
              ))}
            </View>
          ) : null}

          {results.gameNotes.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Game notes</Text>
              {results.gameNotes.map((note) => (
                <GameNoteResult
                  key={note.id}
                  note={note}
                  onOpenGame={openGame}
                  startingNight={startingNight}
                />
              ))}
            </View>
          ) : null}
        </ResponsiveContent>
      </ScrollView>
    </>
  );
}

function openGame(gameId: string) {
  router.push({ params: { id: gameId }, pathname: '/game/[id]' });
}

const styles = StyleSheet.create({
  content: { gap: 18, padding: 20 },
  hint: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  noteText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  result: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  resultPressed: { backgroundColor: colors.surfacePressed },
  screen: { backgroundColor: colors.background, flex: 1 },
  scrollContent: { paddingBottom: 40 },
  section: { gap: 8 },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

function SavedNoteResult({
  note,
  onOpenGame,
}: {
  note: SavedNoteHit;
  onOpenGame?: (gameId: string) => void;
}) {
  const meta = [note.playerName || 'You', ...note.roleNames, note.scriptName]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      accessibilityHint={onOpenGame ? 'Opens the game this note came from' : undefined}
      accessibilityRole={onOpenGame ? 'button' : undefined}
      disabled={!onOpenGame}
      onPress={() => onOpenGame?.(note.gameId)}
      style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}
    >
      <Text style={styles.meta}>{meta}</Text>
      <Text selectable style={styles.noteText}>
        {note.text}
      </Text>
    </Pressable>
  );
}

function GameNoteResult({
  note,
  onOpenGame,
  startingNight,
}: {
  note: GameNoteHit;
  onOpenGame: (gameId: string) => void;
  startingNight: StartingNight;
}) {
  const game = note.scriptName || formatDate(note.gameCreatedAt);
  const phase = getPhaseLabel({ activeDay: note.day, activePhase: note.phase }, startingNight);
  return (
    <Pressable
      accessibilityHint="Opens this game"
      accessibilityRole="button"
      onPress={() => onOpenGame(note.gameId)}
      style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}
    >
      <Text style={styles.meta}>{`${note.playerName} · ${phase} · ${game}`}</Text>
      <Text selectable style={styles.noteText}>
        {note.text}
      </Text>
    </Pressable>
  );
}

function formatDate(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(createdAt));
}
