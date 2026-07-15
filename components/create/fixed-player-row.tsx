import { PlayerRow } from '@/components/create/player-row';

export function FixedPlayerRow({ name }: { name: string }) {
  return <PlayerRow index={0} isEditing={false} isFixed item={{ id: 'app-user', name }} />;
}
