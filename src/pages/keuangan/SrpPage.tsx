import { useState } from 'react';
import {
  MdAdd,
  MdDescription,
  MdEdit,
  MdDeleteOutline,
  MdSchedule,
  MdOpenInNew,
  MdOpenInFull,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useSrpStore, type SrpDoc } from '../../store/srpStore';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import SummernoteEditor from '../../components/ui/SummernoteEditor';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SrpPage() {
  const { docs, create, update, remove } = useSrpStore();
  const navigate = useNavigate();

  // Dialog & Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formJudul, setFormJudul] = useState('');
  const [formContent, setFormContent] = useState('');
  const [titleError, setTitleError] = useState('');

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormJudul('');
    setFormContent('');
    setTitleError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (doc: SrpDoc) => {
    setEditingId(doc.id);
    setFormJudul(doc.judul);
    setFormContent(doc.content || '');
    setTitleError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormJudul('');
    setFormContent('');
    setTitleError('');
  };

  const handleSave = () => {
    if (!formJudul.trim()) {
      setTitleError('Judul dokumen wajib diisi');
      return;
    }

    if (editingId) {
      update(editingId, {
        judul: formJudul.trim(),
        content: formContent,
      });
    } else {
      create(formJudul.trim(), formContent);
    }

    handleCloseModal();
  };

  const handleOpenFullPage = () => {
    let targetId = editingId;
    if (!targetId) {
      targetId = create(formJudul.trim() || 'Dokumen Baru', formContent);
    } else {
      update(targetId, {
        judul: formJudul.trim() || 'Tanpa Judul',
        content: formContent,
      });
    }

    handleCloseModal();
    navigate(`/keuangan/srp/${targetId}`);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-white border-b border-gray-200 px-6 py-4 md:px-8 md:py-5 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">SRP — Dokumen</h1>
          <p className="text-sm text-gray-500 mt-0.5">Buat dan kelola dokumen SRP keuangan</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          <MdAdd className="h-4 w-4" />
          Buat Dokumen
        </button>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="rounded-xl border border-dashed border-gray-300 bg-white shadow-sm p-12 max-w-sm w-full">
            <MdDescription className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">Belum ada dokumen SRP</p>
            <p className="mt-1 text-sm text-gray-400">Klik "Buat Dokumen" untuk membuat dokumen baru</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="group relative rounded-xl bg-white p-5 shadow-sm transition-all cursor-pointer"
              onClick={() => handleOpenEdit(doc)}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <MdDescription className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{doc.judul}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <MdSchedule className="h-3 w-3" />
                    <span>{timeAgo(doc.updatedAt)}</span>
                  </div>
                  {doc.content && (
                    <p
                      className="mt-2 text-xs text-gray-500 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: doc.content.replace(/<[^>]+>/g, ' ').slice(0, 100) + '...',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Aksi */}
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  title="Edit Dokumen"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(doc);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                >
                  <MdEdit className="h-4 w-4" />
                </button>
                <button
                  title="Buka Halaman Penuh"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/keuangan/srp/${doc.id}`);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                >
                  <MdOpenInNew className="h-4 w-4" />
                </button>
                <button
                  title="Hapus Dokumen"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(doc.id);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                >
                  <MdDeleteOutline className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Pop Up Form: Judul & Rich Text Editor (Summernote) dalam satu modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Dokumen SRP' : 'Buat Dokumen SRP Baru'}
        size="xl"
        headerActions={
          <button
            type="button"
            onClick={handleOpenFullPage}
            title="Buka Halaman Penuh"
            aria-label="Buka Halaman Penuh"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <MdOpenInFull className="h-4 w-4" />
          </button>
        }
        footer={
          <>
            <button
              type="button"
              onClick={handleCloseModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer shadow-sm"
            >
              {editingId ? 'Simpan Perubahan' : 'Simpan Dokumen'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Field 1: Judul Dokumen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul Dokumen <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formJudul}
              onChange={(e) => {
                setFormJudul(e.target.value);
                setTitleError('');
              }}
              placeholder="mis: SRP Proyek Gedung A - Sept 2026"
              autoFocus
              className={`w-full rounded-lg border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                titleError ? 'border-red-400 bg-red-50/50' : 'border-gray-300'
              }`}
            />
            {titleError && <p className="mt-1 text-xs text-red-500">{titleError}</p>}
          </div>

          {/* Field 2: Uraian / Konten RTE dengan Summernote */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Uraian / Isi Dokumen (RTE)
              </label>
            </div>
            <SummernoteEditor
              value={formContent}
              onChange={setFormContent}
              placeholder="Tulis uraian rencana pembayaran, rincian biaya, atau catatan SRP di sini..."
              height={260}
            />
          </div>
        </div>
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove(deleteId)}
        message="Hapus dokumen SRP ini? Semua konten di dalamnya akan hilang permanen."
      />
    </div>
  );
}
