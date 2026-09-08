import { useState, useMemo } from 'react';
import { Plus, Trash2, Bell, AlertTriangle, Building2 } from 'lucide-react';
import {
  usePinjamanBankStore,
  type PinjamanBank,
  type PolaPembayaran,
  POLA_PEMBAYARAN_LABELS,
  POLA_PEMBAYARAN_COLOR,
} from '../../../store/pinjamanBankStore';
import { useProyekStore } from '../../../store/proyekStore';
import { useCoaStore } from '../../../store/coaStore';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ExportButton from '../../../components/ui/ExportButton';
import { buildFilename } from '../../../utils/exportUtils';
import PinjamanBankDetailModal from './PinjamanBankDetailModal';

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

interface FormState {
  proyekId: string;
  namaBank: string;
  pola: PolaPembayaran;
  tanggalPencairanAwal: string;
  nominalPencairanAwal: string;
  tanggalAcuanBunga: string;
  tanggalJatuhTempoPokok: string;
  akunHutangId: string;
  akunBebanBungaId: string;
  keterangan: string;
}

const INITIAL_FORM: FormState = {
  proyekId: '',
  namaBank: '',
  pola: 'terpisah',
  tanggalPencairanAwal: '',
  nominalPencairanAwal: '',
  tanggalAcuanBunga: '15',
  tanggalJatuhTempoPokok: '',
  akunHutangId: '',
  akunBebanBungaId: '',
  keterangan: '',
};

interface PinjamanBankTabProps {
  selectedProyekId?: string;
  selectedBulan?: string;
}

