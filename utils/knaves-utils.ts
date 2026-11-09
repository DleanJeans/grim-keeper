import type { Game, GamePhase, Player, RoleInfoEntry } from '@/types/game';
import { getEventPhaseIndex } from '@/utils/game-phase-utils';
import {
  isClaimerRoleInfo,
  ROLE_INFO_STORYTELLER_KEY,
  type RoleInfoClaimer,
} from '@/utils/role-info-utils';

/** Whether the info came from the Storyteller thought to lie, or from the other one. */
export type KnavesVerdict = 'lie' | 'true';

export type KnavesGuess = Pick<Game, 'knavesLiarId' | 'knavesSwitchDay'>;

/** Whether a Loric id is the Knaves ("There are 2 Storytellers: one lies & one tells the truth"). */
export function isKnavesRoleId(roleId: string) {
  return roleId.toLocaleLowerCase().replace(/[^a-z]/g, '') === 'knaves';
}

export function hasKnaves(loricIds: readonly string[] | undefined) {
  return (loricIds ?? []).some(isKnavesRoleId);
}

/**
 * The Storytellers info can come from, when the Knaves are in play and the game has at least two
 * Storytellers; empty otherwise, so nothing Knaves-related shows.
 */
export function getKnavesStorytellers(game: Pick<Game, 'lorics' | 'players'>): Player[] {
  if (!hasKnaves(game.lorics)) return [];

  const storytellers = game.players.filter((player) => player.isStoryteller);
  return storytellers.length >= 2 ? storytellers : [];
}

/** The Storyteller after the given one, then none, then the first again. */
export function getNextStorytellerId(storytellers: Player[], currentId: string | undefined) {
  const index = storytellers.findIndex((storyteller) => storyteller.id === currentId);
  return index < 0 ? storytellers[0]?.id : storytellers[index + 1]?.id;
}

/**
 * The Storyteller thought to lie at the given phase. They may switch once, at dusk: info from the
 * night after that day on comes from the other Storyteller's lies.
 */
export function getKnavesLiarId(
  guess: KnavesGuess,
  storytellers: Player[],
  day: number,
): string | undefined {
  const { knavesLiarId, knavesSwitchDay } = guess;
  // A Storyteller taken out of the game no longer counts as the liar.
  if (!storytellers.some((storyteller) => storyteller.id === knavesLiarId)) return undefined;
  if (knavesSwitchDay === undefined || day <= knavesSwitchDay) return knavesLiarId;

  // Night N comes before Day N, so the night after the switch day's dusk is the next day's.
  return storytellers.find((storyteller) => storyteller.id !== knavesLiarId)?.id;
}

export function getKnavesVerdict(
  guess: KnavesGuess,
  storytellers: Player[],
  storytellerId: string | undefined,
  day: number,
): KnavesVerdict | undefined {
  if (!storytellerId) return undefined;

  const liarId = getKnavesLiarId(guess, storytellers, day);
  if (!liarId) return undefined;
  return storytellerId === liarId ? 'lie' : 'true';
}

/**
 * The Storyteller a claimer last got this character's info from, at or before the given phase, so
 * new info starts with the Storyteller they usually pick.
 */
export function getLastStorytellerId(
  roleInfos: RoleInfoEntry[],
  roleId: string,
  day: number,
  phase: GamePhase,
  claimer?: RoleInfoClaimer,
) {
  const phaseIndex = getEventPhaseIndex(day, phase);
  return roleInfos
    .filter(
      (entry) =>
        entry.roleId === roleId &&
        entry.values[ROLE_INFO_STORYTELLER_KEY] !== undefined &&
        isClaimerRoleInfo(entry, claimer) &&
        getEventPhaseIndex(entry.day, entry.phase) <= phaseIndex,
    )
    .sort(
      (first, second) =>
        getEventPhaseIndex(second.day, second.phase) - getEventPhaseIndex(first.day, first.phase),
    )[0]?.values[ROLE_INFO_STORYTELLER_KEY];
}
