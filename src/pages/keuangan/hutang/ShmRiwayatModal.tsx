import { PiArrowRight, PiClockCounterClockwise } from 'react-icons/pi';
import { type Shm, STATUS_SHM_LABELS, STATUS_SHM_TONE } from '../../../store/shmStore';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';

interface ShmRiwayatModalProps {
  shm: Shm | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShmRiwayatModal({ shm, isOpen, onClose }: ShmRiwayatModalProps) {
  if (!shm) return null;

  const riwayat = [...shm.riwayat].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const statusSaatIni = shm.status === 'lainnya' && shm.statusKustom ? shm.statusKustom : STATUS_SHM_LABELS[shm.status];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Riwayat status SHM"
      description={`${shm.nomorShm}, ${shm.kavling}`}
      size="md"
      footer={<Button onClick={onClose}>Tutup</Button>}
    >
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-ink-2">
        Status saat ini
        <Badge tone={STATUS_SHM_TONE[shm.status]}>{statusSaatIni}</Badge>
        <span className="text-ink-3">di {shm.lokasi}</span>
      </div>

      {riwayat.length === 0 ? (
        <EmptyState compact icon={PiClockCounterClockwise} title="Belum ada perubahan status" description="Riwayat muncul setiap kali status SHM diubah." />
      ) : (
        <ol className="space-y-0">
          {riwayat.map((r, idx) => (
            <li key={r.id} className="relative pb-5 pl-6 last:pb-0">
              {idx < riwayat.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-line" aria-hidden />}
              <span
                className={`absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 ${
                  idx === 0 ? 'border-brand-600 bg-brand-600' : 'border-line-strong bg-surface'
                }`}
                aria-hidden
              />
              <p className="text-xs font-semibold tabular-nums text-ink-3">
                {new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge tone={STATUS_SHM_TONE[r.dariStatus]}>{STATUS_SHM_LABELS[r.dariStatus]}</Badge>
                <PiArrowRight className="h-3.5 w-3.5 text-ink-3" aria-label="menjadi" />
                <Badge tone={STATUS_SHM_TONE[r.keStatus]}>{STATUS_SHM_LABELS[r.keStatus]}</Badge>
              </div>
              {r.keterangan && <p className="mt-1.5 text-sm text-ink-2">{r.keterangan}</p>}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
