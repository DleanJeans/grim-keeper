import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { ClaimNoteRow } from '@/components/game/notes-tab/claim-note-row';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getClaimNoteDrafts } from '@/utils/claim-note-utils';

/**
 * Once the game has a result, offers a note per claimer (what they claimed and what they really
 * were) to save for future games. Hidden while Show roles is off.
 */
export function ClaimNotesSection() {
  const { game, lastDayWithData, showRoles } = useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const [expanded, setExpanded] = useState(true);

  if (game.result === undefined || !showRoles) {
    return null;
  }

  const drafts = getClaimNoteDrafts(
    game,
    [...(game.script?.roles ?? []), ...roleCatalog],
    Math.max(lastDayWithData, game.activeDay),
    'day',
  );
  if (drafts.length === 0) {
    return null;
  }

  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityLabel={`Save claim notes, ${drafts.length} players`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <Chevron color={colors.noteDayHeader} size={16} strokeWidth={2.6} />
        <Text style={styles.title}>Save claim notes</Text>
      </Pressable>
      {expanded ? (
        <>
          <Text style={styles.hint}>
            Game over. Edit a note and save it to see it next time you play with them or these
            characters.
          </Text>
          {drafts.map((draft) => (
            <ClaimNoteRow
              day={game.activeDay}
              draft={draft}
              gameId={game.id}
              key={draft.playerId}
              scriptId={game.scriptId ?? game.script?.id}
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
