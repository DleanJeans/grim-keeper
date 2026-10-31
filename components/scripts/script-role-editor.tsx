import { Plus, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RoleReference } from '@/components/role-reference';
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
  const [scriptName, setScriptName] = useState(script.name);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setScriptName(script.name);
  }, [script.name]);

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

  function commitScriptName() {
    const nextName = scriptName.trim();

    if (!nextName) {
      setScriptName(script.name);
      return;
    }

    if (nextName !== script.name) {
      onChange({ ...script, name: nextName });
    }
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.label}>
        Script name
      </Text>
      <TextInput
        autoCapitalize="words"
        autoCorrect={false}
        accessibilityLabel="Script name"
        enterKeyHint="done"
        onBlur={commitScriptName}
        onChangeText={setScriptName}
        onSubmitEditing={commitScriptName}
        placeholder="Script name"
        placeholderTextColor={colors.textSubtle}
        returnKeyType="done"
        submitBehavior="submit"
        value={scriptName}
        style={styles.input}
      />
      <Text selectable style={styles.label}>
        Roles in this script
      </Text>
      <View style={styles.chips}>
        {script.roles.map((role) => (
          <RoleChip
            key={role.id}
            role={role}
            scriptId={script.id}
            onRemove={() => onChange(removeRoleFromScript(script, role.id))}
          />
        ))}
      </View>
      <TextInput
        autoCapitalize="words"
        autoCorrect={false}
        accessibilityLabel="Add a role"
        onChangeText={setQuery}
        placeholder="Add a role"
        placeholderTextColor={colors.textSubtle}
        value={query}
        style={styles.input}
      />
      {query.trim() ? (
        <View style={styles.suggestions}>
          {suggestions.length === 0 ? (
            <Text selectable style={styles.noMatches}>
              No matching roles.
            </Text>
          ) : (
            suggestions.map((role) => (
              <RoleReference
                accessibilityLabel={`Add ${role.name} to ${script.name}`}
                key={role.id}
                leading={<Plus color={colors.success} size={16} strokeWidth={2.6} />}
                onPress={() => {
                  onChange(addRoleToScript(script, role));
                  setQuery('');
                }}
                role={role}
                scriptId={script.id}
                containerStyle={({ pressed }) => [
                  styles.suggestion,
                  pressed && styles.suggestionPressed,
                ]}
                contentStyle={styles.suggestionContent}
                textStyle={styles.suggestionText}
              />
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

function RoleChip({
  onRemove,
  role,
  scriptId,
}: {
  onRemove: () => void;
  role: Role;
  scriptId: string;
}) {
  return (
    <View style={styles.chip}>
      <RoleReference role={role} scriptId={scriptId} textStyle={styles.chipText} />
      <Pressable
        accessibilityLabel={`Remove ${role.name} from script`}
        accessibilityRole="button"
        hitSlop={15}
        onPress={onRemove}
      >
        <X color={colors.textMuted} size={15} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
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
  },
  chipText: {
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  container: {
    gap: 10,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  noMatches: {
    color: colors.textMuted,
    fontSize: 13,
  },
  suggestion: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  suggestionText: {
    color: colors.text,
    fontWeight: '700',
  },
  suggestions: {
    gap: 6,
  },
});
