import { useState, type FormEvent } from 'react';
import { useShmStore, type Shm, type StatusShm, STATUS_SHM_LABELS, STATUS_SHM_COLOR } from '../../../store/shmStore';
import { usePinjamanBankStore } from '../../../store/pinjamanBankStore';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ShmFormModal from './ShmFormModal';
import ShmRiwayatModal from './ShmRiwayatModal';
import { Plus, History, Pencil, Trash2 } from 'lucide-react';

const STATUS_OPTIONS: StatusShm[] = ['di_notaris', 'di_kantor', 'dijaminkan', 'sudah_ditebus'];

export default function AgunanShmTab() {
  const { shms, removeShm, updateStatus } = useShmStore();
  const pinjamans = usePinjamanBankStore((s) => s.pinjamans);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [riwayatShm, setRiwayatShm] = useState<Shm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shm | null>(null);

  // Ubah Status modal
  const [ubahTarget, setUbahTarget] = useState<Shm | null>(null);
  const [ubahStatus, setUbahStatus] = useState<StatusShm>('di_kantor');
  const [ubahLokasi, setUbahLokasi] = useState('');
  const [ubahKeterangan, setUbahKeterangan] = useState('');
  const [ubahPinjamanId, setUbahPinjamanId] = useState('');
  const [ubahNamaBank, setUbahNamaBank] = useState('');

  const aktivPinjamans = pinjamans.filter((p) => p.status === 'aktif');

  // ── Ubah Status helpers ──────────────────────────────────────
  const openUbahStatus = (shm: Shm) => {
    setUbahTarget(shm);
    setUbahStatus(shm.status);
    setUbahLokasi(shm.lokasi);
    setUbahKeterangan('');
    setUbahPinjamanId(shm.pinjamanBankId ?? '');
    setUbahNamaBank(shm.namaBank ?? '');
  };

  const closeUbahStatus = () => {
    setUbahTarget(null);
    setUbahStatus('di_kantor');
    setUbahLokasi('');
    setUbahKeterangan('');
    setUbahPinjamanId('');
    setUbahNamaBank('');
  };

  const handlePinjamanChange = (id: string) => {
    setUbahPinjamanId(id);
    const found = pinjamans.find((p) => p.id === id);
    setUbahNamaBank(found?.namaBank ?? '');
  };

  const handleUbahSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!ubahTarget || !ubahLokasi.trim()) return;
    if (ubahStatus === 'dijaminkan' && !ubahPinjamanId) return;

    updateStatus(
      ubahTarget.id,
      ubahStatus,
      ubahLokasi.trim(),
      ubahKeterangan.trim() || undefined,
      ubahStatus === 'dijaminkan' ? ubahPinjamanId : undefined,
      ubahStatus === 'dijaminkan' ? ubahNamaBank : undefined
    );
    closeUbahStatus();
  };

  const ubahIsValid =
    ubahLokasi.trim() !== '' &&
    (ubahStatus !== 'dijaminkan' || ubahPinjamanId !== '');

  // ── Helpers ────────────────────────────────────────────────
  const getPinjamanLabel = (shm: Shm): string => {
    if (!shm.pinjamanBankId) return '-';
    return shm.namaBank ?? '-';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Tracking posisi sertifikat SHM kavling
        </p>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Tambah SHM
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">No. SHM</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Kavling</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Lokasi Saat Ini</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Pinjaman Terkait</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {shms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Belum ada data SHM.
                </td>
              </tr>
            ) : (
              shms.map((shm) => (
                <tr key={shm.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{shm.nomorShm}</td>
                  <td className="px-4 py-3 text-gray-700">{shm.kavling}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_SHM_COLOR[shm.status]}`}
                    >
                      {STATUS_SHM_LABELS[shm.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{shm.lokasi}</td>
                  <td className="px-4 py-3 text-gray-700">{getPinjamanLabel(shm)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setRiwayatShm(shm)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                        title="Lihat Riwayat"
                      >
                        <History className="h-3.5 w-3.5" />
                        Riwayat
                      </button>
                      <button
                        onClick={() => openUbahStatus(shm)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50"
                        title="Ubah Status"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Ubah Status
                      </button>
                      <button
                        onClick={() => setDeleteTarget(shm)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}

      {/* Tambah SHM */}
      <ShmFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} />

      {/* Riwayat SHM */}
      <ShmRiwayatModal
        shm={riwayatShm}
        isOpen={riwayatShm !== null}
        onClose={() => setRiwayatShm(null)}
      />

      {/* Ubah Status Modal */}
      <Modal
        isOpen={ubahTarget !== null}
        onClose={closeUbahStatus}
        title={`Ubah Status — ${ubahTarget?.nomorShm ?? ''}`}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={closeUbahStatus}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              form="ubah-status-form"
              disabled={!ubahIsValid}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Simpan
            </button>
          </>
        }
      >
        <form id="ubah-status-form" onSubmit={handleUbahSubmit} className="space-y-4">
          {/* Status baru */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Baru <span className="text-red-500">*</span>
            </label>
            <select
              value={ubahStatus}
              onChange={(e) => setUbahStatus(e.target.value as StatusShm)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_SHM_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Lokasi baru */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lokasi Baru <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ubahLokasi}
              onChange={(e) => setUbahLokasi(e.target.value)}
              placeholder="Contoh: Bank Mandiri"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea
              value={ubahKeterangan}
              onChange={(e) => setUbahKeterangan(e.target.value)}
              rows={2}
              placeholder="Opsional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Conditional: Pinjaman Bank */}
          {ubahStatus === 'dijaminkan' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pinjaman Bank <span className="text-red-500">*</span>
                </label>
                <select
                  value={ubahPinjamanId}
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

              {ubahNamaBank && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                  <input
                    type="text"
                    value={ubahNamaBank}
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                  />
                </div>
              )}
            </>
          )}
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) removeShm(deleteTarget.id);
        }}
        title="Hapus SHM"
        message={`Yakin ingin menghapus SHM "${deleteTarget?.nomorShm ?? ''}"? Data riwayat juga akan terhapus.`}
        confirmLabel="Ya, Hapus"
        isDestructive
      />
    </div>
  );
}
