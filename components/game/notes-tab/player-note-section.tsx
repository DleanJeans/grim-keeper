import { StyleSheet, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { PlayerNoteRow } from '@/components/game/notes-tab/player-note-row';
import type { Player } from '@/types/game';

export function PlayerNoteSection({ player }: { player: Player }) {
  const { activeDay, game, lastDayWithData } = useGameRouteContext();

  const lastDay = Math.max(lastDayWithData, activeDay);
  const noteByDay = new Map<number, string>();
  for (const entry of game.playerDayNotes ?? []) {
    if (entry.playerId === player.id) {
      noteByDay.set(entry.day, entry.text);
    }
  }
  const days = Array.from({ length: lastDay }, (_, i) => lastDay - i);

  if (lastDay === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      {days.map((day) => (
        <PlayerNoteRow key={day} day={day} player={player} text={noteByDay.get(day)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
});
