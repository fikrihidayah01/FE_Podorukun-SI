import { useState } from 'react';
import { Plus, Trash2, PlusCircle, MinusCircle, Eye } from 'lucide-react';
import { useJurnalStore, type Jurnal, type JurnalRow } from '../../store/jurnalStore';
import { useCoaStore } from '../../store/coaStore';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DataTable, { type Column } from '../../components/ui/DataTable';

function formatRupiah(n: number) {
  return n === 0 ? '-' : 'Rp ' + n.toLocaleString('id-ID');
}

const EMPTY_ROW = (): JurnalRow => ({
  id: crypto.randomUUID(),
  akunId: '',
  keterangan: '',
  debit: 0,
  kredit: 0,
});

export default function JurnalPage() {
  const { items, add, remove } = useJurnalStore();
  const { items: akuns } = useCoaStore();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [detailJurnal, setDetailJurnal] = useState<Jurnal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [tanggal, setTanggal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [rows, setRows] = useState<JurnalRow[]>([EMPTY_ROW(), EMPTY_ROW()]);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const totalDebit = rows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalKredit = rows.reduce((s, r) => s + (Number(r.kredit) || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalKredit;

  const openForm = () => {
    setTanggal('');
    setKeterangan('');
    setRows([EMPTY_ROW(), EMPTY_ROW()]);
    setFormErrors([]);
    setFormOpen(true);
  };

  const updateRow = (id: string, field: keyof JurnalRow, value: string | number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, EMPTY_ROW()]);
  const removeRow = (id: string) => {
    if (rows.length <= 2) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!tanggal) errs.push('Tanggal jurnal wajib diisi.');
    if (!keterangan.trim()) errs.push('Keterangan jurnal wajib diisi.');
    if (rows.some((r) => !r.akunId)) errs.push('Semua baris harus memilih akun.');
    if (totalDebit === 0) errs.push('Total debit tidak boleh nol.');
    if (!isBalanced) errs.push(`Total debit (${formatRupiah(totalDebit)}) harus sama dengan total kredit (${formatRupiah(totalKredit)}).`);
    setFormErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    add({
      tanggal,
      keterangan: keterangan.trim(),
      rows: rows.map((r) => ({ ...r, debit: Number(r.debit), kredit: Number(r.kredit) })),
    });
    setFormOpen(false);
    setPage(1);
  };

  const getAkunLabel = (id: string) => {
    const a = akuns.find((a) => a.id === id);
    return a ? `${a.kodeAkun} — ${a.namaAkun}` : '-';
  };

  const columns: Column<Jurnal>[] = [
    { key: 'nomorJurnal', label: 'No. Jurnal' },
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'keterangan', label: 'Keterangan' },
    {
      key: 'totalDebit',
      label: 'Total Debit',
      render: (r) => formatRupiah(r.rows.reduce((s, row) => s + row.debit, 0)),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      className: 'text-left',
      render: (r) => (
        <div className="flex justify-start gap-2">
          <button onClick={() => setDetailJurnal(r)} className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteId(r.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jurnal Umum</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pencatatan transaksi debit-kredit</p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Input Jurnal
        </button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(r) => r.id}
        page={page}
        onPageChange={setPage}
        emptyMessage="Belum ada jurnal. Klik 'Input Jurnal' untuk memulai."
      />

      {/* Form Input Jurnal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Input Jurnal Umum"
        size="xl"
        footer={
          <>
            <div className="flex-1 text-sm">
              {isBalanced ? (
                <span className="text-emerald-600 font-medium">✓ Debit = Kredit = {formatRupiah(totalDebit)}</span>
              ) : (
                <span className="text-red-500">
                  Debit: {formatRupiah(totalDebit)} | Kredit: {formatRupiah(totalKredit)}
                </span>
              )}
            </div>
            <button onClick={() => setFormOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isBalanced}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simpan Jurnal
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Header form */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keterangan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Keterangan transaksi"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Validation errors */}
          {formErrors.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <ul className="list-disc list-inside space-y-1">
                {formErrors.map((e, i) => (
                  <li key={i} className="text-xs text-red-600">{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Dynamic rows */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-64">Akun</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Keterangan</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-32">Debit (Rp)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-32">Kredit (Rp)</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">
                      <select
                        value={row.akunId}
                        onChange={(e) => updateRow(row.id, 'akunId', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="">-- Pilih Akun --</option>
                        {akuns.filter(a => !akuns.some(child => child.akunIndukId === a.id)).map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.kodeAkun} — {a.namaAkun}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.keterangan}
                        onChange={(e) => updateRow(row.id, 'keterangan', e.target.value)}
                        placeholder="Opsional"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.debit || ''}
                        onChange={(e) => updateRow(row.id, 'debit', Number(e.target.value))}
                        min={0}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.kredit || ''}
                        onChange={(e) => updateRow(row.id, 'kredit', Number(e.target.value))}
                        min={0}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length <= 2}
                        className="text-gray-300 hover:text-red-500 disabled:cursor-not-allowed"
                      >
                        <MinusCircle className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Totals */}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-3 py-2 text-sm text-gray-600" colSpan={2}>Total</td>
                  <td className={`px-3 py-2 text-sm text-left ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>
                    {formatRupiah(totalDebit)}
                  </td>
                  <td className={`px-3 py-2 text-sm text-left ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>
                    {formatRupiah(totalKredit)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <PlusCircle className="h-4 w-4" />
            Tambah Baris
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailJurnal !== null}
        onClose={() => setDetailJurnal(null)}
        title={`Detail Jurnal — ${detailJurnal?.nomorJurnal}`}
        size="lg"
      >
        {detailJurnal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Tanggal</span><p className="font-medium">{detailJurnal.tanggal}</p></div>
              <div><span className="text-gray-500">Keterangan</span><p className="font-medium">{detailJurnal.keterangan}</p></div>
            </div>
            <table className="min-w-full text-sm rounded-xl overflow-hidden border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Akun</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Keterangan</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Debit</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detailJurnal.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 text-xs">{getAkunLabel(r.akunId)}</td>
                    <td className="px-4 py-2 text-gray-500">{r.keterangan || '-'}</td>
                    <td className="px-4 py-2 text-left">{r.debit ? formatRupiah(r.debit) : '-'}</td>
                    <td className="px-4 py-2 text-left">{r.kredit ? formatRupiah(r.kredit) : '-'}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold text-emerald-700">
                  <td className="px-4 py-2" colSpan={2}>Total</td>
                  <td className="px-4 py-2 text-left">{formatRupiah(detailJurnal.rows.reduce((s, r) => s + r.debit, 0))}</td>
                  <td className="px-4 py-2 text-left">{formatRupiah(detailJurnal.rows.reduce((s, r) => s + r.kredit, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove(deleteId)}
        message="Hapus jurnal ini? Data yang sudah dihapus tidak dapat dikembalikan."
      />
    </div>
  );
}
