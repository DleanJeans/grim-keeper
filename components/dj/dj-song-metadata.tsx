import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useDjSongMetadata } from '@/hooks/use-dj-song-metadata';
import { colors } from '@/theme/colors';

type DjSongMetadataProps = {
  songUrl: string;
};

export function DjSongMetadata({ songUrl }: DjSongMetadataProps) {
  const metadata = useDjSongMetadata(songUrl);
  const [imageFailedFor, setImageFailedFor] = useState<string | undefined>();
  const imageFailed = imageFailedFor === songUrl;

  return (
    <View style={styles.container}>
      {metadata?.imageUrl && !imageFailed ? (
        <Image
          accessibilityLabel="Song cover art"
          onError={() => setImageFailedFor(songUrl)}
          source={{ uri: metadata.imageUrl }}
          style={styles.cover}
        />
      ) : (
        <View style={styles.coverFallback} />
      )}
      <View style={styles.copy}>
        <Text numberOfLines={2} selectable style={styles.title}>
          {metadata?.title ?? songUrl}
        </Text>
        {metadata?.title ? (
          <Text numberOfLines={1} selectable style={styles.url}>
            {songUrl}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
    width: '100%',
  },
  copy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  cover: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 6,
    height: 48,
    width: 48,
  },
  coverFallback: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    borderWidth: 1,
    height: 48,
    width: 48,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  url: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
