import { StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';

/** Square icon button shared by the friend name Save and Edit buttons. */
export const friendNameButtonStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 40,
    paddingHorizontal: 10,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
});
