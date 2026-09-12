import { useState, useRef, type FormEvent } from 'react';
import {
  useShmStore,
  type Shm,
  type StatusShm,
  type StatusPbg,
  STATUS_SHM_LABELS,
  STATUS_SHM_COLOR,
  STATUS_PBG_LABELS,
  STATUS_PBG_COLOR,
} from '../../../store/shmStore';
import { usePinjamanBankStore } from '../../../store/pinjamanBankStore';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ExportButton from '../../../components/ui/ExportButton';
import { buildFilename } from '../../../utils/exportUtils';
import ShmFormModal from './ShmFormModal';
import ShmRiwayatModal from './ShmRiwayatModal';
import { History, Pencil, Trash2 } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────
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

interface AgunanShmTabProps {
  selectedProyekId?: string;
  selectedBulan?: string;
}

// ── Component ────────────────────────────────────────────────
export default function AgunanShmTab({ selectedProyekId, selectedBulan }: AgunanShmTabProps) {
  const { shms, removeShm, updateStatus, getCustomStatuses, getCustomLokasis } = useShmStore();
  const pinjamans = usePinjamanBankStore((s) => s.pinjamans);

  // ── Filters ─────────────────────────────────────────────────
  const [filterStatusShm, setFilterStatusShm] = useState<StatusShm | 'semua'>('semua');
  const [filterStatusPbg, setFilterStatusPbg] = useState<StatusPbg | 'semua'>('semua');

  // ── Modal: Tambah Dokumen ────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);

  // ── Modal: Riwayat ───────────────────────────────────────────
  const [riwayatShm, setRiwayatShm] = useState<Shm | null>(null);

  // ── Modal: Hapus ─────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Shm | null>(null);

  // ── Modal: Ubah Status ───────────────────────────────────────
  const [ubahTarget, setUbahTarget] = useState<Shm | null>(null);
  const [ubahStatus, setUbahStatus] = useState<StatusShm>('di_kantor');
  const [ubahStatusKustom, setUbahStatusKustom] = useState('');
  const [ubahLokasi, setUbahLokasi] = useState('');
  const [ubahKeterangan, setUbahKeterangan] = useState('');
  const [ubahPinjamanId, setUbahPinjamanId] = useState('');
  const [ubahNamaBank, setUbahNamaBank] = useState('');
  const [lokasiSuggestions, setLokasiSuggestions] = useState<string[]>([]);
  const lokasiInputRef = useRef<HTMLInputElement>(null);

  const aktivPinjamans = pinjamans.filter((p) => p.status === 'aktif');

  // ── Filtered rows ────────────────────────────────────────────
  const filtered = shms.filter((s) => {
    if (filterStatusShm !== 'semua' && s.status !== filterStatusShm) return false;
    if (filterStatusPbg !== 'semua' && s.statusPbg !== filterStatusPbg) return false;
    return true;
  });

  // ── Ubah Status helpers ──────────────────────────────────────
  const openUbahStatus = (shm: Shm) => {
    setUbahTarget(shm);
    setUbahStatus(shm.status);
    setUbahStatusKustom(shm.statusKustom ?? '');
    setUbahLokasi(shm.lokasi);
    setUbahKeterangan('');
    setUbahPinjamanId(shm.pinjamanBankId ?? '');
    setUbahNamaBank(shm.namaBank ?? '');
    setLokasiSuggestions([]);
  };

  const closeUbahStatus = () => {
    setUbahTarget(null);
    setUbahStatus('di_kantor');
    setUbahStatusKustom('');
    setUbahLokasi('');
    setUbahKeterangan('');
    setUbahPinjamanId('');
    setUbahNamaBank('');
    setLokasiSuggestions([]);
  };

  const handlePinjamanChange = (id: string) => {
    setUbahPinjamanId(id);
    const found = pinjamans.find((p) => p.id === id);
    setUbahNamaBank(found?.namaBank ?? '');
  };

  const handleLokasiChange = (val: string) => {
    setUbahLokasi(val);
    if (val.trim().length > 0) {
      const all = getCustomLokasis();
      setLokasiSuggestions(
        all.filter((l) => l.toLowerCase().includes(val.toLowerCase()) && l !== val)
      );
    } else {
      setLokasiSuggestions([]);
    }
  };

  const handleUbahSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!ubahTarget || !ubahLokasi.trim()) return;
    if (ubahStatus === 'dijaminkan' && !ubahPinjamanId) return;
    if (ubahStatus === 'lainnya' && !ubahStatusKustom.trim()) return;

    updateStatus(
      ubahTarget.id,
      ubahStatus,
      ubahLokasi.trim(),
      ubahKeterangan.trim() || undefined,
      ubahStatus === 'dijaminkan' ? ubahPinjamanId : undefined,
      ubahStatus === 'dijaminkan' ? ubahNamaBank : undefined,
      ubahStatus === 'lainnya' ? ubahStatusKustom.trim() : undefined,
    );
    closeUbahStatus();
  };

  const ubahIsValid =
    ubahLokasi.trim() !== '' &&
    (ubahStatus !== 'dijaminkan' || ubahPinjamanId !== '') &&
    (ubahStatus !== 'lainnya' || ubahStatusKustom.trim() !== '');

  // ── Badge renderer ───────────────────────────────────────────
  const renderShmBadge = (shm: Shm) => {
    const label =
      shm.status === 'lainnya' && shm.statusKustom
        ? shm.statusKustom
        : STATUS_SHM_LABELS[shm.status];
    const color = STATUS_SHM_COLOR[shm.status];
    return (
      <span className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  const renderPbgBadge = (shm: Shm) => {
    const label =
      shm.statusPbg === 'lainnya' && shm.statusPbgKustom
        ? shm.statusPbgKustom
        : STATUS_PBG_LABELS[shm.statusPbg];
    const color = STATUS_PBG_COLOR[shm.statusPbg];
    return (
      <span className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  // ── Custom status options for filter ─────────────────────────
  const customStatuses = getCustomStatuses();

  return (
    <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full space-y-4">
      {/* Toolbar & Filters wrapped in #FCFBFC box with stroke */}
      <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3.5 md:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
        <p className="text-sm font-bold text-gray-900">
          Satu baris per kavling &middot; SHM dan PBG ({filtered.length} dokumen)
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Filter Status SHM */}
          <select
            value={filterStatusShm}
            onChange={(e) => setFilterStatusShm(e.target.value as StatusShm | 'semua')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="semua">Semua status SHM</option>
            {STATUS_SHM_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_SHM_LABELS[s]}
              </option>
            ))}
            {customStatuses.map((cs) => (
              <option key={`custom-${cs}`} value="lainnya">
                {cs}
              </option>
            ))}
          </select>

          {/* Filter Status PBG */}
          <select
            value={filterStatusPbg}
            onChange={(e) => setFilterStatusPbg(e.target.value as StatusPbg | 'semua')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="semua">Semua status PBG</option>
            {STATUS_PBG_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_PBG_LABELS[s]}
              </option>
            ))}
          </select>

          <ExportButton
            getColumns={() => [
              { header: 'No. SHM', key: 'nomorShm', width: 20 },
              { header: 'Kavling', key: 'kavling', width: 16 },
              { header: 'Status SHM', key: 'statusShm', width: 18 },
              { header: 'Lokasi', key: 'lokasi', width: 22 },
              { header: 'No. PBG', key: 'noPbg', width: 18 },
              { header: 'Status PBG', key: 'statusPbg', width: 18 },
              { header: 'Pinjaman Terkait', key: 'namaBank', width: 20 },
            ]}
            getData={() =>
              filtered.map((s) => ({
                nomorShm: s.nomorShm,
                kavling: s.kavling,
                statusShm: s.status === 'lainnya' && s.statusKustom ? s.statusKustom : STATUS_SHM_LABELS[s.status],
                lokasi: s.lokasi,
                noPbg: s.noPbg || '—',
                statusPbg: s.statusPbg === 'lainnya' && s.statusPbgKustom ? s.statusPbgKustom : STATUS_PBG_LABELS[s.statusPbg],
                namaBank: s.namaBank || '—',
              }))
            }
            opts={{
              namaLaporan: 'Laporan Dokumen Legal (SHM & PBG)',
              proyek: selectedProyekId,
              periode: selectedBulan,
              filenameBase: buildFilename('Dokumen_Legal', selectedProyekId, selectedBulan),
            }}
          />

          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm"
          >
            + Tambah dokumen
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">SHM / Kavling</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status SHM</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Lokasi</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">No. PBG</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status PBG</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Tidak ada data yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filtered.map((shm) => (
                <tr key={shm.id} className="hover:bg-gray-50/50">
                  {/* SHM / Kavling */}
                  <td className="px-4 py-3">
                    <span className="block font-medium text-gray-900">{shm.nomorShm}</span>
                    <span className="block text-xs text-gray-500">{shm.kavling}</span>
                  </td>

                  {/* Status SHM */}
                  <td className="px-4 py-3">{renderShmBadge(shm)}</td>

                  {/* Lokasi */}
                  <td className="px-4 py-3 text-gray-700">
                    {shm.lokasi === 'lainnya' && shm.lokasiKustom
                      ? shm.lokasiKustom
                      : shm.lokasi}
                  </td>

                  {/* No. PBG */}
                  <td className="px-4 py-3 text-gray-700">
                    {shm.noPbg && shm.noPbg.trim() !== '' ? shm.noPbg : '—'}
                  </td>

                  {/* Status PBG */}
                  <td className="px-4 py-3">{renderPbgBadge(shm)}</td>

                  {/* Aksi */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-start gap-1">
                      <button
                        onClick={() => setRiwayatShm(shm)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                        title="Lihat Riwayat"
                      >
                        <History className="h-3.5 w-3.5" />
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

      {/* Tambah Dokumen */}
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
              {STATUS_SHM_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_SHM_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Custom status text — shown when 'lainnya' is selected */}
          {ubahStatus === 'lainnya' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keterangan status <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="ubah-shm-status-list"
                value={ubahStatusKustom}
                onChange={(e) => setUbahStatusKustom(e.target.value.slice(0, 40))}
                placeholder="Contoh: Di BPN"
                maxLength={40}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
              <datalist id="ubah-shm-status-list">
                {customStatuses.map((cs) => (
                  <option key={cs} value={cs} />
                ))}
              </datalist>
            </div>
          )}

          {/* Lokasi baru with autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lokasi Baru <span className="text-red-500">*</span>
            </label>
            <input
              ref={lokasiInputRef}
              type="text"
              value={ubahLokasi}
              onChange={(e) => handleLokasiChange(e.target.value)}
              onBlur={() => setTimeout(() => setLokasiSuggestions([]), 150)}
              placeholder="Contoh: Bank Mandiri"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
            {lokasiSuggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg text-sm max-h-40 overflow-y-auto">
                {lokasiSuggestions.map((sug) => (
                  <li
                    key={sug}
                    onMouseDown={() => {
                      setUbahLokasi(sug);
                      setLokasiSuggestions([]);
                    }}
                    className="cursor-pointer px-3 py-2 hover:bg-indigo-50 text-gray-700"
                  >
                    {sug}
                  </li>
                ))}
              </ul>
            )}
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
                      {p.namaBank} — Rp {p.totalPencairan.toLocaleString('id-ID')}
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
        title="Hapus Dokumen Legal"
        message={`Yakin ingin menghapus SHM "${deleteTarget?.nomorShm ?? ''}"? Data riwayat juga akan terhapus.`}
        confirmLabel="Ya, Hapus"
        isDestructive
      />
    </div>
  );
}