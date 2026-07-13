export { ExecuteButton } from './execute-button';
export { NightKillButton } from './night-kill-button';
export { UndoDeathButton } from './undo-death-button';
export { ReviveButton } from './revive-button';

import { View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { innerActionRow } from '@/components/game/styles';

import { ExecuteButton } from './execute-button';
import { NightKillButton } from './night-kill-button';
import { ReviveButton } from './revive-button';
import { UndoDeathButton } from './undo-death-button';

/**
 * Composed death-action panel for the Deaths tab — Execute / Night Kill /
 * Undo Death in one row, Revive in a second row. Operates on the player
 * currently focused in the route context.
 */
export function FocusedDeathActionPanel() {
  const {
    focusedPlayer,
    focusedPlayerIsDead,
    handleReviveFocusedPlayer: onRevive,
    handleSetFocusedPlayerDeath: onSetDeath,
    handleUndoFocusedPlayerDeath: onUndoDeath,
  } = useGameRouteContext();

  if (!focusedPlayer) {
    return null;
  }

  const deathKind = focusedPlayer.death?.kind;
  const canExecute = !(focusedPlayerIsDead && deathKind === 'execution');
  const canNightKill = !(focusedPlayerIsDead && deathKind === 'night');

  return (
    <View style={{ alignSelf: 'stretch', gap: 10, marginBottom: 12 }}>
      <View style={innerActionRow}>
        <ExecuteButton
          disabled={!canExecute}
          onPress={() => onSetDeath('execution')}
          playerName={focusedPlayer.name}
        />
        <NightKillButton
          disabled={!canNightKill}
          onPress={() => onSetDeath('night')}
          playerName={focusedPlayer.name}
        />
        <UndoDeathButton
          disabled={!focusedPlayerIsDead}
          onPress={onUndoDeath}
          playerName={focusedPlayer.name}
        />
      </View>
      <View style={innerActionRow}>
        <ReviveButton
          disabled={!focusedPlayerIsDead}
          onPress={onRevive}
          playerName={focusedPlayer.name}
        />
      </View>
    </View>
  );
}
