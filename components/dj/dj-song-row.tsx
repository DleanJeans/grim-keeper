import { Minus, MoreHorizontal, Plus, Trash2 } from 'lucide-react-native';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { DjSongMetadata } from '@/components/dj/dj-song-metadata';
import { SpotifyQueueButton } from '@/components/dj/spotify-queue-button';
import { Text } from '@/components/text';
import { useDjStore } from '@/store/dj-store';
import { colors } from '@/theme/colors';
import { getDjSessionSong, getDjSongStats } from '@/utils/dj-utils';

type DjSongRowProps = {
  gameId?: string;
  labels?: string[];
  onRemove?: () => void;
  songUrl: string;
};

export function DjSongRow({ gameId, labels, onRemove, songUrl }: DjSongRowProps) {
  const sessions = useDjStore((state) => state.sessions);
  const adjustApproval = useDjStore((state) => state.adjustApproval);
  const recordPlayed = useDjStore((state) => state.recordPlayed);
  const session = gameId ? getDjSessionSong(sessions, gameId, songUrl) : undefined;
  const stats = getDjSongStats(sessions, songUrl);
  const canApprove = !!session?.playedCount;

  function openSong() {
    void Linking.openURL(songUrl);
  }

  return (
    <View style={styles.row}>
      {labels?.length ? (
        <Text numberOfLines={2} selectable style={styles.labels}>
          For: {labels.join(' · ')}
        </Text>
      ) : null}
      <DjSongMetadata songUrl={songUrl} />
      <View style={styles.actions}>
        <View style={styles.stats}>
          <MoreHorizontal color={colors.textMuted} size={15} strokeWidth={2.3} />
          <Text style={styles.statsText}>
            {stats.playedCount} plays · {stats.gameCount} {stats.gameCount === 1 ? 'game' : 'games'}{' '}
            · {stats.approvalScore >= 0 ? '+' : ''}
            {stats.approvalScore}
          </Text>
        </View>
        <View style={styles.buttonRow}>
          <SongActionButton label="Open" onPress={openSong} />
          {gameId ? (
            <SongActionButton
              disabled={false}
              label={session?.playedCount ? 'Played again' : 'Mark played'}
              onPress={() => recordPlayed(gameId, songUrl)}
            />
          ) : null}
          {gameId ? (
            <SongActionButton
              disabled={!canApprove}
              icon={<Minus color={canApprove ? colors.text : colors.onDisabled} size={15} />}
              label=""
              onPress={() => adjustApproval(gameId, songUrl, -1)}
            />
          ) : null}
          {gameId ? (
            <SongActionButton
              disabled={!canApprove}
              icon={<Plus color={canApprove ? colors.text : colors.onDisabled} size={15} />}
              label=""
              onPress={() => adjustApproval(gameId, songUrl, 1)}
            />
          ) : null}
          <SpotifyQueueButton songUrl={songUrl} />
          {onRemove ? (
            <Pressable
              accessibilityLabel="Remove song"
              accessibilityRole="button"
              onPress={onRemove}
              style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
            >
              <Trash2 color={colors.danger} size={16} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function SongActionButton({
  disabled = false,
  icon,
  label,
  onPress,
}: {
  disabled?: boolean;
  icon?: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label || 'Adjust approval'}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        disabled && styles.actionButtonDisabled,
        pressed && styles.pressed,
      ]}
    >
      {icon}
      {label ? (
        <Text style={[styles.actionText, disabled && styles.actionTextDisabled]}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  actionButtonDisabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
  },
  actionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  actionTextDisabled: {
    color: colors.onDisabled,
  },
  actions: {
    gap: 8,
    minWidth: 0,
    width: '100%',
  },
  buttonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  labels: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
    opacity: 0.85,
  },
  removeButton: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 10,
  },
  row: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'column',
    gap: 12,
    padding: 12,
  },
  stats: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  statsText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
