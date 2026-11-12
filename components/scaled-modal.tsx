import { Modal, type ModalProps } from 'react-native';

import { UiScaleView } from '@/components/ui-scale-view';

/** A Modal whose content follows the UI size from Settings, like the rest of the app. */
export function ScaledModal({ children, ...props }: ModalProps) {
  return (
    <Modal {...props}>
      <UiScaleView>{children}</UiScaleView>
    </Modal>
  );
}
