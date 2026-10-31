import { ChevronRight, History, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';
import { getPhaseLabel } from '@/utils/game-phase-utils';
import { getPlayerTimeline, type TimelinePhase } from '@/utils/player-timeline-utils';

type PlayerTimelineButtonProps = {
  player: Player;
};

/** Opens a sheet with everything recorded about one player, phase by phase. */
export function PlayerTimelineButton({ player }: PlayerTimelineButtonProps) {
  const { activeDay, activePhase, game, showRoles, startingNight } = useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const [open, setOpen] = useState(false);
  const phases = open
    ? getPlayerTimeline(
        game,
        player.id,
        [...(game.script?.roles ?? []), ...roleCatalog],
        activeDay,
        activePhase,
        showRoles,
      )
    : [];
  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        accessibilityHint="Shows everything recorded about this player, day by day"
        accessibilityLabel={`${player.name}'s timeline`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
      >
        <History color={colors.textMuted} size={18} strokeWidth={2.4} />
        <Text style={styles.label}>{player.name}'s timeline</Text>
        <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
      </Pressable>
      <Modal animationType="slide" onRequestClose={close} transparent visible={open}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Close timeline"
            accessibilityRole="button"
            onPress={close}
            style={styles.backdropDismiss}
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text selectable style={styles.title}>
                {player.name}'s timeline
              </Text>
              <Pressable
                accessibilityLabel="Close timeline"
                accessibilityRole="button"
                hitSlop={8}
                onPress={close}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
              {phases.length === 0 ? (
                <Text style={styles.empty}>Nothing recorded yet.</Text>
              ) : (
                phases.map((phase) => (
                  <TimelineSection
                    key={`${phase.phase}-${phase.day}`}
                    phase={phase}
                    title={getPhaseLabel(
                      { activeDay: phase.day, activePhase: phase.phase },
                      startingNight,
                    )}
                  />
                ))
              )}
              {showRoles ? null : (
                <Text style={styles.hint}>Turn on Show roles to include characters and marks.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
  empty: { color: colors.textMuted, fontSize: 14 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  hint: { color: colors.textMuted, fontSize: 12 },
  item: { color: colors.text, fontSize: 15, lineHeight: 20 },
  label: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '700' },
  link: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  linkPressed: { opacity: 0.65 },
  section: { gap: 6 },
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

function TimelineSection({ phase, title }: { phase: TimelinePhase; title: string }) {
  return (
    <View style={styles.section}>
      <Text selectable style={styles.sectionTitle}>
        {title}
      </Text>
      {getItemKeys(phase.items).map(({ item, key }) => (
        <Text key={key} selectable style={styles.item}>
          {item}
        </Text>
      ))}
    </View>
  );
}

/** Repeated items (two votes on the same nominee) get a count suffix so keys stay unique. */
function getItemKeys(items: string[]) {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const count = (seen.get(item) ?? 0) + 1;
    seen.set(item, count);
    return { item, key: `${item}#${count}` };
  });
}
