import { Eye, Hand } from 'lucide-react-native';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { HoldToReveal } from '@/components/hold-to-reveal';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

/** A press shorter than this is a tap that latches the message open. */
const TAP_MS = 350;

type HoldToRevealButtonProps = {
  holding: boolean;
  onHoldChange: (holding: boolean) => void;
};

/**
 * The big "Hold to reveal" button at the bottom of the private message hand-over screen. Hold it
 * to read and let go to hide; tap it once to keep the message open until the next tap.
 */
export function HoldToRevealButton({ holding, onHoldChange }: HoldToRevealButtonProps) {
  const latched = useRef(false);
  const pressedAt = useRef(0);

  function handleHoldChange(down: boolean) {
    if (down) {
      pressedAt.current = Date.now();
      onHoldChange(true);
      return;
    }
    const isTap = Date.now() - pressedAt.current < TAP_MS;
    if (isTap && !latched.current) {
      latched.current = true;
      return;
    }
    latched.current = false;
    onHoldChange(false);
  }

  return (
    <HoldToReveal
      accessibilityLabel={holding ? 'Hide message' : 'Hold to reveal'}
      onHoldChange={handleHoldChange}
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
          {holding ? 'Let go or tap to hide' : 'Or tap to keep it open'}
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
