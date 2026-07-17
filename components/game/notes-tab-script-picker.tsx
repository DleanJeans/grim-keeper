import { router } from 'expo-router';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { GameScriptPicker } from '@/components/scripts/game-script-picker';
import { useGameStore } from '@/store/game-store';

export function NotesTabScriptPicker() {
  const { game } = useGameRouteContext();
  const scripts = useGameStore((state) => state.scripts);
  const setGameScript = useGameStore((state) => state.setGameScript);

  if (game.script) {
    return null;
  }

  return (
    <GameScriptPicker
      onBrowse={() =>
        router.push({
          pathname: '/scripts',
          params: { gameId: game.id, selectForGame: 'true' },
        })
      }
      onSelect={(scriptId) =>
        setGameScript(
          game.id,
          scripts.find((script) => script.id === scriptId),
        )
      }
      scripts={scripts}
      selectedScriptId={null}
    />
  );
}
