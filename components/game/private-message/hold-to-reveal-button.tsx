import { Eye, Hand } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { HoldToReveal } from '@/components/hold-to-reveal';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type HoldToRevealButtonProps = {
  holding: boolean;
  onHoldChange: (holding: boolean) => void;
};

/** The big "Hold to reveal" button at the bottom of the private message hand-over screen. */
export function HoldToRevealButton({ holding, onHoldChange }: HoldToRevealButtonProps) {
  return (
    <HoldToReveal
      accessibilityLabel="Hold to reveal"
      onHoldChange={onHoldChange}
      style={holding ? styles.holdDown : styles.hold}
    >
      {holding ? (
        <Eye color={colors.text} size={26} strokeWidth={2.4} />
      ) : (
        <Hand color={colors.onPrimary} size={26} strokeWidth={2.4} />
      )}
      <View>
        <Text selectable={false} style={[styles.holdTitle, holding && styles.holdTitleDown]}>
          {holding ? 'Showing' : 'Hold to reveal'}
        </Text>
        <Text selectable={false} style={[styles.holdHint, holding && styles.holdHintDown]}>
          {holding ? 'Let go to hide' : 'Release to hide'}
        </Text>
      </View>
    </HoldToReveal>
  );
}

const styles = StyleSheet.create({
  hold: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: 24,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 86,
  },
  holdDown: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.primary,
    borderRadius: 24,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 86,
    transform: [{ scale: 0.97 }],
  },
  holdTitle: { color: colors.onPrimary, fontSize: 18, fontWeight: '900' },
  holdTitleDown: { color: colors.text },
  holdHint: { color: colors.onPrimary, fontSize: 12, fontWeight: '700', opacity: 0.65 },
  holdHintDown: { color: colors.text },
});
