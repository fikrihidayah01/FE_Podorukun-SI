import { useState, useMemo } from 'react';
import { Plus, Search, Lock, Trash2 } from 'lucide-react';
import { useJurnalStore, type Jurnal, type JurnalRow } from '../../store/jurnalStore';
import { useCoaStore } from '../../store/coaStore';
import { useProyekStore } from '../../store/proyekStore';
import Modal from '../../components/ui/Modal';
import DataTable, { type Column } from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

function formatRupiah(n: number) {
  return n === 0 ? '0' : n.toLocaleString('id-ID'); // In mockup, 0 is just 0
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Dummy data for Kode Pembantu
const DUMMY_KODE_PEMBANTU = [
  { id: 'LH-0008', nama: 'Pemilik lahan — Pak Warsito', kategori: 'Lahan', type: 'Hutang', proyek: 'Atlantis Hills' },
  { id: 'BK-0001', nama: 'Bank Mandiri', kategori: 'Bank', type: 'Hutang', proyek: 'Umum' },
  { id: 'KT-0012', nama: 'PT Bangun Jaya', kategori: 'Kontraktor', type: 'Hutang', proyek: 'Atlantis Icon' },
];

const EMPTY_ROW = (): JurnalRow => ({
  id: crypto.randomUUID(),
  akunId: '',
  kodePembantuId: '',
  keterangan: '',
  debit: 0,
  kredit: 0,
});

export default function JurnalPage() {
  const { items, add, remove } = useJurnalStore();
  const { items: akuns } = useCoaStore();
  const { items: proyeks } = useProyekStore();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [detailJurnal, setDetailJurnal] = useState<Jurnal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filters
  const [filterProyek, setFilterProyek] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSumber, setFilterSumber] = useState('all');
  const [search, setSearch] = useState('');

  // Form state
  const [tanggal, setTanggal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [formProyekId, setFormProyekId] = useState('');
  const [rows, setRows] = useState<JurnalRow[]>([EMPTY_ROW(), EMPTY_ROW()]);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const dummyNomorBukti = 'BM/26/09/013';

  const totalDebit = rows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalKredit = rows.reduce((s, r) => s + (Number(r.kredit) || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalKredit;

  // Validation
  const getAkun = (id: string) => akuns.find(a => a.id === id);
  const hasEmptyWajibKodePembantu = rows.some(r => {
    const akun = getAkun(r.akunId);
    return akun?.wajibKodePembantu && !r.kodePembantuId;
  });

  const isPeriodeTerbuka = true;

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(item => {
      const matchSearch = item.nomorJurnal.toLowerCase().includes(q) || item.keterangan.toLowerCase().includes(q);
      const matchProyek = filterProyek === 'all' || item.proyekId === filterProyek;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchSumber = filterSumber === 'all' || item.sumber === filterSumber;
      return matchSearch && matchProyek && matchStatus && matchSumber;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [items, search, filterProyek, filterStatus, filterSumber]);

  const openForm = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    setKeterangan('');
    setFormProyekId('');
    setRows([EMPTY_ROW(), EMPTY_ROW()]);
    setFormErrors([]);
    setFormOpen(true);
  };

  const updateRow = (id: string, field: keyof JurnalRow, value: string | number) => {
    setRows((prev) => prev.map((r) => {
      if (r.id === id) {
        const newRow = { ...r, [field]: value };
        // Mutual exclusion for Debit/Kredit
        if (field === 'debit' && Number(value) > 0) newRow.kredit = 0;
        if (field === 'kredit' && Number(value) > 0) newRow.debit = 0;
        return newRow;
      }
      return r;
    }));
  };

  const addRow = () => setRows((prev) => [...prev, EMPTY_ROW()]);
  const removeRow = (id: string) => {
    if (rows.length <= 2) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const validate = (isPosting: boolean): boolean => {
    const errs: string[] = [];
    if (!tanggal) errs.push('Tanggal jurnal wajib diisi.');
    if (!formProyekId) errs.push('Proyek jurnal wajib dipilih.');
    if (!keterangan.trim()) errs.push('Keterangan jurnal wajib diisi.');
    if (rows.some((r) => !r.akunId)) errs.push('Semua baris harus memilih akun.');
    
    if (isPosting) {
      if (totalDebit === 0) errs.push('Total debit tidak boleh nol untuk posting.');
      if (!isBalanced) errs.push(`Total debit harus sama dengan total kredit untuk posting.`);
      if (hasEmptyWajibKodePembantu) errs.push('Ada baris yang mewajibkan kode pembantu tetapi masih kosong.');
    }
    
    setFormErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = (status: 'draft' | 'diposting') => {
    if (!validate(status === 'diposting')) return;
    add({
      tanggal,
      keterangan: keterangan.trim(),
      proyekId: formProyekId || undefined,
      sumber: 'manual',
      status,
      rows: rows.map((r) => ({ ...r, debit: Number(r.debit), kredit: Number(r.kredit) })),
    });
    setFormOpen(false);
    setPage(1);
  };

  const getAkunLabel = (id: string) => {
    const a = getAkun(id);
    return a ? `${a.kodeAkun} — ${a.namaAkun}` : '-';
  };

  const getProyekName = (id?: string) => {
    if (!id) return '-';
    return proyeks.find(p => p.id === id)?.nama || 'Proyek tidak diketahui';
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'diposting':
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Diposting</span>;
      case 'draft':
        return <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">Draft</span>;
      case 'dikoreksi':
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Dikoreksi</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">{status}</span>;
    }
  };

  const renderSumber = (sumber: string) => {
    let color = 'bg-gray-100 text-gray-800 border-gray-200';
    if (sumber === 'pinjaman') color = 'bg-purple-50 text-purple-700 border-purple-200';
    else if (sumber === 'kontraktor') color = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (sumber === 'mirror') color = 'bg-red-50 text-red-700 border-red-200';
    else if (sumber === 'manual') color = 'bg-gray-50 text-gray-700 border-gray-200';

    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color} capitalize`}>
        {sumber}
      </span>
    );
  };

  const columns: Column<Jurnal>[] = [
    { key: 'tanggal', label: 'Tanggal', render: (r) => formatDate(r.tanggal) },
    { key: 'nomorJurnal', label: 'No. bukti', render: (r) => <span className="font-medium text-gray-900">{r.nomorJurnal}</span> },
    { 
      key: 'keterangan', 
      label: 'Uraian',
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{r.keterangan}</span>
          {r.proyekId && <span className="text-xs text-gray-500 mt-0.5">{getProyekName(r.proyekId)}</span>}
        </div>
      )
    },
    {
      key: 'totalDebit',
      label: 'Total',
      className: 'text-right',
      render: (r) => <span className="font-medium">{formatRupiah(r.rows.reduce((s, row) => s + row.debit, 0))}</span>,
    },
    { key: 'sumber', label: 'Sumber', render: (r) => renderSumber(r.sumber) },
    { key: 'status', label: 'Status', render: (r) => renderStatus(r.status) },
  ];

  // Dynamic Notice generator
  const activeNoticeRow = rows.find(r => r.akunId && r.kodePembantuId && r.debit + r.kredit > 0);
  let noticeText = null;
  if (activeNoticeRow) {
    const kp = DUMMY_KODE_PEMBANTU.find(k => k.id === activeNoticeRow.kodePembantuId);
    if (kp) {
      const mutasiVal = formatRupiah(activeNoticeRow.debit + activeNoticeRow.kredit);
      const isAktiva = getAkun(activeNoticeRow.akunId)?.kategori === 'aktiva';
      // simple mock logic for direction:
      let direction = 'bertambah';
      if ((isAktiva && activeNoticeRow.kredit > 0) || (!isAktiva && activeNoticeRow.debit > 0)) {
        direction = 'berkurang';
      }
      noticeText = `${kp.type} · ${kp.kategori} · ${kp.nama} · ${kp.proyek} · mutasi ${direction} ${mutasiVal}`;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jurnal umum</h1>
          <p className="text-sm text-gray-500 mt-0.5">Periode September 2026</p>
        </div>
        <div className="flex items-center gap-3">
          {isPeriodeTerbuka ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Periode terbuka
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600">
              <Lock className="h-3.5 w-3.5" />
              Periode terkunci
            </span>
          )}
          <button
            onClick={openForm}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Buat jurnal
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48">
            <select
              value={filterProyek}
              onChange={(e) => { setFilterProyek(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            >
              <option value="all">Semua proyek</option>
              {proyeks.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            >
              <option value="all">Semua status</option>
              <option value="draft">Draft</option>
              <option value="diposting">Diposting</option>
              <option value="dikoreksi">Dikoreksi</option>
            </select>
          </div>
          <div className="w-full sm:w-40">
            <select
              value={filterSumber}
              onChange={(e) => { setFilterSumber(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            >
              <option value="all">Semua sumber</option>
              <option value="manual">Manual</option>
              <option value="pinjaman">Pinjaman</option>
              <option value="kontraktor">Kontraktor</option>
              <option value="mirror">Mirror</option>
            </select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari no. bukti atau uraian"
              className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredItems}
          keyExtractor={(r) => r.id}
          page={page}
          onPageChange={setPage}
          emptyMessage="Tidak ada data jurnal yang cocok."
          onRowClick={(r) => setDetailJurnal(r)}
        />
      </div>

      {/* Form Input Jurnal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Input jurnal umum"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Mutasi akan tercatat di saldo berjalan sesuai akun dan kode pembantu</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tanggal <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">No. bukti <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={dummyNomorBukti}
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-500 px-3 py-2 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Proyek <span className="text-red-500">*</span></label>
              <select
                value={formProyekId}
                onChange={(e) => setFormProyekId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">-- Pilih Proyek --</option>
                {proyeks.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Keterangan <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Pembayaran lahan kavling A-08..."
                className="w-full rounded-xl border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {formErrors.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3">
              <ul className="list-disc list-inside space-y-1">
                {formErrors.map((e, i) => (
                  <li key={i} className="text-xs text-red-600 font-medium">{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-2xs">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-600 w-56">Akun</th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-600 w-44">Kode pembantu</th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-600">Keterangan</th>
                  <th className="px-3.5 py-2.5 text-right text-xs font-semibold text-gray-600 w-32">Debit</th>
                  <th className="px-3.5 py-2.5 text-right text-xs font-semibold text-gray-600 w-32">Kredit</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const selectedAkun = getAkun(row.akunId);
                  const isWajib = selectedAkun?.wajibKodePembantu;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2">
                        <select
                          value={row.akunId}
                          onChange={(e) => updateRow(row.id, 'akunId', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          <option value="">-- Pilih --</option>
                          {akuns.filter(a => a.status === 'aktif' && !akuns.some(child => child.akunIndukId === a.id)).map((a) => (
                            <option key={a.id} value={a.id}>{a.kodeAkun} — {a.namaAkun}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        {selectedAkun ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={row.kodePembantuId || ''}
                              onChange={(e) => updateRow(row.id, 'kodePembantuId', e.target.value)}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                              <option value="">{isWajib ? 'Pilih' : 'Tidak wajib'}</option>
                              {DUMMY_KODE_PEMBANTU.map(kp => (
                                <option key={kp.id} value={kp.id}>{kp.id}</option>
                              ))}
                            </select>
                            {isWajib && <span className="text-red-500 font-bold text-base">*</span>}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs px-2.5">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.keterangan}
                          onChange={(e) => updateRow(row.id, 'keterangan', e.target.value)}
                          placeholder="Opsional"
                          className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={row.debit || ''}
                          onChange={(e) => updateRow(row.id, 'debit', Number(e.target.value))}
                          disabled={row.kredit > 0}
                          min={0}
                          placeholder="0"
                          className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-right text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={row.kredit || ''}
                          onChange={(e) => updateRow(row.id, 'kredit', Number(e.target.value))}
                          disabled={row.debit > 0}
                          min={0}
                          placeholder="0"
                          className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-right text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length <= 2}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="px-3.5 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center">
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Tambah baris
              </button>
            </div>
          </div>
          
          <div className="flex justify-end pt-1 px-2 gap-8 text-right">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">Total debit</p>
              <p className="text-base font-bold text-gray-900">{formatRupiah(totalDebit)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">Total kredit</p>
              <p className="text-base font-bold text-gray-900">{formatRupiah(totalKredit)}</p>
            </div>
          </div>

          {/* Posting Readiness */}
          <div className={`rounded-xl p-3.5 flex items-center gap-2 text-sm font-medium border ${
            isBalanced && !hasEmptyWajibKodePembantu
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <span>
              {isBalanced && !hasEmptyWajibKodePembantu
                ? '✓ Seimbang. Siap diposting.'
                : 'Belum seimbang atau data belum lengkap.'}
            </span>
          </div>

          {/* Dynamic Notice Impact */}
          {noticeText && (
            <div className="rounded-xl p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-sm">
              <div className="font-semibold mb-1 flex items-center gap-1.5 text-blue-800">
                <span className="text-base leading-none">→</span> Akan tercatat di saldo berjalan
              </div>
              <div className="text-blue-700">{noticeText}</div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100/70 transition-colors shadow-2xs cursor-pointer"
            >
              Simpan draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('diposting')}
              disabled={!isBalanced || hasEmptyWajibKodePembantu}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors cursor-pointer"
            >
              Simpan dan posting
            </button>
          </div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div><span className="text-gray-500 block text-xs uppercase mb-1">Tanggal</span><p className="font-semibold text-gray-900">{formatDate(detailJurnal.tanggal)}</p></div>
              <div><span className="text-gray-500 block text-xs uppercase mb-1">Proyek</span><p className="font-semibold text-gray-900">{getProyekName(detailJurnal.proyekId)}</p></div>
              <div><span className="text-gray-500 block text-xs uppercase mb-1">Sumber</span><div className="mt-0.5">{renderSumber(detailJurnal.sumber)}</div></div>
              <div><span className="text-gray-500 block text-xs uppercase mb-1">Status</span><div className="mt-0.5">{renderStatus(detailJurnal.status)}</div></div>
              <div className="col-span-2 md:col-span-4"><span className="text-gray-500 block text-xs uppercase mb-1">Uraian</span><p className="font-semibold text-gray-900">{detailJurnal.keterangan}</p></div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Akun</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Kode pembantu</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Keterangan</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Debit</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {detailJurnal.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 text-gray-800">{getAkunLabel(r.akunId)}</td>
                      <td className="px-4 py-2 text-gray-500">{r.kodePembantuId || '-'}</td>
                      <td className="px-4 py-2 text-gray-500">{r.keterangan || '-'}</td>
                      <td className="px-4 py-2 text-right font-medium">{r.debit ? formatRupiah(r.debit) : '-'}</td>
                      <td className="px-4 py-2 text-right font-medium">{r.kredit ? formatRupiah(r.kredit) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                    <td className="px-4 py-3" colSpan={3}>Total</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{formatRupiah(detailJurnal.rows.reduce((s, r) => s + r.debit, 0))}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{formatRupiah(detailJurnal.rows.reduce((s, r) => s + r.kredit, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {detailJurnal.status === 'draft' && (
               <div className="flex justify-end gap-3 pt-2">
                 <button onClick={() => { remove(detailJurnal.id); setDetailJurnal(null); }} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">
                   Hapus Jurnal
                 </button>
               </div>
            )}
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
