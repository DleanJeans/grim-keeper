import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import {
  createPdfScriptJson,
  getRoleSuggestions,
  type PdfScriptDraft,
  type PdfScriptRoleChoice,
  type PdfScriptUnmatchedRole,
} from '@/utils/pdf-script-parser';

const TEAM_LABELS: Record<string, string> = {
  demon: 'Demons',
  fabled: 'Fabled',
  loric: 'Loric',
  minion: 'Minions',
  outsider: 'Outsiders',
  townsfolk: 'Townsfolk',
  traveller: 'Travellers',
};

const TEAM_ORDER = ['townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled', 'loric'];

type PdfScriptReviewProps = {
  catalog: Role[];
  draft: PdfScriptDraft;
  /** The PDF's file name, used when the PDF has no readable title. */
  fallbackName: string;
  onCancel: () => void;
  onSave: (value: string, fallbackName: string) => Promise<boolean>;
};

export function PdfScriptReview({
  catalog,
  draft,
  fallbackName,
  onCancel,
  onSave,
}: PdfScriptReviewProps) {
  const [name, setName] = useState(draft.name ?? fallbackName);
  const [author, setAuthor] = useState(draft.author ?? '');
  const [choices, setChoices] = useState<ReadonlyMap<string, PdfScriptRoleChoice>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const roleCount = draft.roles.length + choices.size;

  function choose(unmatchedName: string, choice: PdfScriptRoleChoice) {
    setChoices((current) => {
      const next = new Map(current);
      // Pressing the selected option again clears it, which skips the name.
      if (isSameChoice(current.get(unmatchedName), choice)) {
        next.delete(unmatchedName);
      } else {
        next.set(unmatchedName, choice);
      }
      return next;
    });
  }

  async function save() {
    setIsSaving(true);

    try {
      await onSave(createPdfScriptJson({ ...draft, author, name }, choices, catalog), fallbackName);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text selectable style={styles.title}>
        Review PDF import
      </Text>
      <TextInput
        accessibilityLabel="Script name"
        autoCapitalize="words"
        autoCorrect={false}
        onChangeText={setName}
        placeholder={fallbackName}
        placeholderTextColor={colors.textSubtle}
        value={name}
        style={styles.input}
      />
      <TextInput
        accessibilityLabel="Script author"
        autoCapitalize="words"
        autoCorrect={false}
        onChangeText={setAuthor}
        placeholder="Author (optional)"
        placeholderTextColor={colors.textSubtle}
        value={author}
        style={styles.input}
      />

      <Text selectable style={styles.sectionTitle}>
        {draft.roles.length === 1 ? 'Found 1 character' : `Found ${draft.roles.length} characters`}
      </Text>
      {getTeamGroups(draft.roles).map((group) => (
        <TeamRoleNames key={group.team} label={group.label} roles={group.roles} />
      ))}

      {draft.unmatched.length > 0 ? (
        <>
          <Text selectable style={styles.sectionTitle}>
            {`Not matched (${draft.unmatched.length})`}
          </Text>
          <Text selectable style={styles.description}>
            Pick the official character, keep the name as a custom character, or leave it unselected
            to skip it. You can add more characters later from Customize.
          </Text>
          {draft.unmatched.map((unmatched) => (
            <UnmatchedRoleRow
              choice={choices.get(unmatched.name)}
              key={unmatched.name}
              onChoose={(choice) => choose(unmatched.name, choice)}
              suggestions={getRoleSuggestions(unmatched.name, catalog)}
              unmatched={unmatched}
            />
          ))}
        </>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Cancel PDF import"
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
        >
          <Text style={styles.cancelButtonLabel}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Save PDF script"
          accessibilityRole="button"
          disabled={roleCount === 0 || isSaving}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
            (roleCount === 0 || isSaving) && styles.saveButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.saveButtonLabel,
              (roleCount === 0 || isSaving) && styles.saveButtonLabelDisabled,
            ]}
          >
            {isSaving ? 'Saving…' : `Save script (${roleCount})`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function getTeamGroups(roles: Role[]) {
  const rolesByTeam = new Map<string, Role[]>();

  for (const role of roles) {
    const team = role.team && TEAM_LABELS[role.team] ? role.team : 'other';
    rolesByTeam.set(team, [...(rolesByTeam.get(team) ?? []), role]);
  }

  return [...TEAM_ORDER, 'other'].flatMap((team) => {
    const teamRoles = rolesByTeam.get(team);
    return teamRoles ? [{ label: TEAM_LABELS[team] ?? 'Other', roles: teamRoles, team }] : [];
  });
}

function isSameChoice(first: PdfScriptRoleChoice | undefined, second: PdfScriptRoleChoice) {
  return (
    first?.kind === second.kind &&
    (first.kind === 'custom' || (second.kind === 'role' && first.roleId === second.roleId))
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  cancelButtonLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cancelButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  chip: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  chipLabelSelected: {
    color: colors.onPrimary,
  },
  chipPressed: {
    backgroundColor: colors.surfacePressed,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderCurve: 'continuous',
    borderRadius: 8,
    flex: 2,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonLabel: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  saveButtonLabelDisabled: {
    color: colors.onDisabled,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  teamNames: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  teamLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  unmatchedName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  unmatchedRow: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 10,
  },
  unmatchedStatus: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '400',
  },
});

function TeamRoleNames({ label, roles }: { label: string; roles: Role[] }) {
  return (
    <Text selectable style={styles.teamNames}>
      <Text style={styles.teamLabel}>{`${label}: `}</Text>
      {roles.map((role) => role.name).join(', ')}
    </Text>
  );
}

function UnmatchedRoleRow({
  choice,
  onChoose,
  suggestions,
  unmatched,
}: {
  choice?: PdfScriptRoleChoice;
  onChoose: (choice: PdfScriptRoleChoice) => void;
  suggestions: Role[];
  unmatched: PdfScriptUnmatchedRole;
}) {
  const teamLabel = unmatched.team ? TEAM_LABELS[unmatched.team] : undefined;
  const status = !choice
    ? 'Skipped'
    : choice.kind === 'custom'
      ? 'Custom character'
      : `Saved as ${suggestions.find((role) => role.id === choice.roleId)?.name ?? choice.roleId}`;

  return (
    <View style={styles.unmatchedRow}>
      <Text selectable style={styles.unmatchedName}>
        {unmatched.name}
        <Text style={styles.unmatchedStatus}>
          {`${teamLabel ? ` · ${teamLabel}` : ''} · ${status}`}
        </Text>
      </Text>
      <View style={styles.chips}>
        {suggestions.map((role) => (
          <ChoiceChip
            key={role.id}
            label={role.name}
            onPress={() => onChoose({ kind: 'role', roleId: role.id })}
            selected={choice?.kind === 'role' && choice.roleId === role.id}
          />
        ))}
        <ChoiceChip
          label="Keep as custom"
          onPress={() => onChoose({ kind: 'custom' })}
          selected={choice?.kind === 'custom'}
        />
      </View>
    </View>
  );
}

function ChoiceChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && !selected && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}
