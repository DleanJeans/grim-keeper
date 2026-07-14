import { BookOpen, Check, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

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
  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
        Game script
      </Text>
      <View style={{ gap: 8 }}>
        <ScriptOption
          description="Assign roles later from the game screen"
          label="No script"
          selected={selectedScriptId === null}
          onPress={() => onSelect(null)}
        />
        {scripts.map((script) => (
          <ScriptOption
            description={`${script.roles.length} roles${script.author ? ` · ${script.author}` : ''}`}
            key={script.id}
            label={script.name}
            selected={selectedScriptId === script.id}
            onPress={() => onSelect(script.id)}
          />
        ))}
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
    </View>
  );
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
