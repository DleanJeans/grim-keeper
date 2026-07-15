import { Plus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { RoleNotes } from '@/components/role-notes';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role, StoredScript } from '@/types/game';
import { addRoleToScript, removeRoleFromScript } from '@/utils/role-utils';

type ScriptRoleEditorProps = {
  roleCatalog: Role[];
  script: StoredScript;
  onChange: (script: StoredScript) => void;
};

export function ScriptRoleEditor({ onChange, roleCatalog, script }: ScriptRoleEditorProps) {
  const [query, setQuery] = useState('');
  const selectedRoleIds = useMemo(
    () => new Set(script.roles.map((role) => role.id)),
    [script.roles],
  );
  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return roleCatalog
      .filter((role) => !selectedRoleIds.has(role.id))
      .filter(
        (role) =>
          !normalizedQuery ||
          role.name.toLocaleLowerCase().includes(normalizedQuery) ||
          role.id.toLocaleLowerCase().includes(normalizedQuery),
      )
      .slice(0, 8);
  }, [query, roleCatalog, selectedRoleIds]);

  return (
    <View style={{ gap: 10 }}>
      <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '800' }}>
        Roles in this script
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {script.roles.map((role) => (
          <RoleChip
            key={role.id}
            role={role}
            onRemove={() => onChange(removeRoleFromScript(script, role.id))}
          />
        ))}
      </View>
      <TextInput
        autoCapitalize="words"
        autoCorrect={false}
        onChangeText={setQuery}
        placeholder="Add a role"
        placeholderTextColor={colors.textSubtle}
        value={query}
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: 8,
          borderWidth: 1,
          color: colors.text,
          minHeight: 44,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />
      {query.trim() ? (
        <View style={{ gap: 6 }}>
          {suggestions.length === 0 ? (
            <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
              No matching roles.
            </Text>
          ) : (
            suggestions.map((role) => (
              <Pressable
                accessibilityLabel={`Add ${role.name} to ${script.name}`}
                accessibilityRole="button"
                key={role.id}
                onPress={() => {
                  onChange(addRoleToScript(script, role));
                  setQuery('');
                }}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: pressed ? colors.surfacePressed : colors.surface,
                  borderColor: colors.border,
                  borderRadius: 8,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                })}
              >
                <Plus color={colors.success} size={16} strokeWidth={2.6} />
                <RoleIcon role={role} size={24} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={{ color: colors.text, fontWeight: '700' }}>
                    {role.name}
                  </Text>
                  <RoleNotes compact role={role} />
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

function RoleChip({ onRemove, role }: { onRemove: () => void; role: Role }) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: colors.surfaceRaised,
        borderColor: colors.borderStrong,
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 6,
        paddingLeft: 10,
        paddingRight: 6,
        paddingVertical: 6,
      }}
    >
      <RoleIcon role={role} size={24} />
      <View style={{ gap: 2 }}>
        <Text selectable style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
          {role.name}
        </Text>
        <RoleNotes compact role={role} />
      </View>
      <Pressable
        accessibilityLabel={`Remove ${role.name} from script`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={onRemove}
      >
        <X color={colors.textMuted} size={15} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
