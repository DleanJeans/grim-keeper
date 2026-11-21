import { colors } from '@/theme/colors';
import type { Player, PlayerStatus } from '@/types/game';

export type PlayerStatusKind = {
  color: string;
  /** One or two letters shown on the map token. */
  initials: string;
  id: string;
  label: string;
};

export const PLAYER_STATUS_KINDS: PlayerStatusKind[] = [
  { color: colors.playerStatus.drunk, id: 'drunk', initials: 'D', label: 'Drunk' },
  { color: colors.playerStatus.poisoned, id: 'poisoned', initials: 'P', label: 'Poisoned' },
  { color: colors.playerStatus.protected, id: 'protected', initials: 'Pr', label: 'Protected' },
  { color: colors.playerStatus.mad, id: 'mad', initials: 'M', label: 'Mad' },
  { color: colors.playerStatus.marked, id: 'marked', initials: 'Mk', label: 'Marked' },
  {
    color: colors.playerStatus.redHerring,
    id: 'red-herring',
    initials: 'RH',
    label: 'Red herring',
  },
];

export function getPlayerStatusKind(id: string) {
  return PLAYER_STATUS_KINDS.find((kind) => kind.id === id);
}

export function hasPlayerStatus(player: Pick<Player, 'statuses'>, kindId: string) {
  return !!player.statuses?.some((status) => status.kind === kindId);
}

/** Statuses of a player in the order of `PLAYER_STATUS_KINDS`, leaving out unknown kinds. */
export function getPlayerStatusKinds(statuses: PlayerStatus[] | undefined) {
  if (!statuses?.length) return [];
  return PLAYER_STATUS_KINDS.filter((kind) => statuses.some((status) => status.kind === kind.id));
}
