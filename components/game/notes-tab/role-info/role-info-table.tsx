import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RoleInfoPickerDialog } from '@/components/game/notes-tab/role-info/role-info-picker-dialog';
import {
  type RoleInfoLine,
  RoleInfoRow,
} from '@/components/game/notes-tab/role-info/role-info-row';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { GamePhase, Player, Role, RoleInfoEntry, StartingNight } from '@/types/game';
import {
  type EvilInPlayTeam,
  getEvilInPlayRoleIds,
  getGameEvilInPlaySlots,
} from '@/utils/evil-in-play-utils';
import { getLatestPhaseWithData, getPhaseLabel } from '@/utils/game-phase-utils';
import {
  getAliveNeighbors,
  getExecutedPlayer,
  getMentionedRoleIds,
  getRoleClaimers,
  getRoleInfoForPhaseOrPrevious,
  getRoleInfoNights,
  getRoleInfoTemplate,
  getRoleInfoUsedPhase,
  hasRoleInfo,
  inferRoleInfos,
  isRoleInfoOver,
  isRoleInfoShownInPhase,
  type RoleInfoSlot,
} from '@/utils/role-info-utils';
import { getGameScriptRoles, isSushiBuffetScript } from '@/utils/script-service';

const TEAM_SECTIONS = [
  { label: 'Townsfolk', team: 'townsfolk' },
  { label: 'Outsiders', team: 'outsider' },
  { label: 'Minions', team: 'minion' },
  { label: 'Demons', team: 'demon' },
  { label: 'Travellers', team: 'traveller' },
];

type ActiveSlot = {
  carryForward: boolean;
  day: number;
  phase: GamePhase;
  role: Role;
  slot: RoleInfoSlot;
};

export type RoleInfoTableProps = {
  /** Show only this player's claimed or confirmed characters. */
  player?: Player;
};

