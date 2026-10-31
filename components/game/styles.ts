import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

const slateBg = colors.gameSurface;
const slateBgPressed = colors.gameSurfacePressed;
const slateBorder = colors.gameBorder;
const onDark = colors.gameText;

export const gameStyles = StyleSheet.create({
  noteCard: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});

/**
 * Outlined "neutral" action button — used for pressable actions that sit in
 * the row below the map (rotate/rearrange controls, focused-player action
 * buttons, vote/tracking cancel buttons, header day stepper, header Add
 * Player button, etc.). Switches its background on press.
 */
export function outlinedActionStyle({
  pressed,
  disabled = false,
  borderColor = slateBorder,
  flex,
  paddingVertical = 14,
}: {
  pressed: boolean;
  disabled?: boolean;
  borderColor?: string;
  flex?: number;
  paddingVertical?: number;
}): ViewStyle {
  return {
    alignItems: 'center',
    backgroundColor: pressed ? slateBgPressed : slateBg,
    borderColor: disabled ? slateBgPressed : borderColor,
    borderRadius: 8,
    borderWidth: 1,
    flex,
    flexBasis: 0,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minWidth: 0,
    opacity: disabled ? 0.48 : 1,
    paddingVertical,
  };
}

/**
 * Solid "filled" action button — used for vote/tracking Cancel (slate)
 * and Confirm (green) buttons. No border; paddingVertical 14.
 */
export function solidActionStyle({
  backgroundColor,
  flex,
}: {
  backgroundColor: string;
  flex: number;
}): ViewStyle {
  return {
    alignItems: 'center',
    backgroundColor,
    borderRadius: 8,
    flex,
    flexBasis: 0,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minWidth: 0,
    paddingVertical: 14,
  };
}

export function tabBarButtonStyle(active: boolean, flex: number): ViewStyle {
  return {
    alignItems: 'center',
    backgroundColor: active ? onDark : 'transparent',
    borderRadius: 6,
    flex,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 10,
  };
}

export function tabBarLabelStyle(active: boolean): TextStyle {
  return {
    color: active ? colors.gameBackground : colors.gameTextMuted,
    fontSize: 13,
    fontWeight: '800',
  };
}

const sharedStyles = StyleSheet.create({
  outlinedActionRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
  },
  innerActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmRowStyle: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  /** Outer pill container shared by GameTabs and the Interactions subtab bar. */
  tabBarContainer: {
    backgroundColor: slateBg,
    borderRadius: 8,
    flexDirection: 'row',
    padding: 4,
  },
  onDarkText: {
    color: onDark,
    fontWeight: '800',
  },
  onDarkTextStrong: {
    color: onDark,
    fontWeight: '900',
  },
});

export const outlinedActionRow = sharedStyles.outlinedActionRow;
export const innerActionRow = sharedStyles.innerActionRow;
export const confirmRowStyle = sharedStyles.confirmRowStyle;
export const tabBarContainer = sharedStyles.tabBarContainer;
export const onDarkText = sharedStyles.onDarkText;
export const onDarkTextStrong = sharedStyles.onDarkTextStrong;
