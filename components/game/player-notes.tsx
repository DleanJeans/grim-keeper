import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { RoleReference } from '@/components/role-reference';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

export function PlayerNoteRoleAssignment({
  kind,
  roles,
  scriptId,
}: {
  kind: 'claim' | 'confirm';
  roles: Role[];
  scriptId?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={roleLabelStyle[kind]}>{kind === 'confirm' ? 'Confirmed' : 'Claimed'}</Text>
      {kind === 'confirm' ? <Check color={colors.roleConfirm} size={14} strokeWidth={3} /> : null}
      {roles.map((role) => (
        <RoleReference
          iconSize={18}
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
});

const roleLabelStyle = {
  claim: { ...styles.roleLabel, color: colors.roleClaim },
  confirm: { ...styles.roleLabel, color: colors.roleConfirm },
};