/** Per-character info table for the current phase, so infos can be compared side by side. */
export function RoleInfoTable({ player }: RoleInfoTableProps) {
  const { activeDay, activePhase, game, players, runDayEdit, showRoles, startingNight } =
    useGameRouteContext();
  const setRoleInfoValue = useGameStore((state) => state.setRoleInfoValue);
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);

  const scriptRoles = useMemo(
    () => getGameScriptRoles({ script: game.script, sushiRoleIds: game.sushiRoleIds }),
    [game.script, game.sushiRoleIds],
  );
  // Claims made on later days count too, so the table can be filled in retrospectively.
  const mentionedRoleIds = useMemo(() => getMentionedRoleIds(players), [players]);
  const playerRoleIds = useMemo(
    () =>
      player
        ? new Set(
            (player.roleAssignments ?? [])
              .filter((assignment) => assignment.kind === 'claim' || assignment.kind === 'confirm')
              .flatMap((assignment) => assignment.roleIds),
          )
        : undefined,
    [player],
  );
  // Sushi Buffet lists every character, so its evil rows wait for the ones chosen as in play.
  const isSushiBuffet = isSushiBuffetScript(game.script);
  const evilInPlaySlots = useMemo(
    () =>
      getGameEvilInPlaySlots(
        {
          characterTypeCounts: game.characterTypeCounts,
          evilInPlay: game.evilInPlay,
          players: game.players,
        },
        scriptRoles,
      ),
    [game.characterTypeCounts, game.evilInPlay, game.players, scriptRoles],
  );
  const evilInPlayRoleIds = useMemo(() => getEvilInPlayRoleIds(evilInPlaySlots), [evilInPlaySlots]);
  const evilCounts = useMemo(
    () => ({
      demons: evilInPlaySlots.filter((slot) => slot.team === 'demon').length,
      minions: evilInPlaySlots.filter((slot) => slot.team === 'minion').length,
    }),
    [evilInPlaySlots],
  );
  const inferredRoleInfos = useMemo(
    () =>
      inferRoleInfos(players, game.playerDayNotes, game.roleInfos, scriptRoles, game.conversations),
    [players, game.playerDayNotes, game.roleInfos, scriptRoles, game.conversations],
  );
  const roleInfos = useMemo(
    () => [...(game.roleInfos ?? []), ...inferredRoleInfos],
    [game.roleInfos, inferredRoleInfos],
  );
  const inferredEntries = useMemo(() => new Set(inferredRoleInfos), [inferredRoleInfos]);
  const sections = useMemo(
    () =>
      TEAM_SECTIONS.map(({ label, team }) => ({
        label,
        roles: scriptRoles.filter(
          (role) =>
            role.team?.toLocaleLowerCase() === team &&
            hasRoleInfo(role) &&
            (playerRoleIds
              ? playerRoleIds.has(role.id)
              : isRoleInfoShownInPhase(role, activeDay) &&
                isUnusedOrUsedIn(role, roleInfos, activeDay, activePhase) &&
                !isRoleInfoOver(role, getRoleClaimers(players, role.id), activeDay, activePhase) &&
                isShownTeamRole(role, team, mentionedRoleIds, evilInPlayRoleIds, isSushiBuffet)),
        ),
      })).filter(({ roles }) => roles.length > 0),
    [
      activeDay,
      activePhase,
      evilInPlayRoleIds,
      isSushiBuffet,
      mentionedRoleIds,
      playerRoleIds,
      players,
      roleInfos,
      scriptRoles,
    ],
  );
  const seatedPlayers = useMemo(
    () =>
      players
        .filter((player) => !player.isStoryteller)
        .sort((first, second) => first.seat - second.seat),
    [players],
  );
  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const rolesById = useMemo(
    () => new Map(scriptRoles.map((role) => [role.id, role])),
    [scriptRoles],
  );

  if (sections.length === 0) return null;

  const activeValue = activeSlot
    ? getRoleInfoValues(roleInfos, activeSlot)[activeSlot.slot.id]
    : undefined;

  function handleSelect(value: string | undefined) {
    if (!activeSlot) return;

    const { carryForward, day, phase, role, slot } = activeSlot;
    setActiveSlot(null);
    runDayEdit(() =>
      setRoleInfoValue(
        game.id,
        role.id,
        day,
        phase,
        slot.id,
        value,
        inferredRoleInfos,
        carryForward,
      ),
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Character info</Text>
        <Text style={styles.phase}>{getPhaseLabel({ activeDay, activePhase }, startingNight)}</Text>
      </View>
      {sections.map((section) => (
        <RoleInfoSection
          activeDay={activeDay}
          evilCounts={evilCounts}
          activePhase={activePhase}
          inferredEntries={inferredEntries}
          key={section.label}
          label={section.label}
          onPressSlot={setActiveSlot}
          lastNightDay={
            player ? Math.max(activeDay, getLatestPhaseWithData(game).activeDay) : undefined
          }
          players={players}
          playersById={playersById}
          roleInfos={roleInfos}
          roles={section.roles}
          rolesById={rolesById}
          startingNight={startingNight}
        />
      ))}
      <RoleInfoPickerDialog
        day={activeSlot?.day ?? activeDay}
        key={activeSlot ? `${activeSlot.role.id}-${activeSlot.slot.id}` : 'closed'}
        onClose={() => setActiveSlot(null)}
        onSelect={handleSelect}
        phase={activeSlot?.phase ?? activePhase}
        players={seatedPlayers}
        role={activeSlot?.role}
        roles={scriptRoles}
        showRoles={showRoles}
        slot={activeSlot?.slot}
        value={activeValue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 10,
  },
  header: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phase: {
    color: colors.noteDayHeader,
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    gap: 0,
  },
  sectionLabel: {
    color: colors.noteDayHeader,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
});

/**
 * Evil characters show even when nobody claims them, since they rarely get claimed, but only the
 * ones chosen as in play once any are (always, when `requireInPlay`). Good characters show once
 * mentioned.
 */
function isShownTeamRole(
  role: Role,
  team: string,
  mentionedRoleIds: Set<string>,
  evilInPlayRoleIds: Map<EvilInPlayTeam, Set<string>>,
  requireInPlay: boolean,
) {
  if (team !== 'demon' && team !== 'minion') return mentionedRoleIds.has(role.id);

  const inPlayRoleIds = evilInPlayRoleIds.get(team);
  return inPlayRoleIds ? inPlayRoleIds.has(role.id) : !requireInPlay;
}

/** Once-per-game characters only show in the phase their ability was used, once used. */
function isUnusedOrUsedIn(role: Role, roleInfos: RoleInfoEntry[], day: number, phase: GamePhase) {
  const used = getRoleInfoUsedPhase(role, roleInfos);
  return !used || (used.day === day && used.phase === phase);
}

/** Values shown for the slot's line: that night only, or carried from earlier phases. */
function getRoleInfoValues(roleInfos: RoleInfoEntry[], slot: ActiveSlot) {
  const entry = slot.carryForward
    ? getRoleInfoForPhaseOrPrevious(roleInfos, slot.role.id, slot.day, slot.phase)
    : roleInfos.find(
        (candidate) =>
          candidate.roleId === slot.role.id &&
          candidate.day === slot.day &&
          candidate.phase === slot.phase,
      );
  return entry?.values ?? {};
}

function RoleInfoSection({
  activeDay,
  evilCounts,
  activePhase,
  inferredEntries,
  label,
  lastNightDay,
  onPressSlot,
  players,
  playersById,
  roleInfos,
  roles,
  rolesById,
  startingNight,
}: {
  activeDay: number;
  /** Demons and Minions in play, for characters that guess each of them. */
  evilCounts: { demons: number; minions: number };
  activePhase: GamePhase;
  inferredEntries: Set<RoleInfoEntry>;
  label: string;
  /**
   * Give every-night characters a line per night through this day's night (the focused player's
   * view, which covers the whole game).
   */
  lastNightDay?: number;
  onPressSlot: (slot: ActiveSlot) => void;
  players: Player[];
  playersById: Map<string, Player>;
  roleInfos: RoleInfoEntry[];
  roles: Role[];
  rolesById: Map<string, Role>;
  startingNight: StartingNight;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {roles.map((role) => {
        const template = getRoleInfoTemplate(role, evilCounts);
        const owners = getRoleClaimers(players, role.id);
        const nights =
          lastNightDay === undefined ? undefined : getRoleInfoNights(role, lastNightDay, owners);
        // A night's Undertaker info is about the execution on the day before it.
        const getExecuted = (night: number) =>
          template.autoExecuted ? getExecutedPlayer(players, night - 1) : undefined;
        const getNeighbors = (day: number, phase: GamePhase) =>
          template.autoNeighbors && owners[0]
            ? getAliveNeighbors(players, owners[0].id, day, phase)
            : undefined;

        const lines: RoleInfoLine[] = nights
          ? nights.map((night) => {
              const position = { carryForward: false, day: night, phase: 'night' as const, role };
              const entry = roleInfos.find(
                (candidate) =>
                  candidate.roleId === role.id &&
                  candidate.day === night &&
                  candidate.phase === 'night',
              );
              const nightLabel = getPhaseLabel(
                { activeDay: night, activePhase: 'night' },
                startingNight,
              );
              return {
                executed: getExecuted(night),
                key: `night-${night}`,
                label:
                  entry && inferredEntries.has(entry) ? `${nightLabel} · from notes` : nightLabel,
                neighbors: getNeighbors(night, 'night'),
                onPressSlot: (slot) => onPressSlot({ ...position, slot }),
                values: entry?.values ?? {},
              };
            })
          : [
              getPhaseLine(
                role,
                roleInfos,
                inferredEntries,
                activeDay,
                activePhase,
                startingNight,
                getExecuted(activeDay),
                getNeighbors(activeDay, activePhase),
                onPressSlot,
              ),
            ];

        // Mark where the character's info ends when all of its players have died.
        if (
          nights &&
          lastNightDay !== undefined &&
          isRoleInfoOver(role, owners, lastNightDay, 'night')
        ) {
          lines.push({
            isDead: true,
            key: 'dead',
            label: 'Dead',
            onPressSlot: () => undefined,
            values: {},
          });
        }

        return (
          <RoleInfoRow
            key={role.id}
            lines={lines}
            owners={owners}
            playersById={playersById}
            role={role}
            rolesById={rolesById}
            template={template}
          />
        );
      })}
    </View>
  );
}

/** The single line of a character shown for the current phase, carrying earlier values. */
function getPhaseLine(
  role: Role,
  roleInfos: RoleInfoEntry[],
  inferredEntries: Set<RoleInfoEntry>,
  day: number,
  phase: GamePhase,
  startingNight: StartingNight,
  executed: Player | undefined,
  neighbors: Player[] | undefined,
  onPressSlot: (slot: ActiveSlot) => void,
): RoleInfoLine {
  const entry = getRoleInfoForPhaseOrPrevious(roleInfos, role.id, day, phase);
  const isCarried = entry && (entry.day !== day || entry.phase !== phase);
  const fromNotes = entry && inferredEntries.has(entry);
  const label = isCarried
    ? `from ${fromNotes ? 'notes, ' : ''}${getPhaseLabel({ activeDay: entry.day, activePhase: entry.phase }, startingNight)}`
    : fromNotes
      ? 'from notes'
      : undefined;

  return {
    executed,
    key: 'phase',
    label,
    neighbors,
    onPressSlot: (slot) => onPressSlot({ carryForward: true, day, phase, role, slot }),
    values: entry?.values ?? {},
  };
}
