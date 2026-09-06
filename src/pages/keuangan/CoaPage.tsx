import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useCoaStore, type Akun, type TipeAkun, type SaldoNormal, TIPE_AKUN_LABELS } from '../../store/coaStore';

const TIPE_COLOR: Record<TipeAkun, string> = {
  aset: 'bg-blue-100 text-blue-700',
  kewajiban: 'bg-red-100 text-red-700',
  ekuitas: 'bg-purple-100 text-purple-700',
  pendapatan: 'bg-emerald-100 text-emerald-700',
  beban: 'bg-orange-100 text-orange-700',
};

const EMPTY_FORM = {
  kodeAkun: '',
  namaAkun: '',
  tipe: 'aset' as TipeAkun,
  saldoNormal: 'debit' as SaldoNormal,
  keterangan: '',
};

export default function CoaPage() {
  const { items, add, update, remove } = useCoaStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(
      (a) =>
        a.namaAkun.toLowerCase().includes(q) ||
        a.kodeAkun.toLowerCase().includes(q) ||
        TIPE_AKUN_LABELS[a.tipe].toLowerCase().includes(q)
    );
  }, [items, search]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (item: Akun) => {
    setForm({
      kodeAkun: item.kodeAkun,
      namaAkun: item.namaAkun,
      tipe: item.tipe,
      saldoNormal: item.saldoNormal,
      keterangan: item.keterangan ?? '',
    });
    setErrors({});
    setEditId(item.id);
    setModalOpen(true);
  };

  const validate = () => {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.kodeAkun.trim()) e.kodeAkun = 'Kode akun wajib diisi';
    else if (
      !editId &&
      items.some((a) => a.kodeAkun.toLowerCase() === form.kodeAkun.toLowerCase())
    )
      e.kodeAkun = 'Kode akun sudah digunakan';
    if (!form.namaAkun.trim()) e.namaAkun = 'Nama akun wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      kodeAkun: form.kodeAkun.trim(),
      namaAkun: form.namaAkun.trim(),
      tipe: form.tipe,
      saldoNormal: form.saldoNormal,
      keterangan: form.keterangan.trim() || undefined,
    };
    if (editId) {
      update(editId, payload);
    } else {
      add(payload);
    }
    setModalOpen(false);
  };

  const columns: Column<Akun>[] = [
    { key: 'kodeAkun', label: 'Kode Akun', className: 'font-mono' },
    { key: 'namaAkun', label: 'Nama Akun' },
    {
      key: 'tipe',
      label: 'Tipe',
      render: (r) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TIPE_COLOR[r.tipe]}`}>
          {TIPE_AKUN_LABELS[r.tipe]}
        </span>
      ),
    },
    {
      key: 'saldoNormal',
      label: 'Saldo Normal',
      render: (r) => (
        <span className="capitalize text-gray-600">{r.saldoNormal}</span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600">
            <Pencil className="h-4 w-4" />
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chart of Account (COA)</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daftar akun keuangan Podorukun</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Akun
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Cari kode atau nama akun..."
          className="w-full sm:w-80 rounded-xl border border-gray-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(r) => r.id}
        page={page}
        onPageChange={setPage}
        emptyMessage="Tidak ada akun yang ditemukan."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Akun' : 'Tambah Akun'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Batal
            </button>
            <button onClick={handleSubmit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {editId ? 'Simpan Perubahan' : 'Tambah'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Akun <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.kodeAkun}
                onChange={(e) => setForm({ ...form, kodeAkun: e.target.value })}
                placeholder="mis: 1-1000"
                className={`w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.kodeAkun ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.kodeAkun && <p className="mt-1 text-xs text-red-500">{errors.kodeAkun}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Akun <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.namaAkun}
                onChange={(e) => setForm({ ...form, namaAkun: e.target.value })}
                placeholder="mis: Kas"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.namaAkun ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.namaAkun && <p className="mt-1 text-xs text-red-500">{errors.namaAkun}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Akun</label>
              <select
                value={form.tipe}
                onChange={(e) => setForm({ ...form, tipe: e.target.value as TipeAkun })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {(Object.keys(TIPE_AKUN_LABELS) as TipeAkun[]).map((t) => (
                  <option key={t} value={t}>{TIPE_AKUN_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Normal</label>
              <select
                value={form.saldoNormal}
                onChange={(e) => setForm({ ...form, saldoNormal: e.target.value as SaldoNormal })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="debit">Debit</option>
                <option value="kredit">Kredit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <input
              type="text"
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              placeholder="Keterangan opsional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove(deleteId)}
        message="Hapus akun ini? Pastikan akun tidak sedang digunakan di jurnal sebelum dihapus."
      />
    </div>
  );
}
