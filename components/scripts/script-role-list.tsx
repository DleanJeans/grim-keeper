import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ReactElement } from 'react';
import { Pressable, SectionList, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { getSavedNoteTextsForRole } from '@/utils/saved-note-utils';

const ROLE_SECTIONS = [
  { label: 'Townsfolk', team: 'townsfolk' },
  { label: 'Outsider', team: 'outsider' },
  { label: 'Minion', team: 'minion' },
  { label: 'Demon', team: 'demon' },
] as const;

export function ScriptRoleList({
  header,
  roleCatalog,
  roles,
  scriptId,
}: {
  header: ReactElement;
  roleCatalog: Role[];
  roles: Role[];
  scriptId: string;
}) {
  const savedNotes = useGameStore((state) => state.savedNotes);
  const sections = ROLE_SECTIONS.map(({ label, team }) => ({
    title: label,
    data: roles
      .filter((role) => role.team?.toLocaleLowerCase() === team)
      .map((role) => {
        const catalogRole = roleCatalog.find((candidate) => candidate.id === role.id);
        const displayRole = {
          ...role,
          notes: [...new Set([...(role.notes ?? []), ...(catalogRole?.notes ?? [])])],
        };

        return {
          description: role.ability ?? catalogRole?.ability,
          noteCount: new Set([
            ...displayRole.notes,
            ...getSavedNoteTextsForRole(savedNotes, role.id),
          ]).size,
          role: displayRole,
        };
      }),
  })).filter(({ data }) => data.length > 0);

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      ListHeaderComponent={header}
      ListHeaderComponentStyle={{ paddingBottom: 8 }}
      renderItem={({ item }) => (
        <View style={{ paddingBottom: 10 }}>
          <ScriptRoleDetail
            description={item.description}
            noteCount={item.noteCount}
            onPress={() =>
              router.push({
                pathname: '/role-notes',
                params: { roleId: item.role.id, scriptId },
              })
            }
            role={item.role}
          />
        </View>
      )}
      renderSectionHeader={({ section }) => <ScriptRoleSectionHeader label={section.title} />}
      sections={sections}
      stickySectionHeadersEnabled
      style={{ backgroundColor: colors.background, flex: 1 }}
    />
  );
}

function ScriptRoleSectionHeader({ label }: { label: string }) {
  return (
    <View style={{ backgroundColor: colors.background, paddingBottom: 10, paddingTop: 10 }}>
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
