import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { 
  useCoaStore, 
  type Akun, 
  type KategoriAkun, 
  type KlasifikasiAkun, 
  type TipeSaldo, 
  type KategoriHutangPiutang,
  type StatusAkun,
  KATEGORI_AKUN_LABELS,
  KLASIFIKASI_AKUN_LABELS,
  KATEGORI_HUTANG_PIUTANG_LABELS
} from '../../store/coaStore';

const EMPTY_FORM: Partial<Akun> = {
  kodeAkun: '',
  namaAkun: '',
  kategori: 'aktiva',
  tipeSaldo: 'd',
  klasifikasi: 'neraca',
  status: 'aktif',
  wajibKodePembantu: false,
  wajibProyek: false,
  isKasBank: false,
  kategoriHutangPiutang: undefined,
  akunIndukId: '',
};

export default function DaftarAkunTab() {
  const { items, add, update, remove } = useCoaStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState<string>('all');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Parent IDs to determine if an account is a parent
  const parentIds = useMemo(() => new Set(items.map(a => a.akunIndukId).filter(Boolean)), [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter((a) => {
        const matchSearch = a.namaAkun.toLowerCase().includes(q) || a.kodeAkun.toLowerCase().includes(q);
        const matchKat = filterKategori === 'all' || a.kategori === filterKategori;
        const matchKlas = filterKlasifikasi === 'all' || a.klasifikasi === filterKlasifikasi;
        return matchSearch && matchKat && matchKlas;
      })
      .sort((a, b) => a.kodeAkun.localeCompare(b.kodeAkun)); // Sort by kodeAkun to keep hierarchy naturally
  }, [items, search, filterKategori, filterKlasifikasi]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (item: Akun) => {
    setForm({
      ...item,
      akunIndukId: item.akunIndukId || '',
    });
    setErrors({});
    setEditId(item.id);
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.kodeAkun?.trim()) {
      e.kodeAkun = 'Kode akun wajib diisi';
    } else if (form.kodeAkun.length !== 6) {
      e.kodeAkun = 'Kode akun harus 6 digit';
    } else if (
      !editId &&
      items.some((a) => a.kodeAkun.toLowerCase() === form.kodeAkun?.trim().toLowerCase())
    ) {
      e.kodeAkun = 'Kode akun sudah digunakan';
    }

    if (!form.namaAkun?.trim()) e.namaAkun = 'Nama akun wajib diisi';
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      kodeAkun: form.kodeAkun!.trim(),
      namaAkun: form.namaAkun!.trim(),
      kategori: form.kategori as KategoriAkun,
      tipeSaldo: form.tipeSaldo as TipeSaldo,
      klasifikasi: form.klasifikasi as KlasifikasiAkun,
      status: form.status as StatusAkun,
      akunIndukId: form.akunIndukId || undefined,
      wajibKodePembantu: form.wajibKodePembantu || false,
      wajibProyek: form.wajibProyek || false,
      isKasBank: form.isKasBank || false,
      kategoriHutangPiutang: ['hutang', 'aktiva'].includes(form.kategori as string) ? form.kategoriHutangPiutang : undefined,
    };
    if (editId) {
      update(editId, payload);
    } else {
      add(payload);
    }
    setModalOpen(false);
  };

  const columns: Column<Akun>[] = [
    { 
      key: 'kodeAkun', 
      label: 'Kode',
      render: (r) => (
        <span className={`${parentIds.has(r.id) ? 'font-bold' : ''}`}>
          {r.kodeAkun}
        </span>
      )
    },
    { 
      key: 'namaAkun', 
      label: 'Nama Akun',
      render: (r) => (
        <div className={`${r.akunIndukId ? 'pl-6' : ''} ${parentIds.has(r.id) ? 'font-bold' : ''}`}>
          {r.namaAkun}
        </div>
      )
    },
    {
      key: 'kategori',
      label: 'Kategori',
      render: (r) => KATEGORI_AKUN_LABELS[r.kategori],
    },
    {
      key: 'tipeSaldo',
      label: 'D/K',
      render: (r) => r.tipeSaldo.toUpperCase(),
    },
    {
      key: 'klasifikasi',
      label: 'Klasifikasi',
      render: (r) => KLASIFIKASI_AKUN_LABELS[r.klasifikasi],
    },
    {
      key: 'aturan',
      label: 'Aturan',
      render: (r) => {
        const badges = [];
        if (parentIds.has(r.id)) {
          badges.push(
            <span key="induk" className="w-32 inline-flex items-center justify-start text-left px-3 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
              Akun induk
            </span>
          );
        } else {
          if (r.isKasBank) {
            badges.push(
              <span key="kas" className="w-32 inline-flex items-center justify-start text-left px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Kas / bank
              </span>
            );
          }
          if (r.wajibProyek) {
            badges.push(
              <span key="proyek" className="w-32 inline-flex items-center justify-start text-left px-3 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Wajib proyek
              </span>
            );
          }
          if (r.wajibKodePembantu) {
            badges.push(
              <span key="pembantu" className="w-32 inline-flex items-center justify-start text-left px-3 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Kode pembantu
              </span>
            );
          }
        }
        
        if (badges.length === 0) return <span className="text-gray-400">—</span>;
        
        return <div className="flex flex-col gap-1">{badges}</div>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`w-32 inline-flex items-center justify-start text-left px-3 py-0.5 rounded-full text-xs font-medium ${r.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {r.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
    {
      key: 'aksi',
      label: 'Aksi',
      className: 'text-left',
      render: (r) => (
        <div className="flex justify-start gap-2">
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
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Akun (COA)</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.filter(i => i.status === 'aktif').length} akun aktif</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah akun
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full space-y-4">
        <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3 md:p-3.5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari kode atau nama akun"
              className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={filterKategori}
              onChange={(e) => { setFilterKategori(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            >
              <option value="all">Semua kategori</option>
              {Object.entries(KATEGORI_AKUN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={filterKlasifikasi}
              onChange={(e) => { setFilterKlasifikasi(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            >
              <option value="all">Semua klasifikasi</option>
              {Object.entries(KLASIFIKASI_AKUN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(r) => r.id}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          emptyMessage="Tidak ada akun yang ditemukan."
          rowClassName={(r) => parentIds.has(r.id) ? 'bg-gray-50/50' : ''}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit akun' : 'Tambah akun'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Batal
            </button>
            <button onClick={handleSubmit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {editId ? 'Simpan akun' : 'Simpan akun'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Akun induk
            </label>
            <select
              value={form.akunIndukId || ''}
              onChange={(e) => setForm({ ...form, akunIndukId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— Tidak ada —</option>
              {items.filter(i => !parentIds.has(i.id) || parentIds.has(i.id)).map(i => (
                <option key={i.id} value={i.id} disabled={i.id === editId}>
                  {i.kodeAkun} — {i.namaAkun}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode akun <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.kodeAkun}
                onChange={(e) => setForm({ ...form, kodeAkun: e.target.value })}
                placeholder="mis: 213020"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.kodeAkun ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.kodeAkun && <p className="mt-1 text-xs text-red-500">{errors.kodeAkun}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama akun <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.namaAkun}
                onChange={(e) => setForm({ ...form, namaAkun: e.target.value })}
                placeholder="mis: Hutang material"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.namaAkun ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.namaAkun && <p className="mt-1 text-xs text-red-500">{errors.namaAkun}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value as KategoriAkun })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {Object.entries(KATEGORI_AKUN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe saldo</label>
              <select
                value={form.tipeSaldo}
                onChange={(e) => setForm({ ...form, tipeSaldo: e.target.value as TipeSaldo })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="d">Debit</option>
                <option value="k">Kredit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klasifikasi</label>
              <select
                value={form.klasifikasi}
                onChange={(e) => setForm({ ...form, klasifikasi: e.target.value as KlasifikasiAkun })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {Object.entries(KLASIFIKASI_AKUN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['hutang', 'aktiva'].includes(form.kategori as string) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori hutang / piutang</label>
                <select
                  value={form.kategoriHutangPiutang || ''}
                  onChange={(e) => setForm({ ...form, kategoriHutangPiutang: e.target.value as KategoriHutangPiutang })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">— Pilih —</option>
                  {Object.entries(KATEGORI_HUTANG_PIUTANG_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Menentukan pengelompokan di halaman Hutang dan Piutang.</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as StatusAkun })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aturan akun</label>
            <div className="rounded-xl border border-gray-200 p-4 space-y-4 bg-white">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.wajibKodePembantu}
                  onChange={(e) => setForm({ ...form, wajibKodePembantu: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="block text-sm font-medium text-gray-900">Wajib kode pembantu</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Jurnal ditolak jika kode pembantu kosong</span>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.wajibProyek}
                  onChange={(e) => setForm({ ...form, wajibProyek: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="block text-sm font-medium text-gray-900">Wajib proyek</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Setiap transaksi harus terikat satu proyek</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isKasBank}
                  onChange={(e) => setForm({ ...form, isKasBank: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="block text-sm font-medium text-gray-900">Akun kas / bank</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Muncul di dropdown form pembayaran</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) remove(deleteId);
          setDeleteId(null);
        }}
        message="Hapus akun ini? Pastikan akun tidak sedang digunakan di jurnal sebelum dihapus."
      />
    </div>
  );
}