export default function PinjamanBankTab({ selectedProyekId, selectedBulan }: PinjamanBankTabProps) {
  const { pinjamans, addPinjaman, removePinjaman, getDueReminders } = usePinjamanBankStore();
  const proyeks = useProyekStore((s) => s.items);
  const akuns = useCoaStore((s) => s.items);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [formError, setFormError] = useState('');

  const [detailPinjaman, setDetailPinjaman] = useState<PinjamanBank | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PinjamanBank | null>(null);

  // Reminders for banner
  const reminders = useMemo(() => getDueReminders(14), [pinjamans, getDueReminders]);

  const filteredPinjamans = useMemo(() => {
    if (!selectedProyekId) return pinjamans;
    return pinjamans.filter((p) => p.proyekId === selectedProyekId);
  }, [pinjamans, selectedProyekId]);

  const proyekName = (pid: string) => proyeks.find((p) => p.id === pid)?.nama ?? pid;

  const openAdd = () => {
    setForm({ ...INITIAL_FORM, proyekId: selectedProyekId || proyeks[0]?.id || '' });
    setFormError('');
    setShowAdd(true);
  };

  const handleSubmit = () => {
    const nominal = Number(form.nominalPencairanAwal);
    const acuanBunga = Number(form.tanggalAcuanBunga);

    if (
      !form.proyekId ||
      !form.namaBank.trim() ||
      !form.tanggalPencairanAwal ||
      !form.tanggalJatuhTempoPokok ||
      !nominal ||
      nominal <= 0 ||
      !acuanBunga ||
      acuanBunga < 1 ||
      acuanBunga > 31
    ) {
      setFormError('Lengkapi semua field wajib dengan benar (nominal > 0, tanggal acuan bunga 1–31).');
      return;
    }

    addPinjaman({
      proyekId: form.proyekId,
      namaBank: form.namaBank.trim(),
      pola: form.pola,
      tanggalPencairanAwal: form.tanggalPencairanAwal,
      nominalPencairanAwal: nominal,
      tanggalAcuanBunga: acuanBunga,
      tanggalJatuhTempoPokok: form.tanggalJatuhTempoPokok,
      akunHutangId: form.akunHutangId || undefined,
      akunBebanBungaId: form.akunBebanBungaId || undefined,
      keterangan: form.keterangan.trim() || undefined,
    });

    setShowAdd(false);
  };

  return (
    <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full space-y-4">
      {/* ── Jatuh Tempo Mendekat Banner ───── */}
      {reminders.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3.5 text-red-900 shadow-sm">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="text-sm">
            <p className="font-semibold text-red-900">Jatuh tempo mendekat</p>
            <p className="mt-0.5 text-xs text-red-700">
              {reminders.slice(0, 3).map((r) => r.label).join('. ')}.
            </p>
          </div>
        </div>
      )}

      {/* ── Action Toolbar: Title / Count + Export + Add Button ─ */}
      <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-900">
          {filteredPinjamans.length} pinjaman tercatat
        </h3>

        <div className="flex items-center gap-2">
          <ExportButton
            getColumns={() => [
              { header: 'Bank', key: 'namaBank', width: 20 },
              { header: 'Proyek', key: 'proyek', width: 18 },
              { header: 'Pola Pembayaran', key: 'pola', width: 16 },
              { header: 'Total Pencairan', key: 'totalPencairan', isNumber: true, width: 20 },
              { header: 'Sisa Pokok', key: 'sisaPokok', isNumber: true, width: 20 },
              { header: 'Penebusan', key: 'penebusan', isNumber: true, width: 20 },
              { header: 'Acuan Bunga', key: 'acuanBunga', width: 16 },
              { header: 'Jatuh Tempo Pokok', key: 'jatuhTempoPokok', width: 18 },
            ]}
            getData={() => [
              ...filteredPinjamans.map((p) => ({
                namaBank: p.namaBank,
                proyek: proyekName(p.proyekId),
                pola: POLA_PEMBAYARAN_LABELS[p.pola],
                totalPencairan: p.totalPencairan,
                sisaPokok: p.sisaPokok,
                penebusan: p.penebusan,
                acuanBunga: `Tgl ${p.tanggalAcuanBunga}`,
                jatuhTempoPokok: formatDate(p.tanggalJatuhTempoPokok),
              })),
              {
                namaBank: 'TOTAL',
                proyek: '',
                pola: '',
                totalPencairan: filteredPinjamans.reduce((s, p) => s + p.totalPencairan, 0),
                sisaPokok: filteredPinjamans.reduce((s, p) => s + p.sisaPokok, 0),
                penebusan: filteredPinjamans.reduce((s, p) => s + p.penebusan, 0),
                acuanBunga: '',
                jatuhTempoPokok: '',
              },
            ]}
            opts={{
              namaLaporan: 'Laporan Pinjaman Bank',
              proyek: selectedProyekId ? proyekName(selectedProyekId) : 'Semua Proyek',
              periode: selectedBulan,
              filenameBase: buildFilename(
                'Pinjaman_Bank',
                selectedProyekId ? proyekName(selectedProyekId) : undefined,
                selectedBulan
              ),
            }}
          />

          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah pinjaman
          </button>
        </div>
      </div>

      {/* ── Table matching media_1788804430820.png ───────────── */}
      {filteredPinjamans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-gray-400 bg-white shadow-sm">
          <Building2 className="h-10 w-10 mb-2 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Belum ada pinjaman bank.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Bank / proyek
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Pola
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total pencairan
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Sisa pokok
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Penebusan
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Jatuh tempo
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredPinjamans.map((p) => {
                const isNegativePenebusan = p.penebusan < 0;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setDetailPinjaman(p)}
                  >
                    {/* Bank / Proyek */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900">{p.namaBank}</p>
                      <p className="text-xs text-gray-500">{proyekName(p.proyekId)}</p>
                    </td>

                    {/* Pola */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full border px-3 py-0.5 text-xs font-medium ${POLA_PEMBAYARAN_COLOR[p.pola]}`}
                      >
                        {POLA_PEMBAYARAN_LABELS[p.pola]}
                      </span>
                    </td>

                    {/* Total Pencairan */}
                    <td className="px-4 py-3.5 text-left font-mono font-medium text-gray-900">
                      {formatRupiah(p.totalPencairan)}
                    </td>

                    {/* Sisa Pokok */}
                    <td className="px-4 py-3.5 text-left font-mono text-gray-800">
                      {formatRupiah(p.sisaPokok)}
                    </td>

                    {/* Penebusan (Warning if negative) */}
                    <td className="px-4 py-3.5 text-left font-mono font-medium">
                      {isNegativePenebusan ? (
                        <span className="flex items-center justify-start gap-1 text-red-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          ({formatRupiah(Math.abs(p.penebusan))})
                        </span>
                      ) : p.penebusan === 0 ? (
                        <span className="text-gray-400">Rp 0</span>
                      ) : (
                        <span className="text-gray-900">{formatRupiah(p.penebusan)}</span>
                      )}
                    </td>

                    {/* Jatuh Tempo */}
                    <td className="px-4 py-3.5 text-xs">
                      <p className="font-medium text-gray-900">Bunga tgl {p.tanggalAcuanBunga}</p>
                      <p className="text-gray-500">Pokok {formatDate(p.tanggalJatuhTempoPokok)}</p>
                    </td>

                    {/* Aksi */}
                    <td className="px-3 py-3.5 text-left">
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Pinjaman Modal ────────────────────────────── */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Tambah Pinjaman Bank"
        size="lg"
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
              Simpan Pinjaman
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Proyek */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proyek <span className="text-red-500">*</span>
              </label>
              <select
                value={form.proyekId}
                onChange={(e) => setForm({ ...form, proyekId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="">Pilih proyek</option>
                {proyeks.map((pr) => (
                  <option key={pr.id} value={pr.id}>{pr.nama}</option>
                ))}
              </select>
            </div>

            {/* Nama Bank */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Bank <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.namaBank}
                onChange={(e) => setForm({ ...form, namaBank: e.target.value })}
                placeholder="Contoh: Bank Mandiri"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pola Pembayaran */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pola Pembayaran <span className="text-red-500">*</span>
              </label>
              <select
                value={form.pola}
                onChange={(e) => setForm({ ...form, pola: e.target.value as PolaPembayaran })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="terpisah">Terpisah</option>
                <option value="satu_transfer">Satu transfer</option>
                <option value="bunga_rutin">Bunga rutin</option>
                <option value="fleksibel">Fleksibel</option>
              </select>
            </div>

            {/* Nominal Pencairan Awal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nominal Pencairan Awal <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.nominalPencairanAwal}
                onChange={(e) => setForm({ ...form, nominalPencairanAwal: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tanggal Pencairan Awal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tgl Pencairan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.tanggalPencairanAwal}
                onChange={(e) => setForm({ ...form, tanggalPencairanAwal: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>

            {/* Tanggal Acuan Bunga (1-31) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acuan Bunga (tgl 1–31) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={form.tanggalAcuanBunga}
                onChange={(e) => setForm({ ...form, tanggalAcuanBunga: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>

            {/* Tanggal Jatuh Tempo Pokok */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                JT Pokok <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.tanggalJatuhTempoPokok}
                onChange={(e) => setForm({ ...form, tanggalJatuhTempoPokok: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>
          </div>

          {/* Master COA Mapping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Akun Hutang (COA)
              </label>
              <select
                value={form.akunHutangId}
                onChange={(e) => setForm({ ...form, akunHutangId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="">Pilih Akun Hutang</option>
                {akuns.filter((a) => a.tipe === 'kewajiban').map((a) => (
                  <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Akun Beban Bunga (COA)
              </label>
              <select
                value={form.akunBebanBungaId}
                onChange={(e) => setForm({ ...form, akunBebanBungaId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="">Pilih Akun Beban</option>
                {akuns.filter((a) => a.tipe === 'beban').map((a) => (
                  <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}</option>
                ))}
              </select>
            </div>
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* ── Detail Modal (Payment entries + Top-up) ───────────── */}
      <PinjamanBankDetailModal
        pinjaman={detailPinjaman}
        isOpen={detailPinjaman !== null}
        onClose={() => setDetailPinjaman(null)}
      />

      {/* ── Delete Confirm ────────────────────────────────────── */}
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
