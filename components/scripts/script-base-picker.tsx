import { Check, ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SearchBox } from '@/components/search-box';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { StoredScript } from '@/types/game';

type ScriptBasePickerProps = {
  baseScriptId?: string;
  /** The scripts that can be chosen as the base. */
  candidates: StoredScript[];
  onBack: () => void;
  onSelect: (baseScriptId: string | null) => void;
  scriptName: string;
};

/** The list inside the ⋯ sheet for choosing the script whose win rates this script counts with. */
export function ScriptBasePicker({
  baseScriptId,
  candidates,
  onBack,
  onSelect,
  scriptName,
}: ScriptBasePickerProps) {
  const [searchText, setSearchText] = useState('');
  const query = searchText.trim().toLocaleLowerCase();
  const visibleCandidates = query
    ? candidates.filter(
        (script) =>
          script.name.toLocaleLowerCase().includes(query) ||
          script.author?.toLocaleLowerCase().includes(query),
      )
    : candidates;
  const hasBase = candidates.some((script) => script.id === baseScriptId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back to actions"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ChevronLeft color={colors.textMuted} size={18} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.title}>
            Base script
          </Text>
          <Text numberOfLines={1} style={styles.hint}>
            {scriptName} counts win rates as the same script as its base.
          </Text>
        </View>
      </View>
      <SearchBox label="Search scripts" onChangeText={setSearchText} value={searchText} />
      <ScrollView
        contentContainerStyle={styles.options}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={styles.list}
      >
        {query ? null : (
          <BaseOption label="No base script" onPress={() => onSelect(null)} selected={!hasBase} />
        )}
        {visibleCandidates.length === 0 ? (
          <Text selectable style={styles.empty}>
            No scripts match that search.
          </Text>
        ) : null}
        {visibleCandidates.map((script) => (
          <BaseOption
            detail={script.author ? `by ${script.author}` : undefined}
            key={script.id}
            label={script.name}
            onPress={() => onSelect(script.id)}
            selected={script.id === baseScriptId}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function BaseOption({
  detail,
  label,
  onPress,
  selected,
}: {
  detail?: string;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.check, selected && styles.optionSelected]}>
        {selected ? <Check color={colors.primary} size={15} strokeWidth={3} /> : null}
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{label}</Text>
        {detail ? <Text style={styles.hint}>{detail}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  check: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  container: { gap: 12 },
  empty: { color: colors.textMuted, fontSize: 14, padding: 12 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  headerText: { flex: 1, gap: 2 },
  hint: { color: colors.textMuted, fontSize: 12 },
  list: { flexGrow: 0, flexShrink: 1 },
  option: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  optionLabel: { color: colors.text, fontWeight: '800' },
  options: { gap: 8, paddingBottom: 4 },
  optionSelected: { borderColor: colors.primary },
  optionText: { flex: 1, gap: 2 },
  pressed: { backgroundColor: colors.surfacePressed },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
});
