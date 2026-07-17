import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role, SavedNote } from '@/types/game';
import { getSavedNoteTextsForRole } from '@/utils/saved-note-utils';

const ROLE_SECTIONS = [
  { label: 'Townsfolk', team: 'townsfolk' },
  { label: 'Outsider', team: 'outsider' },
  { label: 'Minion', team: 'minion' },
  { label: 'Demon', team: 'demon' },
] as const;

export function ScriptRoleList({
  roleCatalog,
  roles,
  scriptId,
}: {
  roleCatalog: Role[];
  roles: Role[];
  scriptId: string;
}) {
  const savedNotes = useGameStore((state) => state.savedNotes);

  return (
    <View style={{ gap: 18 }}>
      {ROLE_SECTIONS.map(({ label, team }) => {
        const sectionRoles = roles.filter((role) => role.team?.toLocaleLowerCase() === team);

        return sectionRoles.length > 0 ? (
          <ScriptRoleSection
            key={team}
            label={label}
            roleCatalog={roleCatalog}
            roles={sectionRoles}
            savedNotes={savedNotes}
            scriptId={scriptId}
          />
        ) : null;
      })}
    </View>
  );
}

function ScriptRoleSection({
  label,
  roleCatalog,
  roles,
  savedNotes,
  scriptId,
}: {
  label: string;
  roleCatalog: Role[];
  roles: Role[];
  savedNotes: SavedNote[];
  scriptId: string;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text
        selectable
        style={{
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '900',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      {roles.map((role) => {
        const catalogRole = roleCatalog.find((candidate) => candidate.id === role.id);
        const displayRole = {
          ...role,
          notes: [...new Set([...(role.notes ?? []), ...(catalogRole?.notes ?? [])])],
        };
        const noteCount = new Set([
          ...displayRole.notes,
          ...getSavedNoteTextsForRole(savedNotes, role.id),
        ]).size;

        return (
          <ScriptRoleDetail
            key={role.id}
            role={displayRole}
            description={role.ability ?? catalogRole?.ability}
            noteCount={noteCount}
            onPress={() =>
              router.push({ pathname: '/role-notes', params: { roleId: role.id, scriptId } })
            }
          />
        );
      })}
    </View>
  );
}

function ScriptRoleDetail({
  description,
  noteCount,
  onPress,
  role,
}: {
  description?: string;
  noteCount: number;
  onPress: () => void;
  role: Role;
}) {
  return (
    <Pressable
      accessibilityHint="Opens notes for this role"
      accessibilityLabel={`${role.name} notes`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 10,
        opacity: pressed ? 0.65 : 1,
        padding: 12,
      })}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
        <RoleIcon role={role} size={42} />
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
            {role.name}
          </Text>
        </View>
        <Text
          selectable
          style={{ color: colors.textMuted, fontSize: 12, fontVariant: ['tabular-nums'] }}
        >
          {noteCount} notes
        </Text>
        <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
      </View>
      <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
        {description ?? 'No description available.'}
      </Text>
    </Pressable>
  );
}
