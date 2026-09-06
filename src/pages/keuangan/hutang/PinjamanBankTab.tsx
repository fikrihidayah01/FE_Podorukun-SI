import { useState, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle, Building2 } from 'lucide-react';
import { usePinjamanBankStore, type PinjamanBank } from '../../../store/pinjamanBankStore';
import { useProyekStore } from '../../../store/proyekStore';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import PinjamanBankDetailModal from './PinjamanBankDetailModal';

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

// ── Add-Pinjaman form state ──────────────────────────────────
interface FormState {
  proyekId: string;
  namaBank: string;
  tanggalPencairan: string;
  nominalPencairan: string;
  tanggalJatuhTempo: string;
  keterangan: string;
}

const INITIAL_FORM: FormState = {
  proyekId: '',
  namaBank: '',
  tanggalPencairan: '',
  nominalPencairan: '',
  tanggalJatuhTempo: '',
  keterangan: '',
};

export default function PinjamanBankTab() {
  const { pinjamans, addPinjaman, removePinjaman, getDueSoon } = usePinjamanBankStore();
  const proyeks = useProyekStore((s) => s.items);

  // modals
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [formError, setFormError] = useState('');

  const [detailPinjaman, setDetailPinjaman] = useState<PinjamanBank | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PinjamanBank | null>(null);

  // ── Reminder banner ────────────────────────────────────────
  const dueSoon = useMemo(() => getDueSoon(7), [pinjamans]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ────────────────────────────────────────────────
  const proyekName = (pid: string) => proyeks.find((p) => p.id === pid)?.nama ?? '-';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const daysUntil = (iso: string) => {
    const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
    return diff;
  };

  // ── Form handlers ──────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...INITIAL_FORM, proyekId: proyeks[0]?.id ?? '' });
    setFormError('');
    setShowAdd(true);
  };

  const handleSubmit = () => {
    const nominal = Number(form.nominalPencairan);

    if (!form.proyekId || !form.namaBank.trim() || !form.tanggalPencairan || !form.tanggalJatuhTempo) {
      setFormError('Semua field wajib harus diisi.');
      return;
    }
    if (!nominal || nominal <= 0) {
      setFormError('Nominal pencairan harus lebih dari 0.');
      return;
    }

    addPinjaman({
      proyekId: form.proyekId,
      namaBank: form.namaBank.trim(),
      tanggalPencairan: form.tanggalPencairan,
      nominalPencairan: nominal,
      tanggalJatuhTempo: form.tanggalJatuhTempo,
      keterangan: form.keterangan.trim() || undefined,
    });

    setShowAdd(false);
  };

  // ── Status badge ───────────────────────────────────────────
  const StatusBadge = ({ status }: { status: PinjamanBank['status'] }) => {
    const cls =
      status === 'lunas'
        ? 'bg-green-50 text-green-700 ring-green-600/20'
        : 'bg-blue-50 text-blue-700 ring-blue-600/20';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
        {status === 'lunas' ? 'Lunas' : 'Aktif'}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Reminder Banner ───────────────────────────────── */}
      {dueSoon.length > 0 && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            dueSoon.some((p) => daysUntil(p.tanggalJatuhTempo) <= 3)
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Pinjaman mendekati jatuh tempo!</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {dueSoon.map((p) => (
                <li key={p.id}>
                  <span className="font-medium">{p.namaBank}</span> – jatuh tempo{' '}
                  {formatDate(p.tanggalJatuhTempo)} ({daysUntil(p.tanggalJatuhTempo)} hari lagi)
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Header + Add button ───────────────────────────── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">
          {pinjamans.length} pinjaman tercatat
        </h3>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah Pinjaman
        </button>
      </div>

      {/* ── Loan table ────────────────────────────────────── */}
      {pinjamans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-gray-400">
          <Building2 className="h-10 w-10 mb-2" />
          <p className="text-sm">Belum ada pinjaman bank.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Nama Bank', 'Proyek', 'Tgl Pencairan', 'Nominal Pencairan', 'Sisa Pokok', 'Jatuh Tempo', 'Status', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pinjamans.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setDetailPinjaman(p)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{p.namaBank}</td>
                  <td className="px-4 py-3 text-gray-700">{proyekName(p.proyekId)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(p.tanggalPencairan)}</td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{formatRupiah(p.nominalPencairan)}</td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{formatRupiah(p.sisaPokok)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(p.tanggalJatuhTempo)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(p);
                      }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      aria-label="Hapus pinjaman"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Pinjaman Modal ────────────────────────────── */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Tambah Pinjaman Bank"
        footer={
          <>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Simpan
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

          {/* Proyek */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proyek</label>
            <select
              value={form.proyekId}
              onChange={(e) => setForm({ ...form, proyekId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="" disabled>
                Pilih proyek
              </option>
              {proyeks.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Nama Bank */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
            <input
              type="text"
              value={form.namaBank}
              onChange={(e) => setForm({ ...form, namaBank: e.target.value })}
              placeholder="Contoh: Bank Mandiri"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Tanggal Pencairan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pencairan</label>
            <input
              type="date"
              value={form.tanggalPencairan}
              onChange={(e) => setForm({ ...form, tanggalPencairan: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Nominal Pencairan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Pencairan</label>
            <input
              type="number"
              min={0}
              value={form.nominalPencairan}
              onChange={(e) => setForm({ ...form, nominalPencairan: e.target.value })}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Tanggal Jatuh Tempo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Jatuh Tempo</label>
            <input
              type="date"
              value={form.tanggalJatuhTempo}
              onChange={(e) => setForm({ ...form, tanggalJatuhTempo: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* ── Detail Modal ──────────────────────────────────── */}
      <PinjamanBankDetailModal
        pinjaman={detailPinjaman}
        isOpen={detailPinjaman !== null}
        onClose={() => setDetailPinjaman(null)}
      />

      {/* ── Delete Confirm ────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) removePinjaman(deleteTarget.id);
        }}
        title="Hapus Pinjaman"
        message={`Yakin ingin menghapus pinjaman "${deleteTarget?.namaBank ?? ''}"? Semua riwayat pembayaran juga akan dihapus.`}
        confirmLabel="Ya, Hapus"
        isDestructive
      />
    </div>
  );
}
