import { FocusedDeathActionPanel } from '@/components/game/deaths-tab/death-actions';
import { DeathLog } from '@/components/game/deaths-tab/death-log';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { InteractionsTab } from '@/components/game/interactions-tab/interactions-tab';
import { LikelyVoters } from '@/components/game/noms-tab/likely-voters';
import { NominationList } from '@/components/game/noms-tab/nomination-list';
import { NotesTab } from '@/components/game/notes-tab/notes-tab';

export function ActiveGameTab() {
  const { activeTab, game, startingNight, votingNominationId } = useGameRouteContext();

  if (activeTab === 'nominations') {
    return (
      <>
        {/* Cancel / Confirm for a nomination sit in the player dock. */}
        {votingNominationId ? <LikelyVoters /> : null}
        <NominationList />
      </>
    );
  }

  if (activeTab === 'deaths') {
    return (
      <>
        <FocusedDeathActionPanel />
        <DeathLog
          activeDay={game.activeDay}
          activePhase={game.activePhase ?? 'day'}
          players={game.players}
          script={game.script}
          startingNight={startingNight}
        />
      </>
    );
  }

  if (activeTab === 'notes') return <NotesTab />;

  return <InteractionsTab />;
}
