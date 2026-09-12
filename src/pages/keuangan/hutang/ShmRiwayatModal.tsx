import { type Shm, STATUS_SHM_LABELS, STATUS_SHM_COLOR } from '../../../store/shmStore';
import Modal from '../../../components/ui/Modal';
import { MdSchedule, MdDescription } from 'react-icons/md';

interface ShmRiwayatModalProps {
  shm: Shm | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShmRiwayatModal({ shm, isOpen, onClose }: ShmRiwayatModalProps) {
  if (!shm) return null;

  const sortedRiwayat = [...shm.riwayat].sort(
    (a, b) => a.tanggal.localeCompare(b.tanggal)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Riwayat Status SHM" size="md">
      {/* Header info */}
      <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <MdDescription className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">{shm.nomorShm}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Kavling:</span>{' '}
            <span className="text-gray-700 font-medium">{shm.kavling}</span>
          </div>
          <div>
            <span className="text-gray-500">Status saat ini:</span>{' '}
            <span
              className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_SHM_COLOR[shm.status]}`}
            >
              {shm.status === 'lainnya' && shm.statusKustom
                ? shm.statusKustom
                : STATUS_SHM_LABELS[shm.status]}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {sortedRiwayat.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <MdSchedule className="h-8 w-8 mb-2" />
          <p className="text-sm">Belum ada riwayat perubahan status.</p>
        </div>
      ) : (
        <ol className="relative border-l-2 border-gray-200 ml-3 space-y-0">
          {sortedRiwayat.map((r, idx) => (
            <li key={r.id} className="relative pl-6 pb-6 last:pb-0">
              {/* Dot */}
              <span
                className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${
                  idx === sortedRiwayat.length - 1 ? 'bg-indigo-500' : 'bg-gray-300'
                }`}
              />

              {/* Date */}
              <p className="text-xs font-medium text-gray-400 mb-1">
                {new Date(r.tanggal).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>

              {/* Status transition */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_SHM_COLOR[r.dariStatus]}`}
                >
                  {STATUS_SHM_LABELS[r.dariStatus]}
                </span>
                <span className="text-gray-400 text-xs">→</span>
                <span
                  className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_SHM_COLOR[r.keStatus]}`}
                >
                  {STATUS_SHM_LABELS[r.keStatus]}
                </span>
              </div>

              {/* Keterangan */}
              {r.keterangan && (
                <p className="text-sm text-gray-600">{r.keterangan}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
