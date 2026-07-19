import { Check, Megaphone } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { RoleReference } from '@/components/role-reference';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';

type CommonProps = {
  roles: Role[];
  scriptId?: string;
};

type ClaimOrConfirmProps = CommonProps & {
  kind: 'claim' | 'confirm';
};

type RumorProps = CommonProps & {
  kind: 'rumor';
  /** The player who is the source of the rumor (the focused player who said it). */
  source: Player;
  /** The player the rumor is about. */
  subject: Player;
};

export type PlayerNoteRoleAssignmentProps = ClaimOrConfirmProps | RumorProps;

function isRumorProps(props: PlayerNoteRoleAssignmentProps): props is RumorProps {
  return props.kind === 'rumor';
}

export function PlayerNoteRoleAssignment(props: PlayerNoteRoleAssignmentProps) {
  if (isRumorProps(props)) {
    return <RumorRow roles={props.roles} scriptId={props.scriptId} source={props.source} subject={props.subject} />;
  }
  return <ClaimOrConfirmRow kind={props.kind} roles={props.roles} scriptId={props.scriptId} />;
}

function ClaimOrConfirmRow({
  kind,
  roles,
  scriptId,
}: {
  kind: 'claim' | 'confirm';
  roles: Role[];
  scriptId?: string;
}) {
  const labelKind = kind === 'confirm' ? 'confirm' : 'claim';
  return (
    <View style={styles.row}>
      <Text style={roleLabelStyle[labelKind]}>{labelKind === 'confirm' ? 'Confirmed' : 'Claimed'}</Text>
      {labelKind === 'confirm' ? <Check color={colors.roleConfirm} size={14} strokeWidth={3} /> : null}
      {roles.map((role) => (
        <RoleReference
          iconSize={18}
          iconScale={1}
          key={role.id}
          role={role}
          scriptId={scriptId}
          textStyle={styles.roleReferenceText}
        />
      ))}
    </View>
  );
}

function RumorRow({
  roles,
  scriptId,
  source,
  subject,
}: {
  roles: Role[];
  scriptId?: string;
  source: Player;
  subject: Player;
}) {
  return (
    <View style={styles.row}>
      <Megaphone color={colors.roleRumor} size={14} strokeWidth={2.5} />
      <Text style={styles.rumorLabel}>Rumor</Text>
      <PlayerNameWithRole
        player={subject}
        textStyle={styles.playerNameText}
      />
      <Text style={styles.arrow}>is</Text>
      {roles.map((role) => (
        <RoleReference
          iconSize={18}
          iconScale={1}
          key={role.id}
          role={role}
          scriptId={scriptId}
          textStyle={styles.roleReferenceText}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  roleReferenceText: {
    fontSize: 12,
  },
  playerNameText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  rumorLabel: {
    color: colors.roleRumor,
    fontSize: 12,
    fontWeight: '900',
  },
  arrow: {
    color: colors.textMuted,
    fontSize: 12,
  },
});

const roleLabelStyle = {
  claim: { ...styles.roleLabel, color: colors.roleClaim },
  confirm: { ...styles.roleLabel, color: colors.roleConfirm },
};
