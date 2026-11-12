import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { RoleIcon } from '@/components/role-icon';
import { RoleReference } from '@/components/role-reference';
import { ScaledModal } from '@/components/scaled-modal';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Game, Role } from '@/types/game';
import {
  getPastEvilTeams,
  type PastEvilGame,
  type PastEvilMember,
  pastEvilGameHasRole,
  type RoleTally,
} from '@/utils/past-evil-teams-utils';

const MAX_BLUFF_ROWS = 6;
const TALLY_ICON_SIZE = 22;
const MEMBER_ICON_SIZE = 30;

type PastEvilTeamsSheetProps = {
  game: Game;
  onClose: () => void;
  visible: boolean;
};

/**
 * The other saved games on this script: who won, how often each Demon, Minion and bluff showed
 * up, and each game's evil team. Tapping a counted character filters the games to it.
 */
export function PastEvilTeamsSheet({ game, onClose, visible }: PastEvilTeamsSheetProps) {
  const games = useGameStore((state) => state.games);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const pastTeams = useMemo(
    () => (visible ? getPastEvilTeams(games, game) : undefined),
    [game, games, visible],
  );
  const shownGames = useMemo(
    () =>
      selectedRoleId
        ? (pastTeams?.games.filter((pastGame) => pastEvilGameHasRole(pastGame, selectedRoleId)) ??
          [])
        : (pastTeams?.games ?? []),
    [pastTeams, selectedRoleId],
  );
  const selectedRole = pastTeams
    ? [...pastTeams.demons, ...pastTeams.minions, ...pastTeams.bluffs].find(
        (entry) => entry.role.id === selectedRoleId,
      )?.role
    : undefined;

  function toggleRole(roleId: string) {
    setSelectedRoleId((current) => (current === roleId ? null : roleId));
  }

  function openGame(gameId: string) {
    onClose();
    router.push({ pathname: '/game/[id]', params: { id: gameId } });
  }

  return (
    <ScaledModal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close past evil teams"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdropDismiss}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Past evil teams</Text>
              <Text style={styles.subtitle}>
                {game.script?.name ?? 'This script'} · {pastTeams?.games.length ?? 0}{' '}
                {pastTeams?.games.length === 1 ? 'game' : 'games'}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close past evil teams"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
            >
              <X color={colors.textMuted} size={18} strokeWidth={2.5} />
            </Pressable>
          </View>
          {pastTeams ? (
            <ScrollView contentContainerStyle={styles.content}>
              <TeamWinBar evilWins={pastTeams.evilWins} goodWins={pastTeams.goodWins} />
              {pastTeams.games.length === 0 ? (
                <Text style={styles.empty}>
                  No earlier games on this script have a confirmed Demon or Minion, In play picks or
                  Bluffs yet.
                </Text>
              ) : (
                <>
                  <View style={styles.tally}>
                    <TallySection
                      entries={pastTeams.demons}
                      onPressRole={toggleRole}
                      selectedRoleId={selectedRoleId}
                      title="Demons"
                    />
                    <TallySection
                      entries={pastTeams.minions}
                      onPressRole={toggleRole}
                      selectedRoleId={selectedRoleId}
                      title="Minions"
                    />
                    <TallySection
                      entries={pastTeams.bluffs.slice(0, MAX_BLUFF_ROWS)}
                      onPressRole={toggleRole}
                      selectedRoleId={selectedRoleId}
                      title="Most bluffed"
                    />
                  </View>
                  {selectedRole ? (
                    <Text style={styles.filterNote}>
                      Games with the <Text style={styles.filterRole}>{selectedRole.name}</Text>. Tap
                      it again to show all.
                    </Text>
                  ) : null}
                  {shownGames.map((pastGame) => (
                    <PastEvilGameCard
                      key={pastGame.game.id}
                      onPress={() => openGame(pastGame.game.id)}
                      pastGame={pastGame}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </ScaledModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.backdrop, flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1 },
  bar: {
    backgroundColor: colors.winBarTrack,
    borderRadius: 5,
    flexDirection: 'row',
    height: 10,
    overflow: 'hidden',
  },
  barEvil: { backgroundColor: colors.teamEvil },
  barGood: { backgroundColor: colors.teamGood },
  bluffLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bluffLine: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bluffName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  cardPressed: { backgroundColor: colors.surfacePressed },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closePressed: { backgroundColor: colors.surfacePressed },
  content: { gap: 12, paddingBottom: 8 },
  demonBluffs: {
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  empty: { color: colors.textMuted, fontSize: 14 },
  evilText: { color: colors.teamEvil },
  filterNote: { color: colors.textMuted, fontSize: 13 },
  filterRole: { color: colors.text, fontWeight: '800' },
  goodText: { color: colors.teamGood },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  headerText: { flex: 1, gap: 2 },
  member: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  memberBody: { flex: 1, gap: 3, minWidth: 0 },
  memberName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  memberRole: { color: colors.textMuted, fontWeight: '600' },
  members: { gap: 10 },
  meta: { color: colors.textMuted, fontSize: 12 },
  muted: { color: colors.textMuted, fontSize: 12 },
  sheet: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    maxHeight: '85%',
    padding: 16,
  },
  subtitle: { color: colors.textMuted, fontSize: 13 },
  tally: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  tallyBar: { backgroundColor: colors.winBarTrack, borderRadius: 4, flex: 1, height: 8 },
  tallyBarFill: { borderRadius: 4, bottom: 0, left: 0, position: 'absolute', top: 0 },
  tallyCount: {
    color: colors.textMuted,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    textAlign: 'right',
    width: 24,
  },
  tallyName: { color: colors.text, fontSize: 13, fontWeight: '700', width: 104 },
  tallyRow: {
    alignItems: 'center',
    borderColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: -6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  tallyRowPressed: { backgroundColor: colors.surfacePressed },
  tallyRowSelected: { backgroundColor: colors.surfacePressed, borderColor: colors.borderStrong },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  token: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.teamEvil,
    borderRadius: 20,
    borderWidth: 1.5,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  winBar: { gap: 6 },
  winBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  winBarText: { fontSize: 13, fontVariant: ['tabular-nums'], fontWeight: '800' },
  winnerChip: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  winnerChipEvil: { backgroundColor: colors.teamEvil, color: colors.text },
  winnerChipGood: { backgroundColor: colors.teamGood, color: colors.text },
});

/** One bar split blue and red by how many games each team won. */
function TeamWinBar({ evilWins, goodWins }: { evilWins: number; goodWins: number }) {
  const total = goodWins + evilWins;
  if (total === 0) {
    return <Text style={styles.muted}>No finished games on this script yet.</Text>;
  }

  const goodRate = Math.round((goodWins / total) * 100);
  return (
    <View
      accessibilityLabel={`Good won ${goodWins} of ${total}, evil won ${evilWins} of ${total}`}
      style={styles.winBar}
    >
      <View style={styles.winBarLabels}>
        <Text style={[styles.winBarText, styles.goodText]}>
          Good {goodRate}% · {goodWins}
        </Text>
        <Text style={[styles.winBarText, styles.evilText]}>
          {evilWins} · {100 - goodRate}% Evil
        </Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barGood, { flex: goodWins }]} />
        <View style={[styles.barEvil, { flex: evilWins }]} />
      </View>
    </View>
  );
}

function TallySection({
  entries,
  onPressRole,
  selectedRoleId,
  title,
}: {
  entries: RoleTally[];
  onPressRole: (roleId: string) => void;
  selectedRoleId: string | null;
  title: string;
}) {
  if (entries.length === 0) return null;
  const max = entries[0].count;

  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      {entries.map((entry) => (
        <TallyRow
          entry={entry}
          key={entry.role.id}
          max={max}
          onPress={() => onPressRole(entry.role.id)}
          selected={entry.role.id === selectedRoleId}
        />
      ))}
    </>
  );
}

function TallyRow({
  entry,
  max,
  onPress,
  selected,
}: {
  entry: RoleTally;
  max: number;
  onPress: () => void;
  selected: boolean;
}) {
  const evil = isEvilRole(entry.role);
  return (
    <Pressable
      accessibilityLabel={`${entry.role.name}, ${entry.count} ${entry.count === 1 ? 'game' : 'games'}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tallyRow,
        selected && styles.tallyRowSelected,
        pressed && styles.tallyRowPressed,
      ]}
    >
      <RoleIcon role={entry.role} size={TALLY_ICON_SIZE} />
      <Text numberOfLines={1} style={styles.tallyName}>
        {entry.role.name}
      </Text>
      <View style={styles.tallyBar}>
        <View
          style={[
            styles.tallyBarFill,
            evil ? styles.barEvil : styles.barGood,
            { width: `${(entry.count / max) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.tallyCount}>{entry.count}</Text>
    </Pressable>
  );
}

function PastEvilGameCard({ onPress, pastGame }: { onPress: () => void; pastGame: PastEvilGame }) {
  const { demonBluffs, game, members, playerCount, winningTeam } = pastGame;
  const date = formatDate(game.createdAt);

  return (
    <Pressable
      accessibilityHint="Opens this game"
      accessibilityLabel={`${date}, ${members.map((member) => member.role.name).join(', ')}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        <Text style={styles.meta}>
          {date} · {playerCount} players
        </Text>
        {winningTeam ? (
          <Text
            style={[
              styles.winnerChip,
              winningTeam === 'good' ? styles.winnerChipGood : styles.winnerChipEvil,
            ]}
          >
            {winningTeam === 'good' ? 'Good won' : 'Evil won'}
          </Text>
        ) : null}
      </View>
      {members.length > 0 ? (
        <View style={styles.members}>
          {members.map((member) => (
            <MemberRow
              key={`${member.player?.id ?? 'in-play'}-${member.role.id}`}
              member={member}
            />
          ))}
        </View>
      ) : null}
      {demonBluffs.length > 0 ? (
        <View style={[styles.bluffLine, members.length > 0 && styles.demonBluffs]}>
          <Text style={styles.bluffLabel}>Demon bluffs</Text>
          <RoleList roles={demonBluffs} />
        </View>
      ) : null}
    </Pressable>
  );
}

function MemberRow({ member }: { member: PastEvilMember }) {
  const roleText =
    member.kind === 'turned-evil' ? `${member.role.name}, turned evil` : member.role.name;

  return (
    <View style={styles.member}>
      <View style={styles.token}>
        <RoleIcon role={member.role} scale={1.3} size={MEMBER_ICON_SIZE} />
      </View>
      <View style={styles.memberBody}>
        {member.player ? (
          <Text style={styles.memberName}>
            {member.player.name} <Text style={styles.memberRole}>· {roleText}</Text>
          </Text>
        ) : (
          <Text style={styles.memberName}>{roleText}</Text>
        )}
        {!member.player ? (
          <Text style={styles.muted}>From the In play picker</Text>
        ) : member.bluffs.length > 0 ? (
          <View style={styles.bluffLine}>
            <Text style={styles.bluffLabel}>Bluffed as</Text>
            <RoleList roles={member.bluffs} />
          </View>
        ) : (
          <Text style={styles.muted}>No claim logged</Text>
        )}
      </View>
    </View>
  );
}

function RoleList({ roles }: { roles: Role[] }) {
  return roles.map((role) => (
    <RoleReference
      disablePress
      iconSize={16}
      key={role.id}
      role={role}
      textStyle={styles.bluffName}
    />
  ));
}

function isEvilRole(role: Role) {
  const team = role.team?.toLocaleLowerCase();
  return team === 'demon' || team === 'minion';
}

function formatDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
