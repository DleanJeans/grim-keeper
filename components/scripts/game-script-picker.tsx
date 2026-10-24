import { BookOpen, Check, ChevronDown, ChevronRight, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SearchBox } from '@/components/search-box';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { StoredScript } from '@/types/game';
import { SUSHI_BUFFET_SCRIPT_ID } from '@/utils/script-constants';

const PICKER_TRIGGER_CHROME_HEIGHT = 24;

type GameScriptPickerProps = {
  featuredScript?: StoredScript;
  scripts: StoredScript[];
  selectedScriptId: string | null;
  onBrowse: () => void;
  onSelect: (scriptId: string | null) => void;
  onTriggerHeightChange?: (height: number) => void;
  scriptPlayCounts?: ReadonlyMap<string, number>;
  triggerHeight?: number;
};

export function GameScriptPicker({
  featuredScript,
  onBrowse,
  onSelect,
  onTriggerHeightChange,
  scriptPlayCounts,
  scripts,
  selectedScriptId,
  triggerHeight,
}: GameScriptPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectableScripts = scripts.filter((script) => script.id !== SUSHI_BUFFET_SCRIPT_ID);
  const selectedScript = [featuredScript, ...selectableScripts].find(
    (script) => script?.id === selectedScriptId,
  );
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const visibleFeaturedScript =
    featuredScript && matchesScriptSearch(featuredScript, normalizedQuery)
      ? featuredScript
      : undefined;
  const visibleScripts = selectableScripts.filter((script) =>
    matchesScriptSearch(script, normalizedQuery),
  );

  function closePicker() {
    setPickerOpen(false);
    setSearchQuery('');
  }

  function handleSelect(scriptId: string | null) {
    onSelect(scriptId);
    closePicker();
  }

  function handleBrowse() {
    closePicker();
    onBrowse();
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.label}>
        Game script
      </Text>
      <View style={styles.container}>
        <Pressable
          accessibilityHint="Open the list of downloaded scripts"
          accessibilityLabel={`Game script: ${selectedScript?.name ?? 'No script'}`}
          accessibilityRole="button"
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [
            styles.trigger,
            triggerHeight ? { height: triggerHeight } : null,
            pressed && styles.surfacePressed,
          ]}
        >
          <View
            onLayout={(event) =>
              onTriggerHeightChange?.(
                Math.ceil(event.nativeEvent.layout.height + PICKER_TRIGGER_CHROME_HEIGHT),
              )
            }
            style={styles.optionText}
          >
            <Text selectable style={styles.optionTitle}>
              {selectedScript?.name ?? 'No script'}
            </Text>
            <Text selectable style={styles.optionDetail}>
              {getScriptDescription(selectedScript)}
            </Text>
          </View>
          <ChevronDown color={colors.textMuted} size={18} strokeWidth={2.6} />
        </Pressable>
      </View>
      <Modal animationType="slide" onRequestClose={closePicker} transparent visible={pickerOpen}>
        <KeyboardAvoidingView
          behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
          style={styles.backdrop}
        >
          <Pressable
            accessibilityLabel="Close script picker"
            accessibilityRole="button"
            onPress={closePicker}
            style={styles.backdropPressable}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text selectable style={styles.sheetTitle}>
                Select game script
              </Text>
              <Pressable
                accessibilityLabel="Close script picker"
                accessibilityRole="button"
                hitSlop={8}
                onPress={closePicker}
                style={({ pressed }) => [styles.closeButton, pressed && styles.surfacePressed]}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            <SearchBox label="Search scripts" onChangeText={setSearchQuery} value={searchQuery} />
            <ScrollView
              contentContainerStyle={styles.optionsContent}
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={styles.options}
            >
              {visibleFeaturedScript ? (
                <ScriptOption
                  description="Built-in script with a customizable role pool"
                  label={visibleFeaturedScript.name}
                  onPress={() => handleSelect(visibleFeaturedScript.id)}
                  selected={selectedScriptId === visibleFeaturedScript.id}
                />
              ) : null}
              {normalizedQuery ? null : (
                <ScriptOption
                  description="Assign roles later from the game screen"
                  label="No script"
                  selected={selectedScriptId === null}
                  onPress={() => handleSelect(null)}
                />
              )}
              {normalizedQuery && !visibleFeaturedScript && visibleScripts.length === 0 ? (
                <Text selectable style={styles.emptyText}>
                  No scripts match that search.
                </Text>
              ) : null}
              {visibleScripts.map((script) => (
                <ScriptOption
                  description={getScriptOptionDescription(script, scriptPlayCounts?.get(script.id))}
                  author={script.author}
                  key={script.id}
                  label={script.name}
                  selected={selectedScriptId === script.id}
                  onPress={() => handleSelect(script.id)}
                />
              ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={handleBrowse}
              style={({ pressed }) => [styles.browseButton, pressed && styles.surfacePressed]}
            >
              <BookOpen color={colors.text} size={17} strokeWidth={2.5} />
              <Text style={styles.optionTitle}>Select or download a script</Text>
              <ChevronRight color={colors.textMuted} size={16} strokeWidth={2.5} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function matchesScriptSearch(script: StoredScript, normalizedQuery: string) {
  return (
    !normalizedQuery ||
    script.name.toLocaleLowerCase().includes(normalizedQuery) ||
    Boolean(script.author?.toLocaleLowerCase().includes(normalizedQuery))
  );
}

function getScriptOptionDescription(script: StoredScript, playCount?: number) {
  const description = `${script.roles.length} roles`;

  if (playCount === undefined) {
    return description;
  }

  return `${description} · ${playCount} ${playCount === 1 ? 'game' : 'games'} tracked`;
}

function getScriptDescription(script?: StoredScript) {
  if (!script) {
    return 'Assign roles later in game';
  }

  return `${script.roles.length} roles${script.author ? ` · ${script.author}` : ''}`;
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: colors.backdrop,
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  browseButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  container: {
    gap: 8,
  },
  emptyText: { color: colors.textMuted, fontSize: 14, padding: 12 },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  optionDetail: {
    color: colors.textMuted,
    fontSize: 12,
  },
  options: {
    flexGrow: 0,
    flexShrink: 1,
  },
  optionsContent: {
    gap: 8,
    paddingBottom: 4,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  selected: {
    borderColor: colors.primary,
  },
  sheet: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    maxHeight: '82%',
    padding: 16,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  sheetTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  surfacePressed: {
    backgroundColor: colors.surfacePressed,
  },
  trigger: {
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
});

function ScriptOption({
  author,
  description,
  label,
  onPress,
  selected,
}: {
  author?: string;
  description: string;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.trigger,
        selected && styles.selected,
        pressed && styles.surfacePressed,
      ]}
    >
      <View style={[styles.check, selected && styles.selected]}>
        {selected ? <Check color={colors.primary} size={15} strokeWidth={3} /> : null}
      </View>
      <View style={styles.optionText}>
        <Text selectable style={styles.optionTitle}>
          {label}
        </Text>
        {author ? <Text style={styles.optionDetail}>by {author}</Text> : null}
        <Text selectable style={styles.optionDetail}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
