import { createContext, type ReactNode, use, useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type DialogButton = {
  onPress?: () => void;
  style?: 'cancel' | 'default' | 'destructive' | 'success';
  text: string;
};

type DialogState = {
  buttons: DialogButton[];
  message?: string;
  title: string;
};

type AppDialogContextValue = {
  showDialog: (title: string, message?: string, buttons?: DialogButton[]) => void;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const dismiss = useCallback(() => setDialog(null), []);
  const showDialog = useCallback(
    (title: string, message?: string, buttons: DialogButton[] = [{ text: 'OK' }]) => {
      setDialog({ buttons, message, title });
    },
    [],
  );
  const contextValue = useMemo(() => ({ showDialog }), [showDialog]);

  function handleButtonPress(button: DialogButton) {
    dismiss();
    button.onPress?.();
  }

  return (
    <AppDialogContext value={contextValue}>
      {children}
      <Modal animationType="fade" onRequestClose={dismiss} transparent visible={dialog !== null}>
        <View style={styles.backdrop}>
          <View accessibilityRole="alert" style={styles.dialog}>
            <View style={styles.content}>
              <Text selectable style={styles.title}>
                {dialog?.title}
              </Text>
              {dialog?.message ? (
                <Text selectable style={styles.message}>
                  {dialog.message}
                </Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              {dialog?.buttons.map((button) => (
                <Pressable
                  accessibilityRole="button"
                  key={`${button.style ?? 'default'}-${button.text}`}
                  onPress={() => handleButtonPress(button)}
                  style={({ pressed }) => [
                    styles.action,
                    button.style === 'destructive' ? styles.destructiveAction : null,
                    button.style === 'success' ? styles.successAction : null,
                    pressed ? styles.actionPressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.actionText,
                      button.style === 'destructive' ? styles.destructiveActionText : null,
                      button.style === 'success' ? styles.successActionText : null,
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AppDialogContext>
  );
}

export function useAppDialog() {
  const context = use(AppDialogContext);

  if (!context) {
    throw new Error('useAppDialog must be used within AppDialogProvider.');
  }

  return context.showDialog;
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  actionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    gap: 10,
  },
  destructiveAction: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
  },
  destructiveActionText: {
    color: colors.danger,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    boxShadow: '0 18px 48px rgba(0, 0, 0, 0.45)',
    gap: 20,
    maxWidth: 420,
    padding: 20,
    width: '100%',
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  successAction: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  successActionText: {
    color: colors.successText,
  },
});
