import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { PlayerNoteRow } from '@/components/game/notes-tab/player-note-row';
import type { Player, PlayerDayNoteEntry } from '@/types/game';
import {
  getEventPhaseIndex,
  getPhaseIndex,
  getPhasePositionAtIndex,
} from '@/utils/game-phase-utils';

export function PlayerNoteSection({ player }: { player: Player }) {
  const { activeDay, activePhase, game } = useGameRouteContext();

  const currentPhaseIndex = getPhaseIndex({ activeDay, activePhase });
  const notesByPhase = new Map<number, PlayerDayNoteEntry[]>();
  for (const entry of game.playerDayNotes ?? []) {
    if (entry.playerId === player.id) {
      notesByPhase.set(getEventPhaseIndex(entry.day, entry.phase ?? 'day'), entry.notes);
    }
  }
  const phasePositions = Array.from({ length: currentPhaseIndex + 1 }, (_, index) =>
    getPhasePositionAtIndex(currentPhaseIndex - index),
  );

  return (
    <View style={styles.section}>
      {phasePositions.map(({ activeDay: day, activePhase: phase }) => (
        <PlayerNoteRow
          day={day}
          key={`${day}-${phase}`}
          notes={notesByPhase.get(getEventPhaseIndex(day, phase))}
          phase={phase}
          player={player}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
});
