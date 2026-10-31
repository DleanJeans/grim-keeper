import { Download, LoaderCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { StoredScript } from '@/types/game';
import type { RemoteScript } from '@/utils/script-service';

type RemoteScriptCardProps = {
  downloading: boolean;
  savedScript?: StoredScript;
  script: RemoteScript;
  onDownload: () => void;
};

export function RemoteScriptCard({
  downloading,
  onDownload,
  savedScript,
  script,
}: RemoteScriptCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.details}>
        <Text selectable style={styles.name}>
          {script.name}
        </Text>
        <Text selectable style={styles.meta}>
          {script.author ? `${script.author} · ` : ''}v{script.version} · {script.scriptType}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={`${savedScript ? 'Update' : 'Download'} ${script.name}`}
        accessibilityRole="button"
        disabled={downloading}
        onPress={onDownload}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          downloading && styles.buttonDownloading,
        ]}
      >
        {downloading ? (
          <LoaderCircle color={colors.textMuted} size={16} strokeWidth={2.4} />
        ) : (
          <Download color={colors.text} size={16} strokeWidth={2.4} />
        )}
        <Text style={styles.buttonText}>{savedScript ? 'Update' : 'Download'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  buttonDownloading: {
    opacity: 0.6,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  buttonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
