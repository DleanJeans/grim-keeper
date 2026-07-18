export { ExecuteButton } from './execute-button';
export { KillButton } from './kill-button';
export { ReviveButton } from './revive-button';
export { UndoDeathButton } from './undo-death-button';

import { useState } from 'react';
import { View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { innerActionRow } from '@/components/game/styles';
import { ExecuteButton } from './execute-button';
import { KillAttributionPanel } from './kill-attribution-panel';
import { KillButton } from './kill-button';
import { ReviveButton } from './revive-button';
import { UndoDeathButton } from './undo-death-button';

/**
 * Composed death-action panel for the Deaths tab — Execute / Kill /
 * Undo Death in one row, Revive in a second row. Operates on the player
 * currently focused in the route context.
 */
export function FocusedDeathActionPanel() {
  const [showKillAttribution, setShowKillAttribution] = useState(false);
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

  if (!focusedPlayerIsDead && showKillAttribution) {
    return (
      <KillAttributionPanel
        onCancel={() => setShowKillAttribution(false)}
        onConfirm={(attribution) => {
          onSetDeath('night', attribution);
          setShowKillAttribution(false);
        }}
      />
    );
  }

  const deathKind = focusedPlayer.death?.kind;

  return (
    <View style={{ alignSelf: 'stretch', gap: 10, marginBottom: 24 }}>
      {focusedPlayerIsDead ? (
        <View style={innerActionRow}>
          {deathKind === 'execution' ? (
            <ExecuteButton
              disabled
              onPress={() => onSetDeath('execution')}
              playerName={focusedPlayer.name}
            />
          ) : (
            <KillButton
              disabled
              onPress={() => onSetDeath('night')}
              playerName={focusedPlayer.name}
            />
          )}
          <UndoDeathButton onPress={onUndoDeath} playerName={focusedPlayer.name} />
        </View>
      ) : (
        <View style={innerActionRow}>
          <ExecuteButton onPress={() => onSetDeath('execution')} playerName={focusedPlayer.name} />
          <KillButton
            onPress={() => setShowKillAttribution(true)}
            playerName={focusedPlayer.name}
          />
        </View>
      )}
      {focusedPlayerIsDead && (
        <View style={innerActionRow}>
          <ReviveButton onPress={onRevive} playerName={focusedPlayer.name} />
        </View>
      )}
    </View>
  );
}
