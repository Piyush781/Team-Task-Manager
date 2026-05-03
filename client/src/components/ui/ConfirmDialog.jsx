import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Confirm Action', message, loading = false, confirmLabel = 'Confirm', variant = 'danger' }) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
    <p className="text-sm text-slate-300 mb-6">{message}</p>
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
      <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
    </div>
  </Modal>
);

export default ConfirmDialog;