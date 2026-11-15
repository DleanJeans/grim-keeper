import { Check, ChevronDown, ChevronRight, ChevronUp, Trophy } from 'lucide-react-native';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role, StoredScript } from '@/types/game';
import { formatScriptSize, getScriptSizeBytes, isCustomScript } from '@/utils/script-image-utils';
import { getBaseScriptCandidates } from '@/utils/script-utils';

import { CustomScriptImageControls } from './custom-script-image-controls';
import { ScriptCardMoreMenu } from './script-card-more-menu';
import { ScriptRoleEditor } from './script-role-editor';

type ScriptCardProps = {
  canSelect: boolean;
  editing: boolean;
  gamesPlayed: number;
  /** Games on this script and its base script family, which the win rates count. */
  winRateGames: number;
  /** Your record on this script's family, e.g. "3W 1L (75%)". */
  winRecord?: string | null;
  roleCatalog: Role[];
  script: StoredScript;
  /** The other downloaded scripts, to choose a base script from. */
  scripts: StoredScript[];
  onChangeBase: (baseScriptId: string | null) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  onSelect: () => void;
  onToggleOneTime: () => void;
  onView: () => void;
  onViewWinRates: () => void;
  onUpdate: (script: StoredScript) => void;
};

export function ScriptCard({
  canSelect,
  editing,
  gamesPlayed,
  onChangeBase,
  onDelete,
  onDuplicate,
  onEdit,
  onLayout,
  onSelect,
  onToggleOneTime,
  onView,
  onViewWinRates,
  onUpdate,
  roleCatalog,
  script,
  scripts,
  winRateGames,
  winRecord,
}: ScriptCardProps) {
  const custom = isCustomScript(script);
  const baseScript = scripts.find((candidate) => candidate.id === script.baseScriptId);

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
        {winRateGames > 0 ? (
          <Pressable
            accessibilityHint="Shows your and your friends' win rates on this script"
            accessibilityLabel={winRecord ? `Win rates, you ${winRecord}` : 'Win rates'}
            accessibilityRole="button"
            onPress={onViewWinRates}
            style={({ pressed }) => [styles.winRatesPill, pressed && styles.winRatesPillPressed]}
          >
            <Trophy color={colors.textMuted} size={13} strokeWidth={2.4} />
            <Text style={styles.winRatesText}>{winRecord ? `You ${winRecord}` : 'Win rates'}</Text>
            <ChevronRight color={colors.textSubtle} size={14} strokeWidth={2.4} />
          </Pressable>
        ) : null}
        {baseScript ? (
          <Text selectable style={styles.metadata}>
            Win rates count together with {baseScript.name}.
          </Text>
        ) : null}
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
        <ScriptCardMoreMenu
          baseCandidates={getBaseScriptCandidates(script, scripts)}
          baseScript={baseScript}
          onChangeBase={onChangeBase}
          oneTime={Boolean(script.oneTime)}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onToggleOneTime={onToggleOneTime}
          scriptName={script.name}
        />
      </View>
    </View>
  );
}

function ScriptCardButton({
  icon: Icon,
  label,
  onPress,
  variant = 'neutral',
}: {
  icon: typeof Check;
  label: string;
  onPress: () => void;
  variant?: 'neutral' | 'primary';
}) {
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        primary && styles.actionButtonPrimary,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <Icon color={primary ? colors.onPrimary : colors.textMuted} size={15} strokeWidth={2.6} />
      <Text style={[styles.actionLabel, primary && styles.actionLabelPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  actionButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  actionLabelPrimary: {
    color: colors.onPrimary,
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
  winRatesPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  winRatesPillPressed: {
    backgroundColor: colors.surfacePressed,
  },
  winRatesText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
});
