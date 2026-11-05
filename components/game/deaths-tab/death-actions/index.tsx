export { ExecuteButton } from './execute-button';
export { KillButton } from './kill-button';
export { ReviveButton } from './revive-button';
export { UndoDeathButton } from './undo-death-button';

import { StyleSheet, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import type { StoredScript } from '@/types/game';
import { KillAttributionPanel } from './kill-attribution-panel';

const DAY_KILL_ROLE_IDS = new Set([
  'bigwig',
  'slayer',
  'harpy',
  'witch',
  'cerenovus',
  'psychopath',
  'golem',
  'moonchild',
  'tinker',
  'yaggababble',
]);

/** True when the script has a character that can kill during the day, such as the Slayer. */
export function canKillDuringDay(script: StoredScript | undefined) {
  return script?.roles.some((role) => DAY_KILL_ROLE_IDS.has(role.id)) ?? false;
}

/**
 * Kill attribution panel for the Deaths tab, opened by Kill in the player dock. Operates on
 * the player currently focused in the route context.
 */
export function FocusedDeathActionPanel() {
  const {
    activePhase,
    focusedPlayer,
    focusedPlayerIsDead,
    game,
    handleSetFocusedPlayerDeath: onSetDeath,
    killAttributionOpen,
    setKillAttributionOpen,
  } = useGameRouteContext();

  if (
    !focusedPlayer ||
    focusedPlayerIsDead ||
    !killAttributionOpen ||
    (activePhase === 'day' && !canKillDuringDay(game.script))
  ) {
    return null;
  }

  return (
    <View style={styles.container}>
      <KillAttributionPanel
        onCancel={() => setKillAttributionOpen(false)}
        onConfirm={(attribution) => {
          onSetDeath('night', attribution);
          setKillAttributionOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
});
