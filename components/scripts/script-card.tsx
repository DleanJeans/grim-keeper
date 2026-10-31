import { Check, ChevronDown, ChevronUp, Copy, Ticket, Trash2 } from 'lucide-react-native';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role, StoredScript } from '@/types/game';
import { formatScriptSize, getScriptSizeBytes, isCustomScript } from '@/utils/script-image-utils';

import { CustomScriptImageControls } from './custom-script-image-controls';
import { ScriptRoleEditor } from './script-role-editor';

type ScriptCardProps = {
  canSelect: boolean;
  editing: boolean;
  gamesPlayed: number;
  /** Your record on this script, e.g. "3W 1L (75%)". */
  winRecord?: string | null;
  roleCatalog: Role[];
  script: StoredScript;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  onSelect: () => void;
  onToggleOneTime: () => void;
  onView: () => void;
  onUpdate: (script: StoredScript) => void;
};

export function ScriptCard({
  canSelect,
  editing,
  gamesPlayed,
  onDelete,
  onDuplicate,
  onEdit,
  onLayout,
  onSelect,
  onToggleOneTime,
  onView,
  onUpdate,
  roleCatalog,
  script,
  winRecord,
}: ScriptCardProps) {
  const custom = isCustomScript(script);

  return (
    <View onLayout={onLayout} style={styles.card}>
      <View style={styles.header}>
        <Pressable
          accessibilityHint="Opens the script details"
          accessibilityRole="button"
          onPress={onView}
          style={({ pressed }) => [styles.titleButton, pressed && styles.titleButtonPressed]}
        >
          <Text selectable style={styles.title}>
            {script.name}
          </Text>
        </Pressable>
        <View style={styles.metadataRow}>
          <Text selectable style={styles.metadata}>
            {script.author ? `${script.author} · ` : ''}v{script.version} · {script.roles.length}{' '}
            roles · {gamesPlayed} {gamesPlayed === 1 ? 'game' : 'games'}
            {winRecord ? ` · ${winRecord}` : ''}
          </Text>
          {custom ? (
            <>
              <View accessibilityLabel="Custom script" style={styles.customTag}>
                <Text selectable style={styles.customTagText}>
                  Custom
                </Text>
              </View>
              <Text selectable style={styles.metadata}>
                {formatScriptSize(getScriptSizeBytes(script))}
              </Text>
            </>
          ) : null}
          {script.oneTime ? (
            <View accessibilityLabel="One-time script" style={styles.customTag}>
              <Text selectable style={styles.customTagText}>
                One-time
              </Text>
            </View>
          ) : null}
        </View>
        {script.oneTime ? (
          <Text selectable style={styles.metadata}>
            Leaves this list once a game uses it. The game keeps its own copy.
          </Text>
        ) : null}
      </View>

      {editing ? (
        <ScriptRoleEditor onChange={onUpdate} roleCatalog={roleCatalog} script={script} />
      ) : null}

      {custom && editing ? <CustomScriptImageControls onUpdate={onUpdate} script={script} /> : null}

      <View style={styles.actions}>
        {canSelect ? (
          <ScriptCardButton icon={Check} label="Select" onPress={onSelect} variant="primary" />
        ) : null}
        <ScriptCardButton
          icon={editing ? ChevronUp : ChevronDown}
          label={editing ? 'Close' : 'Customize'}
          onPress={onEdit}
        />
        <ScriptCardButton
          icon={Ticket}
          label="One-time"
          onPress={onToggleOneTime}
          variant={script.oneTime ? 'primary' : 'neutral'}
        />
        <ScriptCardButton icon={Copy} iconOnly label="Duplicate" onPress={onDuplicate} />
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
      border: colors.dangerBorder,
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
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: pressed ? colors.surfacePressed : palette.background,
          borderColor: palette.border,
          flex: iconOnly ? 0 : 1,
          minWidth: iconOnly ? 44 : 0,
          paddingHorizontal: iconOnly ? 12 : 8,
        },
      ]}
    >
      <Icon color={palette.icon} size={15} strokeWidth={2.6} />
      {iconOnly ? null : <Text style={[styles.actionLabel, { color: palette.text }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  customTag: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  customTagText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  header: {
    gap: 4,
  },
  metadata: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: 13,
  },
  metadataRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  titleButton: {
    alignSelf: 'flex-start',
  },
  titleButtonPressed: {
    opacity: 0.65,
  },
});
