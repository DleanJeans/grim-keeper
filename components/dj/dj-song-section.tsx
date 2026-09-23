import { Music2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { DjSongRow } from '@/components/dj/dj-song-row';
import { DjUrlEntry } from '@/components/dj/dj-url-entry';
import { Text } from '@/components/text';
import { useDjStore } from '@/store/dj-store';
import { colors } from '@/theme/colors';
import type { DjTarget } from '@/types/dj';
import { getDjSongs } from '@/utils/dj-utils';

export type DjSongListItem = {
  labels?: string[];
  songUrl: string;
};

type DjSongSectionProps = {
  gameId?: string;
  items?: DjSongListItem[];
  canRemoveSong?: (songUrl: string) => boolean;
  onRemoveSong?: (songUrl: string) => void;
  target: DjTarget;
  title: string;
  editable?: boolean;
};

export function DjSongSection({
  editable = false,
  gameId,
  items,
  canRemoveSong,
  onRemoveSong,
  target,
  title,
}: DjSongSectionProps) {
  const playlists = useDjStore((state) => state.playlists);
  const addSong = useDjStore((state) => state.addSong);
  const removeSong = useDjStore((state) => state.removeSong);
  const songs: DjSongListItem[] =
    items ?? getDjSongs(playlists, target).map((songUrl) => ({ songUrl }));

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Music2 color={colors.textMuted} size={17} strokeWidth={2.4} />
        <Text selectable style={styles.title}>
          {title}
        </Text>
        <Text style={styles.count}>{songs.length}</Text>
      </View>
      {editable ? <DjUrlEntry onAdd={(songUrl) => addSong(target, songUrl)} /> : null}
      {songs.length ? (
        <View style={styles.rows}>
          {songs.map((item) => (
            <DjSongRow
              gameId={gameId}
              key={item.songUrl}
              labels={item.labels}
              onRemove={
                (canRemoveSong?.(item.songUrl) ?? true)
                  ? onRemoveSong
                    ? () => onRemoveSong(item.songUrl)
                    : editable
                      ? () => removeSong(target, item.songUrl)
                      : undefined
                  : undefined
              }
              songUrl={item.songUrl}
            />
          ))}
        </View>
      ) : (
        <Text selectable style={styles.empty}>
          {editable ? 'No songs added yet.' : 'No songs in this library.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  count: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '800',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  rows: {
    gap: 8,
  },
  section: {
    gap: 10,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
});
