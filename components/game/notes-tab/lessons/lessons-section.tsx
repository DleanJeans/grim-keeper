import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { ConfirmClaimsButton } from '@/components/game/notes-tab/confirm-claims-button';
import { LessonPlayerRow } from '@/components/game/notes-tab/lessons/lesson-player-row';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getLessonPlayers, getLessonsFromGame } from '@/utils/lesson-utils';

/**
 * Once the game has a result, lists every other player with a + button to write a lesson about
 * them for future games. Only what you type is saved.
 */
export function LessonsSection() {
  const { game, lastDayWithData, showRoles } = useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const [expanded, setExpanded] = useState(true);
  const [editingPlayerId, setEditingPlayerId] = useState<string>();

  if (game.result === undefined) {
    return null;
  }

  const lessonPlayers = getLessonPlayers(
    game,
    [...(game.script?.roles ?? []), ...roleCatalog],
    Math.max(lastDayWithData, game.activeDay),
    'day',
  );
  if (lessonPlayers.length === 0) {
    return null;
  }

  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityLabel="Lessons for next time"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <Chevron color={colors.noteDayHeader} size={16} strokeWidth={2.6} />
        <Text style={styles.title}>Lessons for next time</Text>
      </Pressable>
      {expanded ? (
        <>
          <Text style={styles.hint}>
            Game over. Write down anything worth remembering about a player. Only what you type is
            saved.
          </Text>
          <ConfirmClaimsButton />
          {lessonPlayers.map((lessonPlayer) => (
            <LessonPlayerRow
              day={game.activeDay}
              editing={editingPlayerId === lessonPlayer.playerId}
              gameId={game.id}
              key={lessonPlayer.playerId}
              lessons={getLessonsFromGame(savedNotes, lessonPlayer.playerName, game.id)}
              onClose={() => setEditingPlayerId(undefined)}
              onEdit={() => setEditingPlayerId(lessonPlayer.playerId)}
              player={lessonPlayer}
              scriptId={game.scriptId ?? game.script?.id}
              showRoles={showRoles}
            />
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', gap: 4, minHeight: 32 },
  headerPressed: { opacity: 0.65 },
  hint: { color: colors.gameTextMuted, fontSize: 13, lineHeight: 18 },
  section: { gap: 8 },
  title: {
    color: colors.noteDayHeader,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
