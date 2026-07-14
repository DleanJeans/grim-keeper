import { Download, LoaderCircle } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

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
    <View
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 12,
        padding: 14,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
          {script.name}
        </Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
          {script.author ? `${script.author} · ` : ''}v{script.version} · {script.scriptType}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={`${savedScript ? 'Update' : 'Download'} ${script.name}`}
        accessibilityRole="button"
        disabled={downloading}
        onPress={onDownload}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? colors.surfacePressed : colors.surfaceRaised,
          borderColor: colors.borderStrong,
          borderRadius: 8,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 6,
          opacity: downloading ? 0.6 : 1,
          paddingHorizontal: 10,
          paddingVertical: 10,
        })}
      >
        {downloading ? (
          <LoaderCircle color={colors.textMuted} size={16} strokeWidth={2.4} />
        ) : (
          <Download color={colors.text} size={16} strokeWidth={2.4} />
        )}
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
          {savedScript ? 'Update' : 'Download'}
        </Text>
      </Pressable>
    </View>
  );
}
