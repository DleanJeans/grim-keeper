import { BookOpen, Check, ChevronDown, ChevronRight, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { StoredScript } from '@/types/game';

type GameScriptPickerProps = {
  scripts: StoredScript[];
  selectedScriptId: string | null;
  onBrowse: () => void;
  onSelect: (scriptId: string | null) => void;
};

export function GameScriptPicker({
  onBrowse,
  onSelect,
  scripts,
  selectedScriptId,
}: GameScriptPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedScript = scripts.find((script) => script.id === selectedScriptId);

  function handleSelect(scriptId: string | null) {
    onSelect(scriptId);
    setPickerOpen(false);
  }

  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
        Game script
      </Text>
      <View style={{ gap: 8 }}>
        <Pressable
          accessibilityHint="Open the list of downloaded scripts"
          accessibilityLabel={`Game script: ${selectedScript?.name ?? 'No script'}`}
          accessibilityRole="button"
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: pressed ? colors.surfacePressed : colors.surface,
            borderColor: colors.border,
            borderRadius: 8,
            borderWidth: 1,
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 12,
            paddingVertical: 11,
          })}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text selectable style={{ color: colors.text, fontWeight: '800' }}>
              {selectedScript?.name ?? 'No script'}
            </Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>
              {getScriptDescription(selectedScript)}
            </Text>
          </View>
          <ChevronDown color={colors.textMuted} size={18} strokeWidth={2.6} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onBrowse}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: pressed ? colors.surfacePressed : colors.surfaceRaised,
            borderColor: colors.borderStrong,
            borderRadius: 8,
            borderWidth: 1,
            flexDirection: 'row',
            gap: 8,
            justifyContent: 'center',
            paddingHorizontal: 12,
            paddingVertical: 12,
          })}
        >
          <BookOpen color={colors.text} size={17} strokeWidth={2.5} />
          <Text style={{ color: colors.text, fontWeight: '800' }}>Select or download a script</Text>
          <ChevronRight color={colors.textMuted} size={16} strokeWidth={2.5} />
        </Pressable>
      </View>
      <Modal
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
        transparent
        visible={pickerOpen}
      >
        <View style={{ backgroundColor: '#00000099', flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            accessibilityLabel="Close script picker"
            accessibilityRole="button"
            onPress={() => setPickerOpen(false)}
            style={{ flex: 1 }}
          />
          <View
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderRadius: 16,
              borderWidth: 1,
              gap: 12,
              maxHeight: '82%',
              padding: 16,
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
              <Text
                selectable
                style={{ color: colors.text, flex: 1, fontSize: 18, fontWeight: '900' }}
              >
                Select game script
              </Text>
              <Pressable
                accessibilityLabel="Close script picker"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setPickerOpen(false)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: pressed ? colors.surfacePressed : colors.surfaceRaised,
                  borderRadius: 8,
                  height: 32,
                  justifyContent: 'center',
                  width: 32,
                })}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
              contentInsetAdjustmentBehavior="automatic"
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={{ flexShrink: 1 }}
            >
              <ScriptOption
                description="Assign roles later from the game screen"
                label="No script"
                selected={selectedScriptId === null}
                onPress={() => handleSelect(null)}
              />
              {scripts.map((script) => (
                <ScriptOption
                  description={getScriptDescription(script)}
                  key={script.id}
                  label={script.name}
                  selected={selectedScriptId === script.id}
                  onPress={() => handleSelect(script.id)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getScriptDescription(script?: StoredScript) {
  if (!script) {
    return 'Assign roles later from the game screen';
  }

  return `${script.roles.length} roles${script.author ? ` · ${script.author}` : ''}`;
}

function ScriptOption({
  description,
  label,
  onPress,
  selected,
}: {
  description: string;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? colors.surfacePressed : colors.surface,
        borderColor: selected ? colors.primary : colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 11,
      })}
    >
      <View
        style={{
          alignItems: 'center',
          borderColor: selected ? colors.primary : colors.borderStrong,
          borderRadius: 999,
          borderWidth: 1,
          height: 24,
          justifyContent: 'center',
          width: 24,
        }}
      >
        {selected ? <Check color={colors.primary} size={15} strokeWidth={3} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text selectable style={{ color: colors.text, fontWeight: '800' }}>
          {label}
        </Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
