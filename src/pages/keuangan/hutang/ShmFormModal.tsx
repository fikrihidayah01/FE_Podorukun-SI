import { useState, type FormEvent } from 'react';
import {
  useShmStore,
  type StatusShm,
  type StatusPbg,
  STATUS_SHM_LABELS,
  STATUS_PBG_LABELS,
} from '../../../store/shmStore';
import { usePinjamanBankStore } from '../../../store/pinjamanBankStore';
import Modal from '../../../components/ui/Modal';

interface ShmFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_SHM_OPTIONS: StatusShm[] = [
  'di_notaris',
  'di_kantor',
  'dijaminkan',
  'sudah_ditebus',
  'lainnya',
];

const STATUS_PBG_OPTIONS: StatusPbg[] = [
  'belum_diajukan',
  'dalam_proses',
  'terbit',
  'lainnya',
];

export default function ShmFormModal({ isOpen, onClose }: ShmFormModalProps) {
  const addShm = useShmStore((s) => s.addShm);
  const pinjamans = usePinjamanBankStore((s) => s.pinjamans);

  const [nomorShm, setNomorShm] = useState('');
  const [kavling, setKavling] = useState('');
  const [status, setStatus] = useState<StatusShm>('di_notaris');
  const [statusKustom, setStatusKustom] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [pinjamanBankId, setPinjamanBankId] = useState('');
  const [namaBank, setNamaBank] = useState('');
  const [noPbg, setNoPbg] = useState('');
  const [statusPbg, setStatusPbg] = useState<StatusPbg>('belum_diajukan');
  const [statusPbgKustom, setStatusPbgKustom] = useState('');
  const [dupError, setDupError] = useState(false);

  const aktivPinjamans = pinjamans.filter((p) => p.status === 'aktif');

  const resetForm = () => {
    setNomorShm('');
    setKavling('');
    setStatus('di_notaris');
    setStatusKustom('');
    setLokasi('');
    setPinjamanBankId('');
    setNamaBank('');
    setNoPbg('');
    setStatusPbg('belum_diajukan');
    setStatusPbgKustom('');
    setDupError(false);
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
    if (status === 'lainnya' && !statusKustom.trim()) return;
    if (statusPbg === 'lainnya' && !statusPbgKustom.trim()) return;

    setDupError(false);
    const ok = addShm({
      nomorShm: nomorShm.trim(),
      kavling: kavling.trim(),
      status,
      statusKustom: status === 'lainnya' ? statusKustom.trim() : undefined,
      lokasi: lokasi.trim(),
      statusPbg,
      noPbg: noPbg.trim() || undefined,
      statusPbgKustom: statusPbg === 'lainnya' ? statusPbgKustom.trim() : undefined,
      ...(status === 'dijaminkan' ? { pinjamanBankId, namaBank } : {}),
    });

    if (!ok) {
      setDupError(true);
      return;
    }

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
    (status !== 'dijaminkan' || pinjamanBankId !== '') &&
    (status !== 'lainnya' || statusKustom.trim() !== '') &&
    (statusPbg !== 'lainnya' || statusPbgKustom.trim() !== '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tambah Dokumen Legal"
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
        {/* Duplicate error */}
        {dupError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            No. SHM sudah terdaftar. Gunakan nomor yang berbeda.
          </div>
        )}

        {/* No. SHM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            No. SHM <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nomorShm}
            onChange={(e) => { setNomorShm(e.target.value); setDupError(false); }}
            placeholder="Contoh: SHM-006/2026"
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
            placeholder="Contoh: Kav C-10"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Status SHM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status SHM <span className="text-red-500">*</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusShm)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {STATUS_SHM_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_SHM_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Custom status text */}
        {status === 'lainnya' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan status <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="shm-status-list"
              value={statusKustom}
              onChange={(e) => setStatusKustom(e.target.value.slice(0, 40))}
              placeholder="Contoh: Di BPN"
              maxLength={40}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
            <datalist id="shm-status-list">
              {useShmStore.getState().getCustomStatuses().map((cs) => (
                <option key={cs} value={cs} />
              ))}
            </datalist>
          </div>
        )}

        {/* Lokasi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lokasi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            list="lokasi-list"
            value={lokasi}
            onChange={(e) => setLokasi(e.target.value)}
            placeholder="Contoh: Kantor Podorukun"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            required
          />
          <datalist id="lokasi-list">
            {useShmStore.getState().getCustomLokasis().map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>

        {/* Pinjaman Bank (conditional) */}
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
                    {p.namaBank} — Rp {p.totalPencairan.toLocaleString('id-ID')}
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

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* No. PBG */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">No. PBG</label>
          <input
            type="text"
            value={noPbg}
            onChange={(e) => setNoPbg(e.target.value)}
            placeholder="Contoh: PBG/26/001 (opsional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Status PBG */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status PBG <span className="text-red-500">*</span>
          </label>
          <select
            value={statusPbg}
            onChange={(e) => setStatusPbg(e.target.value as StatusPbg)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {STATUS_PBG_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_PBG_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Custom PBG status text */}
        {statusPbg === 'lainnya' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan status PBG <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="pbg-status-list"
              value={statusPbgKustom}
              onChange={(e) => setStatusPbgKustom(e.target.value.slice(0, 40))}
              placeholder="Contoh: Revisi berkas"
              maxLength={40}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
            <datalist id="pbg-status-list">
              {Array.from(new Set(useShmStore.getState().shms.filter(s => s.statusPbg === 'lainnya' && s.statusPbgKustom).map(s => s.statusPbgKustom as string))).map((cs) => (
                <option key={cs} value={cs} />
              ))}
            </datalist>
          </div>
        )}
      </form>
    </Modal>
  );
}