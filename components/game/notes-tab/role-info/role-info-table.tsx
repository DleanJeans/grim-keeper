import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RoleInfoPickerDialog } from '@/components/game/notes-tab/role-info/role-info-picker-dialog';
import {
  type RoleInfoLine,
  RoleInfoRow,
} from '@/components/game/notes-tab/role-info/role-info-row';
import { RoleInfoStatementsDialog } from '@/components/game/notes-tab/role-info/role-info-statements-dialog';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type {
  Conversation,
  GamePhase,
  Player,
  Role,
  RoleInfoEntry,
  StartingNight,
} from '@/types/game';
import {
  type EvilInPlayTeam,
  getEvilInPlayRoleIds,
  getGameEvilInPlaySlots,
} from '@/utils/evil-in-play-utils';
import {
  type GamePhasePosition,
  getLatestPhaseWithData,
  getPhaseLabel,
} from '@/utils/game-phase-utils';
import {
  getAliveNeighbors,
  getDailyRoleInfo,
  getExecutedPlayer,
  getMentionedRoleIds,
  getNominationPlayers,
  getRoleClaimers,
  getRoleInfoClaimer,
  getRoleInfoDays,
  getRoleInfoForPhaseOrPrevious,
  getRoleInfoNights,
  getRoleInfoTemplate,
  getRoleInfoUsedPhase,
  hasRoleInfo,
  inferRoleInfos,
  isClaimerRoleInfo,
  isRoleInfoOver,
  isRoleInfoShownInPhase,
  ROLE_INFO_TRUE_KEY,
  type RoleInfoClaimer,
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
  /** Whose info it is when several players claim the character. */
  claimer?: RoleInfoClaimer;
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
  const setDailyRoleInfoValues = useGameStore((state) => state.setDailyRoleInfoValues);
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
  // Sushi Buffet shows every non-Traveller character, so each one's tokens can be reviewed.
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
            (playerRoleIds
              ? hasRoleInfo(role) && playerRoleIds.has(role.id)
              : isSushiBuffet
                ? team !== 'traveller'
                : hasRoleInfo(role) &&
                  isRoleInfoShownInPhase(role, activeDay, activePhase) &&
                  isUnusedOrUsedIn(
                    role,
                    roleInfos,
                    getRoleClaimers(players, role.id),
                    activeDay,
                    activePhase,
                  ) &&
                  !isRoleInfoOver(
                    role,
                    getRoleClaimers(players, role.id),
                    activeDay,
                    activePhase,
                  ) &&
                  isShownTeamRole(role, team, mentionedRoleIds, evilInPlayRoleIds)),
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

  if (!showRoles || sections.length === 0) return null;

  const latestPhase = getLatestPhaseWithData(game);
  // Daily characters can be filled in for every day reached so far.
  const lastDay = Math.max(
    getLastDayReached({ activeDay, activePhase }),
    getLastDayReached(latestPhase),
  );
  const activeTemplate = activeSlot ? getRoleInfoTemplate(activeSlot.role) : undefined;
  const activeDailyRole = activeTemplate?.daily ? activeSlot?.role : undefined;
  const activeClaimerId = activeSlot?.claimer?.playerId;
  const dailyDays = activeDailyRole
    ? getRoleInfoDays(
        activeDailyRole,
        lastDay,
        activeClaimerId
          ? players.filter((candidate) => candidate.id === activeClaimerId)
          : getRoleClaimers(players, activeDailyRole.id),
      )
    : undefined;
  const activeValue = activeSlot
    ? getRoleInfoValues(roleInfos, activeSlot)[activeSlot.slot.id]
    : undefined;

  function handleSelect(value: string | undefined) {
    if (!activeSlot) return;

    const { carryForward, claimer, day, phase, role, slot } = activeSlot;
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
        claimer,
      ),
    );
  }

  function handleSaveDaily(valuesByDay: Map<number, Record<string, string>>) {
    if (!activeDailyRole) return;

    const claimer = activeSlot?.claimer;
    setActiveSlot(null);
    runDayEdit(() => setDailyRoleInfoValues(game.id, activeDailyRole.id, valuesByDay, claimer));
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
          conversations={game.conversations}
          evilCounts={evilCounts}
          activePhase={activePhase}
          focusedPlayer={player}
          hideFinishedClaimers={!player && !isSushiBuffet}
          inferredEntries={inferredEntries}
          key={section.label}
          label={section.label}
          onPressSlot={setActiveSlot}
          lastDay={lastDay}
          lastNightDay={player ? Math.max(activeDay, latestPhase.activeDay) : undefined}
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
        key={
          activeSlot
            ? `${activeSlot.role.id}-${activeClaimerId ?? ''}-${activeSlot.slot.id}`
            : 'closed'
        }
        onClose={() => setActiveSlot(null)}
        onSelect={handleSelect}
        phase={activeSlot?.phase ?? activePhase}
        players={seatedPlayers}
        role={activeDailyRole ? undefined : activeSlot?.role}
        roles={scriptRoles}
        showRoles={showRoles}
        slot={activeDailyRole ? undefined : activeSlot?.slot}
        value={activeValue}
      />
      <RoleInfoStatementsDialog
        days={dailyDays ?? []}
        focusDay={activeSlot?.day}
        focusSlotId={activeSlot?.slot.id}
        key={
          activeDailyRole ? `daily-${activeDailyRole.id}-${activeClaimerId ?? ''}` : 'daily-closed'
        }
        markTrue={activeTemplate?.markTrue === true}
        onClose={() => setActiveSlot(null)}
        onSave={handleSaveDaily}
        role={activeDailyRole}
        slots={activeTemplate?.slots ?? []}
        startingNight={startingNight}
        valuesByDay={
          new Map(
            (dailyDays ?? []).map((day) => [
              day,
              getDailyRoleInfo(roleInfos, activeSlot?.role.id ?? '', day, activeSlot?.claimer)
                ?.values ?? {},
            ]),
          )
        }
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
 * ones chosen as in play once any are. Good characters show once mentioned.
 */
function isShownTeamRole(
  role: Role,
  team: string,
  mentionedRoleIds: Set<string>,
  evilInPlayRoleIds: Map<EvilInPlayTeam, Set<string>>,
) {
  if (team !== 'demon' && team !== 'minion') return mentionedRoleIds.has(role.id);

  const inPlayRoleIds = evilInPlayRoleIds.get(team);
  return !inPlayRoleIds || inPlayRoleIds.has(role.id);
}

/**
 * Once-per-game characters only show in the phase their ability was used, once used. A
 * double-claimed character shows while any of its claimers' abilities is unused or used then.
 */
function isUnusedOrUsedIn(
  role: Role,
  roleInfos: RoleInfoEntry[],
  claimers: Player[],
  day: number,
  phase: GamePhase,
) {
  const claimerInfos =
    claimers.length > 1
      ? claimers.map((claimer) => getRoleInfoClaimer(claimers, claimer))
      : [undefined];
  return claimerInfos.some((claimer) =>
    isClaimerUnusedOrUsedIn(role, roleInfos, claimer, day, phase),
  );
}

function isClaimerUnusedOrUsedIn(
  role: Role,
  roleInfos: RoleInfoEntry[],
  claimer: RoleInfoClaimer | undefined,
  day: number,
  phase: GamePhase,
) {
  const used = getRoleInfoUsedPhase(role, roleInfos, claimer);
  return !used || (used.day === day && used.phase === phase);
}

/** The last day whose daytime was reached: a night comes before its own day. */
function getLastDayReached({ activeDay, activePhase }: GamePhasePosition) {
  return activePhase === 'night' ? activeDay - 1 : activeDay;
}

/** Values shown for the slot's line: that night only, or carried from earlier phases. */
function getRoleInfoValues(roleInfos: RoleInfoEntry[], slot: ActiveSlot) {
  const entry = slot.carryForward
    ? getRoleInfoForPhaseOrPrevious(roleInfos, slot.role.id, slot.day, slot.phase, slot.claimer)
    : roleInfos.find(
        (candidate) =>
          candidate.roleId === slot.role.id &&
          candidate.day === slot.day &&
          candidate.phase === slot.phase &&
          isClaimerRoleInfo(candidate, slot.claimer),
      );
  return entry?.values ?? {};
}

function RoleInfoSection({
  activeDay,
  conversations,
  evilCounts,
  activePhase,
  focusedPlayer,
  hideFinishedClaimers,
  inferredEntries,
  label,
  lastDay,
  lastNightDay,
  onPressSlot,
  players,
  playersById,
  roleInfos,
  roles,
  rolesById,
  startingNight,
}: Omit<RoleInfoClaimerRowProps, 'claimer' | 'claimers' | 'role'> & {
  /** Put this player's row of a double-claimed character first, above the other claimers'. */
  focusedPlayer?: Player;
  /**
   * Leave out the rows of a double claim's claimer who already used a once-per-game ability in
   * another phase or who died, as the whole character is left out for a single claim.
   */
  hideFinishedClaimers: boolean;
  label: string;
  roles: Role[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {roles.flatMap((role) => {
        const claimers = getRoleClaimers(players, role.id);
        // A double-claimed character gets a row per claimer, each with its own info.
        const rowClaimers =
          claimers.length > 1
            ? claimers
                .filter(
                  (claimer) =>
                    !hideFinishedClaimers ||
                    (isClaimerUnusedOrUsedIn(
                      role,
                      roleInfos,
                      getRoleInfoClaimer(claimers, claimer),
                      activeDay,
                      activePhase,
                    ) &&
                      !isRoleInfoOver(role, [claimer], activeDay, activePhase)),
                )
                .sort(
                  (first, second) =>
                    Number(second.id === focusedPlayer?.id) -
                    Number(first.id === focusedPlayer?.id),
                )
            : [undefined];

        return rowClaimers.map((claimer) => (
          <RoleInfoClaimerRow
            activeDay={activeDay}
            activePhase={activePhase}
            claimer={claimer}
            claimers={claimers}
            conversations={conversations}
            evilCounts={evilCounts}
            inferredEntries={inferredEntries}
            key={`${role.id}-${claimer?.id ?? ''}`}
            lastDay={lastDay}
            lastNightDay={lastNightDay}
            onPressSlot={onPressSlot}
            players={players}
            playersById={playersById}
            roleInfos={roleInfos}
            role={role}
            rolesById={rolesById}
            startingNight={startingNight}
          />
        ));
      })}
    </View>
  );
}

type RoleInfoClaimerRowProps = {
  activeDay: number;
  activePhase: GamePhase;
  /** The claimer this row is for, when several players claim the character. */
  claimer?: Player;
  claimers: Player[];
  conversations: Conversation[];
  /** Demons and Minions in play, for characters that guess each of them. */
  evilCounts: { demons: number; minions: number };
  inferredEntries: Set<RoleInfoEntry>;
  /** Give daily characters a line per day through this day. */
  lastDay: number;
  /**
   * Give every-night characters a line per night through this day's night (the focused player's
   * view, which covers the whole game).
   */
  lastNightDay?: number;
  onPressSlot: (slot: ActiveSlot) => void;
  players: Player[];
  playersById: Map<string, Player>;
  role: Role;
  roleInfos: RoleInfoEntry[];
  rolesById: Map<string, Role>;
  startingNight: StartingNight;
};

/** One character's row, or one claimer's row of a double-claimed character. */
function RoleInfoClaimerRow({
  activeDay,
  activePhase,
  claimer,
  claimers,
  conversations,
  evilCounts,
  inferredEntries,
  lastDay,
  lastNightDay,
  onPressSlot,
  players,
  playersById,
  role,
  roleInfos,
  rolesById,
  startingNight,
}: RoleInfoClaimerRowProps) {
  const template = getRoleInfoTemplate(role, evilCounts);
  const owners = claimer ? [claimer] : claimers;
  const claimerInfo = getRoleInfoClaimer(claimers, claimer);
  const onPressClaimerSlot = (slot: ActiveSlot) => onPressSlot({ ...slot, claimer: claimerInfo });
  const nights =
    lastNightDay === undefined ? undefined : getRoleInfoNights(role, lastNightDay, owners);
  const days = template.daily ? getRoleInfoDays(role, lastDay, owners) : undefined;
  // A night's Undertaker info is about the execution on the day before it.
  const getExecuted = (night: number) =>
    template.autoExecuted ? getExecutedPlayer(players, night - 1) : undefined;
  // Likewise the Town Crier's and Flowergirl's info is about the nominations on the day before it.
  const getDayBefore = (night: number) =>
    template.autoDayBefore
      ? {
          kind: template.autoDayBefore,
          players: getNominationPlayers(players, conversations, night - 1, template.autoDayBefore),
        }
      : undefined;
  const getNeighbors = (day: number, phase: GamePhase) =>
    template.autoNeighbors && owners[0]
      ? getAliveNeighbors(players, owners[0].id, day, phase)
      : undefined;

  const lines: RoleInfoLine[] = days
    ? getDayLines(role, days, roleInfos, startingNight, claimerInfo, onPressClaimerSlot)
    : nights
      ? nights.map((night) => {
          const position = { carryForward: false, day: night, phase: 'night' as const, role };
          const entry = roleInfos.find(
            (candidate) =>
              candidate.roleId === role.id &&
              candidate.day === night &&
              candidate.phase === 'night' &&
              isClaimerRoleInfo(candidate, claimerInfo),
          );
          const nightLabel = getPhaseLabel(
            { activeDay: night, activePhase: 'night' },
            startingNight,
          );
          return {
            dayBefore: getDayBefore(night),
            executed: getExecuted(night),
            key: `night-${night}`,
            label: entry && inferredEntries.has(entry) ? `${nightLabel} · from notes` : nightLabel,
            neighbors: getNeighbors(night, 'night'),
            onPressSlot: (slot) => onPressClaimerSlot({ ...position, slot }),
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
            getDayBefore(activeDay),
            getExecuted(activeDay),
            getNeighbors(activeDay, activePhase),
            claimerInfo,
            onPressClaimerSlot,
          ),
        ];

  // Mark where the character's info ends when all of its players have died.
  if (
    (nights && lastNightDay !== undefined && isRoleInfoOver(role, owners, lastNightDay, 'night')) ||
    (days && isRoleInfoOver(role, owners, lastDay, 'day'))
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
      lines={lines}
      owners={owners}
      playersById={playersById}
      role={role}
      rolesById={rolesById}
      template={template}
    />
  );
}

/** One line per day of a daily character (the Savant), its statements marked true or false. */
function getDayLines(
  role: Role,
  days: number[],
  roleInfos: RoleInfoEntry[],
  startingNight: StartingNight,
  claimer: RoleInfoClaimer | undefined,
  onPressSlot: (slot: ActiveSlot) => void,
): RoleInfoLine[] {
  const { markTrue } = getRoleInfoTemplate(role);

  return days.map((day) => {
    const values = getDailyRoleInfo(roleInfos, role.id, day, claimer)?.values ?? {};
    return {
      trueSlotId: markTrue ? values[ROLE_INFO_TRUE_KEY] : undefined,
      key: `day-${day}`,
      label: getPhaseLabel({ activeDay: day, activePhase: 'day' }, startingNight),
      onPressSlot: (slot) => onPressSlot({ carryForward: false, day, phase: 'day', role, slot }),
      values,
    };
  });
}

/** The single line of a character shown for the current phase, carrying earlier values. */
function getPhaseLine(
  role: Role,
  roleInfos: RoleInfoEntry[],
  inferredEntries: Set<RoleInfoEntry>,
  day: number,
  phase: GamePhase,
  startingNight: StartingNight,
  dayBefore: RoleInfoLine['dayBefore'],
  executed: Player | undefined,
  neighbors: Player[] | undefined,
  claimer: RoleInfoClaimer | undefined,
  onPressSlot: (slot: ActiveSlot) => void,
): RoleInfoLine {
  const entry = getRoleInfoForPhaseOrPrevious(roleInfos, role.id, day, phase, claimer);
  const isCarried = entry && (entry.day !== day || entry.phase !== phase);
  const fromNotes = entry && inferredEntries.has(entry);
  const label = isCarried
    ? `from ${fromNotes ? 'notes, ' : ''}${getPhaseLabel({ activeDay: entry.day, activePhase: entry.phase }, startingNight)}`
    : fromNotes
      ? 'from notes'
      : undefined;

  return {
    dayBefore,
    executed,
    key: 'phase',
    label,
    neighbors,
    onPressSlot: (slot) => onPressSlot({ carryForward: true, day, phase, role, slot }),
    values: entry?.values ?? {},
  };
}
