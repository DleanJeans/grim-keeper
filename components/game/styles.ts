import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

const slateBg = '#111827';
const slateBgPressed = '#1f2937';
const slateBorder = '#334155';
const onDark = '#f8fafc';

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

export const outlinedActionRow: ViewStyle = {
  alignSelf: 'stretch',
  flexDirection: 'row',
  gap: 10,
};

export const innerActionRow: ViewStyle = {
  flexDirection: 'row',
  gap: 10,
};

export const confirmRowStyle: ViewStyle = {
  alignSelf: 'stretch',
  flexDirection: 'row',
  gap: 12,
  marginBottom: 12,
};

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

/** Outer pill container shared by GameTabs and the Interactions subtab bar. */
export const tabBarContainer: ViewStyle = {
  backgroundColor: slateBg,
  borderRadius: 8,
  flexDirection: 'row',
  padding: 4,
};

export function tabBarButtonStyle(active: boolean, flex: number): ViewStyle {
  return {
    alignItems: 'center',
    backgroundColor: active ? onDark : 'transparent',
    borderRadius: 6,
    flex,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingVertical: 10,
  };
}

export function tabBarLabelStyle(active: boolean): TextStyle {
  return {
    color: active ? '#0b1120' : '#94a3b8',
    fontSize: 13,
    fontWeight: '800',
  };
}

export const onDarkText: TextStyle = {
  color: onDark,
  fontWeight: '800',
};

export const onDarkTextStrong: TextStyle = {
  color: onDark,
  fontWeight: '900',
};
