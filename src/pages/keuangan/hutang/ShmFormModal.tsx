import { useState, type FormEvent } from 'react';
import { useShmStore, type StatusShm, STATUS_SHM_LABELS } from '../../../store/shmStore';
import { usePinjamanBankStore } from '../../../store/pinjamanBankStore';
import Modal from '../../../components/ui/Modal';

interface ShmFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: StatusShm[] = ['di_notaris', 'di_kantor', 'dijaminkan', 'sudah_ditebus'];

export default function ShmFormModal({ isOpen, onClose }: ShmFormModalProps) {
  const addShm = useShmStore((s) => s.addShm);
  const pinjamans = usePinjamanBankStore((s) => s.pinjamans);

  const [nomorShm, setNomorShm] = useState('');
  const [kavling, setKavling] = useState('');
  const [status, setStatus] = useState<StatusShm>('di_notaris');
  const [lokasi, setLokasi] = useState('');
  const [pinjamanBankId, setPinjamanBankId] = useState('');
  const [namaBank, setNamaBank] = useState('');

  const aktivPinjamans = pinjamans.filter((p) => p.status === 'aktif');

  const resetForm = () => {
    setNomorShm('');
    setKavling('');
    setStatus('di_notaris');
    setLokasi('');
    setPinjamanBankId('');
    setNamaBank('');
  };

  const handlePinjamanChange = (id: string) => {
    setPinjamanBankId(id);
    const found = pinjamans.find((p) => p.id === id);
    setNamaBank(found?.namaBank ?? '');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nomorShm.trim() || !kavling.trim() || !lokasi.trim()) return;
    if (status === 'dijaminkan' && !pinjamanBankId) return;

    addShm({
      nomorShm: nomorShm.trim(),
      kavling: kavling.trim(),
      status,
      lokasi: lokasi.trim(),
      ...(status === 'dijaminkan' ? { pinjamanBankId, namaBank } : {}),
    });

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isValid =
    nomorShm.trim() !== '' &&
    kavling.trim() !== '' &&
    lokasi.trim() !== '' &&
    (status !== 'dijaminkan' || pinjamanBankId !== '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tambah SHM Baru"
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="shm-form"
            disabled={!isValid}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Simpan
          </button>
        </>
      }
    >
      <form id="shm-form" onSubmit={handleSubmit} className="space-y-4">
        {/* No. SHM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            No. SHM <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nomorShm}
            onChange={(e) => setNomorShm(e.target.value)}
            placeholder="Contoh: SHM-004/2026"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Kavling */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kavling <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={kavling}
            onChange={(e) => setKavling(e.target.value)}
            placeholder="Contoh: Kavling C-10"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Status Awal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status Awal <span className="text-red-500">*</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusShm)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_SHM_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Lokasi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lokasi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={lokasi}
            onChange={(e) => setLokasi(e.target.value)}
            placeholder="Contoh: Kantor Podorukun"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Conditional: Pinjaman Bank terkait */}
        {status === 'dijaminkan' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pinjaman Bank Terkait <span className="text-red-500">*</span>
              </label>
              <select
                value={pinjamanBankId}
                onChange={(e) => handlePinjamanChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">— Pilih pinjaman —</option>
                {aktivPinjamans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaBank} — Rp {p.nominalPencairan.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
            </div>

            {namaBank && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  value={namaBank}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                />
              </div>
            )}
          </>
        )}
      </form>
    </Modal>
  );
}
