import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => unknown | Promise<unknown>;
  title?: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message,
  confirmLabel = 'Hapus',
  isDestructive = true,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const close = () => { if (!busy) { setError(''); onClose(); } };
  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={title}
      size="sm"
      footer={
        <>
          <Button disabled={busy} onClick={close}>Batal</Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            disabled={busy}
            onClick={async () => {
              setBusy(true); setError('');
              try { await onConfirm(); onClose(); }
              catch (err) { setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan'); }
              finally { setBusy(false); }
            }}
          >
            {busy ? 'Memproses…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-2">{message}</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  );
}
