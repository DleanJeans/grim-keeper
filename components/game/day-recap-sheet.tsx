import * as Clipboard from 'expo-clipboard';
import {
  Check,
  Copy,
  Gavel,
  HeartPulse,
  MessageSquareQuote,
  Skull,
  Vote,
  X,
} from 'lucide-react-native';
import { type ComponentType, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, GamePhase, Role, StartingNight } from '@/types/game';
import { getDayRecap, type RecapEvent, type RecapEventKind } from '@/utils/day-recap-utils';
import { getPhaseLabel } from '@/utils/game-phase-utils';
import { getGameSummaryText } from '@/utils/game-summary-utils';

type IconComponent = ComponentType<{ color: string; size: number; strokeWidth?: number }>;

const EVENT_ICONS: Record<RecapEventKind, { color: string; icon: IconComponent }> = {
  claim: { color: colors.gameTextSoft, icon: MessageSquareQuote },
  death: { color: colors.deathNight, icon: Skull },
  execution: { color: colors.deathExecution, icon: Gavel },
  nomination: { color: colors.gameTextSoft, icon: Vote },
  revive: { color: colors.revive, icon: HeartPulse },
};

const COPIED_RESET_MS = 2000;

type DayRecapSheetProps = {
  /** Phase on screen; the copied summary runs up to here. */
  activePhase: GamePhase;
  day: number;
  game: Pick<Game, 'conversations' | 'players' | 'script'>;
  onClose: () => void;
  roles: Role[];
  showRoles: boolean;
  startingNight: StartingNight;
  visible: boolean;
};

/** Night `day` then Day `day` at a glance, to catch up after a busy day. */
export function DayRecapSheet({
  activePhase,
  day,
  game,
  onClose,
  roles,
  showRoles,
  startingNight,
  visible,
}: DayRecapSheetProps) {
  const recap = visible ? getDayRecap(game, day, roles, showRoles) : { day: [], night: [] };
  const dayLabel = getPhaseLabel({ activeDay: day, activePhase: 'day' }, startingNight);
  const nightLabel = getPhaseLabel({ activeDay: day, activePhase: 'night' }, startingNight);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function copySummary() {
    const text = getGameSummaryText(game, {
      activeDay: day,
      activePhase,
      roles,
      showRoles,
      startingNight,
    });
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close recap"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdropDismiss}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text selectable style={styles.title}>
              {dayLabel} recap
            </Text>
            <Pressable
              accessibilityHint="Copies players, claims and events so far as plain text"
              accessibilityLabel={copied ? 'Summary copied' : 'Copy game summary'}
              accessibilityRole="button"
              onPress={() => void copySummary()}
              style={({ pressed }) => [styles.copyButton, pressed && styles.closePressed]}
            >
              {copied ? (
                <Check color={colors.success} size={16} strokeWidth={2.6} />
              ) : (
                <Copy color={colors.text} size={16} strokeWidth={2.4} />
              )}
              <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy summary'}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Close recap"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
            >
              <X color={colors.textMuted} size={18} strokeWidth={2.5} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <RecapSection events={recap.night} title={nightLabel} />
            <RecapSection events={recap.day} title={dayLabel} />
            {showRoles ? null : (
              <Text style={styles.hint}>Turn on Show roles to include claims.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.backdrop, flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1 },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closePressed: { backgroundColor: colors.surfacePressed },
  content: { gap: 16, paddingBottom: 8 },
  copyButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 10,
  },
  copyText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  empty: { color: colors.textMuted, fontSize: 14 },
  event: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  eventIcon: { paddingTop: 2 },
  eventText: { color: colors.text, flex: 1, fontSize: 15, lineHeight: 20 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  hint: { color: colors.textMuted, fontSize: 12 },
  section: { gap: 8 },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sheet: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    maxHeight: '80%',
    padding: 16,
  },
  title: { color: colors.text, flex: 1, fontSize: 18, fontWeight: '900' },
});

function RecapSection({ events, title }: { events: RecapEvent[]; title: string }) {
  return (
    <View style={styles.section}>
      <Text selectable style={styles.sectionTitle}>
        {title}
      </Text>
      {events.length === 0 ? (
        <Text style={styles.empty}>Nothing recorded.</Text>
      ) : (
        events.map((event) => <RecapEventRow event={event} key={event.id} />)
      )}
    </View>
  );
}

function RecapEventRow({ event }: { event: RecapEvent }) {
  const { color, icon: Icon } = EVENT_ICONS[event.kind];
  return (
    <View style={styles.event}>
      <View style={styles.eventIcon}>
        <Icon color={color} size={16} strokeWidth={2.5} />
      </View>
      <Text selectable style={styles.eventText}>
        {event.text}
      </Text>
    </View>
  );
}
