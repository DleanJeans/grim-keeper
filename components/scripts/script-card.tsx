import { Check, ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role, StoredScript } from '@/types/game';

import { ScriptRoleEditor } from './script-role-editor';

type ScriptCardProps = {
  canSelect: boolean;
  editing: boolean;
  roleCatalog: Role[];
  script: StoredScript;
  onDelete: () => void;
  onEdit: () => void;
  onSelect: () => void;
  onView: () => void;
  onUpdate: (script: StoredScript) => void;
};

export function ScriptCard({
  canSelect,
  editing,
  onDelete,
  onEdit,
  onSelect,
  onView,
  onUpdate,
  roleCatalog,
  script,
}: ScriptCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 14,
        padding: 14,
      }}
    >
      <View style={{ gap: 4 }}>
        <Pressable
          accessibilityHint="Opens the script details"
          accessibilityRole="button"
          onPress={onView}
          style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
        >
          <Text
            selectable
            style={{
              color: colors.primary,
              fontSize: 17,
              fontWeight: '900',
              textDecorationLine: 'underline',
            }}
          >
            {script.name}
          </Text>
        </Pressable>
        <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
          {script.author ? `${script.author} · ` : ''}v{script.version} · {script.roles.length}{' '}
          roles
        </Text>
      </View>

      {editing ? (
        <ScriptRoleEditor onChange={onUpdate} roleCatalog={roleCatalog} script={script} />
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {canSelect ? (
          <ScriptCardButton icon={Check} label="Select" onPress={onSelect} variant="primary" />
        ) : null}
        <ScriptCardButton
          icon={editing ? ChevronUp : ChevronDown}
          label={editing ? 'Close' : 'Customize'}
          onPress={onEdit}
        />
        <ScriptCardButton
          icon={Trash2}
          iconOnly
          label="Delete"
          onPress={onDelete}
          variant="danger"
        />
      </View>
    </View>
  );
}

function ScriptCardButton({
  icon: Icon,
  iconOnly = false,
  label,
  onPress,
  variant = 'neutral',
}: {
  icon: typeof Check;
  iconOnly?: boolean;
  label: string;
  onPress: () => void;
  variant?: 'danger' | 'neutral' | 'primary';
}) {
  const palette = {
    danger: {
      background: colors.dangerSurface,
      border: '#7f1d1d',
      icon: colors.danger,
      text: colors.danger,
    },
    neutral: {
      background: colors.surfaceRaised,
      border: colors.borderStrong,
      icon: colors.textMuted,
      text: colors.text,
    },
    primary: {
      background: colors.primary,
      border: colors.primary,
      icon: colors.onPrimary,
      text: colors.onPrimary,
    },
  }[variant];

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? colors.surfacePressed : palette.background,
        borderColor: palette.border,
        borderRadius: 8,
        borderWidth: 1,
        flex: iconOnly ? 0 : 1,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        minWidth: iconOnly ? 44 : 0,
        paddingHorizontal: iconOnly ? 12 : 8,
        paddingVertical: 10,
      })}
    >
      <Icon color={palette.icon} size={15} strokeWidth={2.6} />
      {iconOnly ? null : (
        <Text style={{ color: palette.text, fontSize: 13, fontWeight: '800' }}>{label}</Text>
      )}
    </Pressable>
  );
}
