import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type RateBarProps = {
  color: string;
  /** Small text after the percentage, such as "20/31". */
  detail?: string;
  label: string;
  /** 0 to 100, or undefined when there is nothing to rate yet. */
  rate: number | undefined;
  /** Puts the label and value above a full-width bar, for narrow cards. */
  stacked?: boolean;
  /** Marks 50% on the track. Off for bars that show a share of games. */
  tick?: boolean;
};

export function RateBar({ color, detail, label, rate, stacked, tick = true }: RateBarProps) {
  const value = (
    <Text
      numberOfLines={1}
      style={[styles.value, stacked ? styles.valueStacked : styles.valueInline]}
    >
      {rate === undefined ? '—' : `${rate}%`}
      {rate === undefined || !detail ? null : <Text style={styles.detail}>{` ${detail}`}</Text>}
    </Text>
  );
  const labelText = (
    <Text numberOfLines={1} style={[styles.label, !stacked && styles.labelInline, { color }]}>
      {label}
    </Text>
  );
  const track = (
    <View style={[styles.track, stacked ? styles.trackStacked : styles.trackInline]}>
      {rate === undefined ? null : (
        <View style={[styles.fill, { backgroundColor: color, width: `${rate}%` }]} />
      )}
      {tick ? <View style={styles.tick} /> : null}
    </View>
  );

  return (
    <View
      accessibilityLabel={
        rate === undefined
          ? `${label}: no games yet`
          : `${label} ${rate} percent${detail ? `, ${detail}` : ''}`
      }
      style={stacked ? styles.stacked : styles.inline}
    >
      {stacked ? (
        <>
          <View style={styles.stackedHeader}>
            {labelText}
            {value}
          </View>
          {track}
        </>
      ) : (
        <>
          {labelText}
          {track}
          {value}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  detail: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '400',
  },
  fill: {
    borderRadius: 4,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  inline: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
  },
  labelInline: {
    width: 44,
  },
  stacked: {
    gap: 4,
    width: '100%',
  },
  stackedHeader: {
    alignItems: 'baseline',
    gap: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tick: {
    backgroundColor: colors.winBarTick,
    bottom: -2,
    left: '50%',
    opacity: 0.7,
    position: 'absolute',
    top: -2,
    width: 1,
  },
  track: {
    backgroundColor: colors.winBarTrack,
    borderRadius: 4,
    height: 8,
  },
  trackInline: {
    flex: 1,
  },
  trackStacked: {
    width: '100%',
  },
  value: {
    color: colors.text,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    textAlign: 'right',
  },
  valueInline: {
    width: 84,
  },
  valueStacked: {
    fontSize: 13,
  },
});
