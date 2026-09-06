import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useHutangStore, type Hutang, type StatusHutang } from '../../store/hutangStore';

const STATUS_LABEL: Record<StatusHutang, string> = {
  belum_lunas: 'Belum Lunas',
  sebagian: 'Sebagian',
  lunas: 'Lunas',
};

const STATUS_COLOR: Record<StatusHutang, string> = {
  belum_lunas: 'bg-red-100 text-red-700',
  sebagian: 'bg-yellow-100 text-yellow-700',
  lunas: 'bg-emerald-100 text-emerald-700',
};

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

const EMPTY_FORM = {
  namaKreditur: '',
  jumlah: '',
  tanggalHutang: '',
  tanggalJatuhTempo: '',
  keterangan: '',
  status: 'belum_lunas' as StatusHutang,
};

export default function HutangPage() {
  const { items, add, update, remove } = useHutangStore();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (item: Hutang) => {
    setForm({
      namaKreditur: item.namaKreditur,
      jumlah: String(item.jumlah),
      tanggalHutang: item.tanggalHutang,
      tanggalJatuhTempo: item.tanggalJatuhTempo,
      keterangan: item.keterangan,
      status: item.status,
    });
    setErrors({});
    setEditId(item.id);
    setModalOpen(true);
  };

  const validate = () => {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.namaKreditur.trim()) e.namaKreditur = 'Nama kreditur wajib diisi';
    if (!form.jumlah || Number(form.jumlah) <= 0) e.jumlah = 'Jumlah harus lebih dari 0';
    if (!form.tanggalHutang) e.tanggalHutang = 'Tanggal hutang wajib diisi';
    if (!form.tanggalJatuhTempo) e.tanggalJatuhTempo = 'Tanggal jatuh tempo wajib diisi';
    else if (form.tanggalHutang && form.tanggalJatuhTempo < form.tanggalHutang)
      e.tanggalJatuhTempo = 'Jatuh tempo harus ≥ tanggal hutang';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      namaKreditur: form.namaKreditur.trim(),
      jumlah: Number(form.jumlah),
      tanggalHutang: form.tanggalHutang,
      tanggalJatuhTempo: form.tanggalJatuhTempo,
      keterangan: form.keterangan.trim(),
      status: form.status,
    };
    if (editId) {
      update(editId, payload);
    } else {
      add(payload);
    }
    setModalOpen(false);
    setPage(1);
  };

  const columns: Column<Hutang>[] = [
    { key: 'namaKreditur', label: 'Nama Kreditur' },
    {
      key: 'jumlah',
      label: 'Jumlah',
      render: (r) => formatRupiah(r.jumlah),
    },
    { key: 'tanggalHutang', label: 'Tgl. Hutang' },
    { key: 'tanggalJatuhTempo', label: 'Jatuh Tempo' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}>
          {STATUS_LABEL[r.status]}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEdit(r)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteId(r.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hutang</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pencatatan data hutang Podorukun</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Hutang
        </button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(r) => r.id}
        page={page}
        onPageChange={setPage}
        emptyMessage="Belum ada data hutang."
      />

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Hutang' : 'Tambah Hutang'}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {editId ? 'Simpan Perubahan' : 'Tambah'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Nama Kreditur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Kreditur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.namaKreditur}
              onChange={(e) => setForm({ ...form, namaKreditur: e.target.value })}
              placeholder="Nama bank / perusahaan / perorangan"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.namaKreditur ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.namaKreditur && <p className="mt-1 text-xs text-red-500">{errors.namaKreditur}</p>}
          </div>

          {/* Jumlah */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.jumlah}
              onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
              placeholder="0"
              min={0}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.jumlah ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.jumlah && <p className="mt-1 text-xs text-red-500">{errors.jumlah}</p>}
          </div>

          {/* Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Hutang <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.tanggalHutang}
                onChange={(e) => setForm({ ...form, tanggalHutang: e.target.value })}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.tanggalHutang ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.tanggalHutang && <p className="mt-1 text-xs text-red-500">{errors.tanggalHutang}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jatuh Tempo <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.tanggalJatuhTempo}
                onChange={(e) => setForm({ ...form, tanggalJatuhTempo: e.target.value })}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.tanggalJatuhTempo ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.tanggalJatuhTempo && <p className="mt-1 text-xs text-red-500">{errors.tanggalJatuhTempo}</p>}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as StatusHutang })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="belum_lunas">Belum Lunas</option>
              <option value="sebagian">Sebagian</option>
              <option value="lunas">Lunas</option>
            </select>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              rows={3}
              placeholder="Keterangan tambahan (opsional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove(deleteId)}
        message="Apakah Anda yakin ingin menghapus data hutang ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
