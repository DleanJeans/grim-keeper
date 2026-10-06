import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RoleInfoPickerDialog } from '@/components/game/notes-tab/role-info/role-info-picker-dialog';
import { RoleInfoRow } from '@/components/game/notes-tab/role-info/role-info-row';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { GamePhase, Player, Role, RoleInfoEntry, StartingNight } from '@/types/game';
import { getPhaseLabel } from '@/utils/game-phase-utils';
import {
  getAliveNeighbors,
  getRoleInfoForPhaseOrPrevious,
  getRoleInfoOwners,
  getRoleInfoTemplate,
  hasRoleInfo,
  type RoleInfoSlot,
} from '@/utils/role-info-utils';
import { isSushiBuffetScript } from '@/utils/script-service';

const TEAM_SECTIONS = [
  { label: 'Townsfolk', team: 'townsfolk' },
  { label: 'Outsiders', team: 'outsider' },
  { label: 'Minions', team: 'minion' },
  { label: 'Demons', team: 'demon' },
  { label: 'Travellers', team: 'traveller' },
];

type ActiveSlot = { role: Role; slot: RoleInfoSlot };

/** Per-character info table for the current phase, so infos can be compared side by side. */
export function RoleInfoTable() {
  const { activeDay, activePhase, game, players, runDayEdit, startingNight } =
    useGameRouteContext();
  const setRoleInfoValue = useGameStore((state) => state.setRoleInfoValue);
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);

  const scriptRoles = useMemo(() => {
    if (!game.script) return [];
    if (!isSushiBuffetScript(game.script) || !game.sushiRoleIds) return game.script.roles;

    const enabledRoleIds = new Set(game.sushiRoleIds);
    return game.script.roles.filter((role) => enabledRoleIds.has(role.id));
  }, [game.script, game.sushiRoleIds]);
  const sections = useMemo(
    () =>
      TEAM_SECTIONS.map(({ label, team }) => ({
        label,
        roles: scriptRoles.filter(
          (role) => role.team?.toLocaleLowerCase() === team && hasRoleInfo(role),
        ),
      })).filter(({ roles }) => roles.length > 0),
    [scriptRoles],
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
    ? getRoleInfoForPhaseOrPrevious(game.roleInfos, activeSlot.role.id, activeDay, activePhase)
        ?.values[activeSlot.slot.id]
    : undefined;

  function handleSelect(value: string | undefined) {
    if (!activeSlot) return;

    const { role, slot } = activeSlot;
    setActiveSlot(null);
    runDayEdit(() => setRoleInfoValue(game.id, role.id, activeDay, activePhase, slot.id, value));
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
          activePhase={activePhase}
          key={section.label}
          label={section.label}
          onPressSlot={(role, slot) => setActiveSlot({ role, slot })}
          players={players}
          playersById={playersById}
          roleInfos={game.roleInfos}
          roles={section.roles}
          rolesById={rolesById}
          scriptRoles={scriptRoles}
          startingNight={startingNight}
        />
      ))}
      <RoleInfoPickerDialog
        key={activeSlot ? `${activeSlot.role.id}-${activeSlot.slot.id}` : 'closed'}
        onClose={() => setActiveSlot(null)}
        onSelect={handleSelect}
        players={seatedPlayers}
        role={activeSlot?.role}
        roles={scriptRoles}
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

function RoleInfoSection({
  activeDay,
  activePhase,
  label,
  onPressSlot,
  players,
  playersById,
  roleInfos,
  roles,
  rolesById,
  scriptRoles,
  startingNight,
}: {
  activeDay: number;
  activePhase: GamePhase;
  label: string;
  onPressSlot: (role: Role, slot: RoleInfoSlot) => void;
  players: Player[];
  playersById: Map<string, Player>;
  roleInfos: RoleInfoEntry[] | undefined;
  roles: Role[];
  rolesById: Map<string, Role>;
  scriptRoles: Role[];
  startingNight: StartingNight;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {roles.map((role) => {
        const template = getRoleInfoTemplate(role);
        const entry = getRoleInfoForPhaseOrPrevious(roleInfos, role.id, activeDay, activePhase);
        const owners = getRoleInfoOwners(players, role.id, activeDay, activePhase, scriptRoles);
        const carried =
          entry && (entry.day !== activeDay || entry.phase !== activePhase)
            ? `from ${getPhaseLabel({ activeDay: entry.day, activePhase: entry.phase }, startingNight)}`
            : undefined;

        return (
          <RoleInfoRow
            carriedFromLabel={carried}
            key={role.id}
            neighbors={
              template.autoNeighbors && owners[0]
                ? getAliveNeighbors(players, owners[0].id, activeDay, activePhase)
                : undefined
            }
            onPressSlot={(slot) => onPressSlot(role, slot)}
            owners={owners}
            playersById={playersById}
            role={role}
            rolesById={rolesById}
            template={template}
            values={entry?.values ?? {}}
          />
        );
      })}
    </View>
  );
}
