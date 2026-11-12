import { Modal, type ModalProps } from 'react-native';

import { UiScaleView } from '@/components/ui-scale-view';

/**
 * React Native's Modal, drawn at the UI size picked in Settings. A Modal draws in its own window,
 * outside the scaled root of the app, so it needs its own `UiScaleView`.
 */
export function ScaledModal({ children, ...props }: ModalProps) {
  return (
    <Modal {...props}>
      <UiScaleView>{children}</UiScaleView>
    </Modal>
  );
}
