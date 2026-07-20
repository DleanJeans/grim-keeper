import { FocusedDeathActionPanel } from '@/components/game/deaths-tab/death-actions';
import { DeathLog } from '@/components/game/deaths-tab/death-log';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { InteractionsTab } from '@/components/game/interactions-tab/interactions-tab';
import { TrackingConfirmActions } from '@/components/game/interactions-tab/tracking-confirm-actions';
import { NominationList } from '@/components/game/noms-tab/nomination-list';
import { VoteConfirmActions } from '@/components/game/noms-tab/vote-confirm-actions';
import { NotesTab } from '@/components/game/notes-tab/notes-tab';

export function ActiveGameTab() {
  const { activeTab, game, trackingMode, votingNominationId } = useGameRouteContext();

  if (activeTab === 'nominations') {
    return (
      <>
        {votingNominationId ? (
          <VoteConfirmActions />
        ) : trackingMode ? (
          <TrackingConfirmActions />
        ) : null}
        <NominationList />
      </>
    );
  }

  if (activeTab === 'deaths') {
    return (
      <>
        <FocusedDeathActionPanel />
        <DeathLog activeDay={game.activeDay} players={game.players} script={game.script} />
      </>
    );
  }

  if (activeTab === 'notes') return <NotesTab />;

  return <InteractionsTab />;
}
