import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { usePiutangStore, type Piutang, type StatusPiutang } from '../../store/piutangStore';

const STATUS_LABEL: Record<StatusPiutang, string> = {
  belum_lunas: 'Belum Lunas',
  sebagian: 'Sebagian',
  lunas: 'Lunas',
};

const STATUS_COLOR: Record<StatusPiutang, string> = {
  belum_lunas: 'bg-red-100 text-red-700',
  sebagian: 'bg-yellow-100 text-yellow-700',
  lunas: 'bg-emerald-100 text-emerald-700',
};

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

const EMPTY_FORM = {
  namaDebitur: '',
  jumlah: '',
  tanggalPiutang: '',
  tanggalJatuhTempo: '',
  keterangan: '',
  status: 'belum_lunas' as StatusPiutang,
};

export default function PiutangPage() {
  const { items, add, update, remove } = usePiutangStore();
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

  const openEdit = (item: Piutang) => {
    setForm({
      namaDebitur: item.namaDebitur,
      jumlah: String(item.jumlah),
      tanggalPiutang: item.tanggalPiutang,
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
    if (!form.namaDebitur.trim()) e.namaDebitur = 'Nama debitur wajib diisi';
    if (!form.jumlah || Number(form.jumlah) <= 0) e.jumlah = 'Jumlah harus lebih dari 0';
    if (!form.tanggalPiutang) e.tanggalPiutang = 'Tanggal piutang wajib diisi';
    if (!form.tanggalJatuhTempo) e.tanggalJatuhTempo = 'Tanggal jatuh tempo wajib diisi';
    else if (form.tanggalPiutang && form.tanggalJatuhTempo < form.tanggalPiutang)
      e.tanggalJatuhTempo = 'Jatuh tempo harus ≥ tanggal piutang';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      namaDebitur: form.namaDebitur.trim(),
      jumlah: Number(form.jumlah),
      tanggalPiutang: form.tanggalPiutang,
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

  const columns: Column<Piutang>[] = [
    { key: 'namaDebitur', label: 'Nama Debitur' },
    { key: 'jumlah', label: 'Jumlah', render: (r) => formatRupiah(r.jumlah) },
    { key: 'tanggalPiutang', label: 'Tgl. Piutang' },
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
          <h1 className="text-xl font-bold text-gray-900">Piutang</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pencatatan data piutang Podorukun</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Piutang
        </button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(r) => r.id}
        page={page}
        onPageChange={setPage}
        emptyMessage="Belum ada data piutang."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Piutang' : 'Tambah Piutang'}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Debitur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.namaDebitur}
              onChange={(e) => setForm({ ...form, namaDebitur: e.target.value })}
              placeholder="Nama perusahaan / perorangan"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.namaDebitur ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.namaDebitur && <p className="mt-1 text-xs text-red-500">{errors.namaDebitur}</p>}
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Piutang <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.tanggalPiutang}
                onChange={(e) => setForm({ ...form, tanggalPiutang: e.target.value })}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.tanggalPiutang ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.tanggalPiutang && <p className="mt-1 text-xs text-red-500">{errors.tanggalPiutang}</p>}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as StatusPiutang })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="belum_lunas">Belum Lunas</option>
              <option value="sebagian">Sebagian</option>
              <option value="lunas">Lunas</option>
            </select>
          </div>

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

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove(deleteId)}
        message="Apakah Anda yakin ingin menghapus data piutang ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
