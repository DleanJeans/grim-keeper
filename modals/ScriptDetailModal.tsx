import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import RoleIcon from '../components/RoleIcon';
import { TEAMS } from '../constants';
import { getRoles, TEAM_COLORS, TEAM_ORDER } from '../data/roles';

interface ScriptDetailModalProps {
  visible: boolean;
  scriptName: string;
  roleIds: string[];
  author?: string;
  version?: string;
  onClose: () => void;
  onSave?: () => void;
}

export default function ScriptDetailModal({
  visible,
  scriptName,
  roleIds,
  author,
  version,
  onClose,
  onSave,
}: ScriptDetailModalProps) {
  // Group roles by team

  const roles = getRoles();
  const grouped = TEAMS.map(team => ({
    team,
    roles: roleIds
      .map(id => roles[id])
      .filter(
        (r): r is NonNullable<typeof r> => r !== undefined && r.team === team,
      ),
  }))
    .filter(g => g.roles.length > 0)
    .sort((a, b) => (TEAM_ORDER[a.team] ?? 99) - (TEAM_ORDER[b.team] ?? 99));

  const unknownCount = roleIds.filter(id => !roles[id]).length;

  console.log({
    grouped,
    unknownCount,
  });

  return (
    <Modal accessible={false} visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{scriptName}</Text>
            <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>{roleIds.length} roles · by {author || 'Unknown'} · v{version}</Text>

          {/* Role list */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {grouped.map(group => (
              <View key={group.team}>
                <Text
                  style={[
                    styles.teamLabel,
                    {
                      color: TEAM_COLORS[group.team],
                    },
                  ]}
                >
                  {group.team.charAt(0).toUpperCase() + group.team.slice(1)} (
                  {group.roles.length})
                </Text>
                {group.roles.map(role => (
                  <View key={role.id} style={styles.roleRow}>
                    <RoleIcon
                      roleId={role.id}
                      team={role.team}
                      size={64}
                      circular
                      showBorder
                    />
                    <View style={styles.roleInfo}>
                      <Text style={styles.roleName}>{role.name}</Text>
                      <Text style={styles.roleAbility} numberOfLines={2}>
                        {role.ability}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
            {unknownCount > 0 && (
              <Text accessibilityLabel="Unknown roles" style={styles.unknownText}>
                {unknownCount} unknown role{unknownCount > 1 ? 's' : ''}
              </Text>
            )}
            <View
              style={{
                height: 40,
              }}
            />
          </ScrollView>

          {/* Save button */}
          {onSave && (
            <View style={styles.footer}>
              <Pressable accessibilityLabel="Save Script" style={styles.saveBtn} onPress={onSave}>
                <Text style={styles.saveBtnText}>Save Script</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#1e1f23',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get('window').height * 0.85,
    paddingTop: 16,
    paddingHorizontal: 20,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2f313a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  teamLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c30',
    gap: 16,
  },
  roleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roleName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  roleAbility: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  unknownText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2c30',
  },
  saveBtn: {
    backgroundColor: '#166534',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
