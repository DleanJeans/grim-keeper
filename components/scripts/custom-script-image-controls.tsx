import { ImageDown, LoaderCircle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { StoredScript } from '@/types/game';
import {
  formatScriptSize,
  getScriptSizeBytes,
  hasEmbeddedScriptImages,
  resizeScriptImages,
} from '@/utils/script-image-utils';

const DEFAULT_TARGET_HEIGHT = '100';
const MAX_TARGET_HEIGHT = 4096;

type CustomScriptImageControlsProps = {
  onUpdate: (script: StoredScript) => void;
  script: StoredScript;
  showControls: boolean;
};

export function CustomScriptImageControls({
  onUpdate,
  script,
  showControls,
}: CustomScriptImageControlsProps) {
  const showDialog = useAppDialog();
  const [targetHeightText, setTargetHeightText] = useState(DEFAULT_TARGET_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const scriptSizeBytes = useMemo(() => getScriptSizeBytes(script), [script]);
  const hasImages = useMemo(() => hasEmbeddedScriptImages(script), [script]);
  const targetHeight = parseTargetHeight(targetHeightText);
  const inputError = targetHeightText.length > 0 && targetHeight === undefined;

  async function handleResize() {
    if (!targetHeight || !hasImages) {
      return;
    }

    setIsResizing(true);

    try {
      const resizedScript = await resizeScriptImages(script, targetHeight);
      const resizedSizeBytes = getScriptSizeBytes(resizedScript);

      showDialog(
        'Resize script images?',
        [
          `Image height: ${targetHeight}px`,
          `Size: ${formatScriptSize(scriptSizeBytes)} → ${formatScriptSize(resizedSizeBytes)}`,
          getSizeChangeMessage(scriptSizeBytes, resizedSizeBytes),
        ].join('\n'),
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Apply', style: 'success', onPress: () => onUpdate(resizedScript) },
        ],
      );
    } catch {
      showDialog(
        'Could not resize images',
        'The embedded images could not be resized. The original script was not changed.',
      );
    } finally {
      setIsResizing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.sizeText}>
        Script size: {formatScriptSize(scriptSizeBytes)}
      </Text>
      {showControls ? (
        <>
          <View style={styles.controls}>
            <View style={styles.inputGroup}>
              <Text selectable style={styles.label}>
                Image height (px)
              </Text>
              <TextInput
                accessibilityLabel="Resize image height in pixels"
                editable={!isResizing}
                keyboardType="number-pad"
                maxLength={4}
                onChangeText={setTargetHeightText}
                placeholder={DEFAULT_TARGET_HEIGHT}
                placeholderTextColor={colors.textSubtle}
                value={targetHeightText}
                style={styles.input}
              />
            </View>
            <Pressable
              accessibilityLabel={`Resize ${script.name} images`}
              accessibilityRole="button"
              disabled={isResizing || !hasImages || targetHeight === undefined}
              onPress={() => void handleResize()}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                (isResizing || !hasImages || targetHeight === undefined) && styles.buttonDisabled,
              ]}
            >
              {isResizing ? (
                <LoaderCircle color={colors.onDisabled} size={16} strokeWidth={2.4} />
              ) : (
                <ImageDown color={colors.text} size={16} strokeWidth={2.4} />
              )}
              <Text
                style={[
                  styles.buttonLabel,
                  (isResizing || !hasImages || targetHeight === undefined) &&
                    styles.buttonLabelDisabled,
                ]}
              >
                {isResizing ? 'Resizing…' : 'Resize images'}
              </Text>
            </Pressable>
          </View>
          {inputError ? (
            <Text selectable style={styles.errorText}>
              Enter a whole number from 1 to {MAX_TARGET_HEIGHT}.
            </Text>
          ) : !hasImages ? (
            <Text selectable style={styles.hintText}>
              No embedded images to resize.
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function parseTargetHeight(value: string) {
  if (!/^\d+$/.test(value)) {
    return undefined;
  }

  const targetHeight = Number(value);
  return targetHeight > 0 && targetHeight <= MAX_TARGET_HEIGHT ? targetHeight : undefined;
}

function getSizeChangeMessage(currentSizeBytes: number, nextSizeBytes: number) {
  const difference = currentSizeBytes - nextSizeBytes;

  if (difference > 0) {
    return `Saves ${formatScriptSize(difference)}.`;
  }

  if (difference < 0) {
    return `Adds ${formatScriptSize(Math.abs(difference))}.`;
  }

  return 'The serialized size will not change.';
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
  },
  buttonLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  buttonLabelDisabled: {
    color: colors.onDisabled,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  container: {
    gap: 8,
  },
  controls: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: 92,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  sizeText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
