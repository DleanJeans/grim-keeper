import { CircleHelp, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getPlayerSuspicion, SUSPICION_LEVELS, type SuspicionLevel } from '@/utils/suspicion-utils';

type IconComponent = ComponentType<{ color: string; size: number; strokeWidth?: number }>;

const SUSPICION_STYLES: Record<
  SuspicionLevel,
  { color: string; icon: IconComponent; label: string }
> = {
  suspect: { color: colors.suspicionSuspect, icon: ShieldAlert, label: 'Suspect' },
  trusted: { color: colors.suspicionTrusted, icon: ShieldCheck, label: 'Trust' },
  unsure: { color: colors.suspicionUnsure, icon: CircleHelp, label: 'Unsure' },
};

/** Trust, Unsure or Suspect for the focused player, kept per phase and carried forward. */
export function SuspicionPicker() {
  const { activeDay, activePhase, focusedPlayer, game, interactionMode, runDayEdit } =
    useGameRouteContext();
  const setPlayerSuspicion = useGameStore((state) => state.setPlayerSuspicion);

  if (!focusedPlayer || interactionMode || focusedPlayer.isStoryteller) {
    return null;
  }

  const current = getPlayerSuspicion(game.suspicions, focusedPlayer.id, activeDay, activePhase);

  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {SUSPICION_LEVELS.map((level) => (
        <SuspicionButton
          active={current === level}
          key={level}
          level={level}
          onPress={() =>
            runDayEdit(() =>
              setPlayerSuspicion(
                game.id,
                focusedPlayer.id,
                activeDay,
                activePhase,
                current === level ? undefined : level,
              ),
            )
          }
          playerName={focusedPlayer.name}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexBasis: 0,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 0,
  },
  buttonPressed: { backgroundColor: colors.gameSurfacePressed },
  label: { color: colors.gameTextSoft, fontSize: 14, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 8 },
  suspectButton: { borderColor: colors.suspicionSuspect },
  suspectLabel: { color: colors.suspicionSuspect },
  trustedButton: { borderColor: colors.suspicionTrusted },
  trustedLabel: { color: colors.suspicionTrusted },
  unsureButton: { borderColor: colors.suspicionUnsure },
  unsureLabel: { color: colors.suspicionUnsure },
});

const activeStyles = {
  suspect: { button: styles.suspectButton, label: styles.suspectLabel },
  trusted: { button: styles.trustedButton, label: styles.trustedLabel },
  unsure: { button: styles.unsureButton, label: styles.unsureLabel },
};

function SuspicionButton({
  active,
  level,
  onPress,
  playerName,
}: {
  active: boolean;
  level: SuspicionLevel;
  onPress: () => void;
  playerName: string;
}) {
  const { color, icon: Icon, label } = SUSPICION_STYLES[level];
  return (
    <Pressable
      accessibilityLabel={`${label} ${playerName}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && activeStyles[level].button,
        pressed && styles.buttonPressed,
      ]}
    >
      <Icon color={active ? color : colors.gameTextMuted} size={16} strokeWidth={2.6} />
      <Text style={[styles.label, active && activeStyles[level].label]}>{label}</Text>
    </Pressable>
  );
}
