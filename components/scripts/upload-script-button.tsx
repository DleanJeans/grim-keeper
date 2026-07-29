import { FileUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type UploadScriptButtonProps = {
  onFileSelected: (file: File) => Promise<void>;
};

export function UploadScriptButton({ onFileSelected }: UploadScriptButtonProps) {
  const [isUploading, setIsUploading] = useState(false);

  function chooseScriptFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];

      if (file) {
        void uploadFile(file);
      }
    });
    input.click();
  }

  async function uploadFile(file: File) {
    setIsUploading(true);

    try {
      await onFileSelected(file);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Pressable
      accessibilityLabel="Upload homebrew script JSON"
      accessibilityRole="button"
      disabled={isUploading}
      onPress={chooseScriptFile}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        isUploading && styles.buttonDisabled,
      ]}
    >
      <FileUp color={isUploading ? colors.onDisabled : colors.text} size={18} strokeWidth={2.6} />
      <Text style={[styles.label, isUploading && styles.labelDisabled]}>
        {isUploading ? 'Reading JSON…' : 'Upload JSON'}
      </Text>
    </Pressable>
  );
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
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  labelDisabled: {
    color: colors.onDisabled,
  },
});
