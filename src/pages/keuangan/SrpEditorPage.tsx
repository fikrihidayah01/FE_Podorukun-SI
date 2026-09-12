import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSrpStore } from '../../store/srpStore';
import SummernoteEditor from '../../components/ui/SummernoteEditor';
import {
  MdSave,
  MdArrowBack,
  MdDownload,
  MdFileDownload,
  MdCheckCircle,
} from 'react-icons/md';

export default function SrpEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { docs, update } = useSrpStore();

  const doc = docs.find((d) => d.id === id);

  const [judul, setJudul] = useState(doc?.judul ?? '');
  const [content, setContent] = useState(doc?.content ?? '');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Manual save
  const handleSave = useCallback(() => {
    if (!id) return;
    setIsSaving(true);
    update(id, { judul, content });
    setSavedAt(new Date());
    setTimeout(() => setIsSaving(false), 300);
  }, [id, judul, content, update]);

  // Auto-save debounced 2 detik
  useEffect(() => {
    const timer = setTimeout(() => {
      if (id && (judul !== doc?.judul || content !== doc?.content)) {
        handleSave();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [judul, content, id, doc, handleSave]);

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <p className="text-gray-500 font-medium">Dokumen tidak ditemukan.</p>
        <button
          onClick={() => navigate('/keuangan/srp')}
          className="text-sm text-indigo-600 hover:underline cursor-pointer"
        >
          ← Kembali ke daftar SRP
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 md:px-8 md:py-4 w-full flex items-center gap-3">
        <button
          onClick={() => {
            handleSave();
            navigate('/keuangan/srp');
          }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
        >
          <MdArrowBack className="h-4 w-4" />
          Kembali
        </button>

        <input
          type="text"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Judul Dokumen SRP"
          className="flex-1 text-lg font-semibold text-gray-900 bg-transparent border-b border-transparent focus:border-indigo-400 focus:outline-none px-1 py-0.5"
        />

        <div className="flex items-center gap-2 shrink-0">
          {/* Save status */}
          {savedAt && !isSaving && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <MdCheckCircle className="h-3.5 w-3.5" />
              Tersimpan {savedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {/* Export buttons */}
          <button
            type="button"
            title="Export PDF (segera hadir)"
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 cursor-not-allowed opacity-60"
          >
            <MdFileDownload className="h-3.5 w-3.5" />
            PDF
          </button>
          <button
            type="button"
            title="Export Word (segera hadir)"
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 cursor-not-allowed opacity-60"
          >
            <MdDownload className="h-3.5 w-3.5" />
            Word
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-70 cursor-pointer shadow-sm"
          >
            <MdSave className="h-4 w-4" />
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* Editor card with Summernote */}
      <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col rounded-xl bg-white shadow-sm p-4 overflow-y-auto">
          <SummernoteEditor
            value={content}
            onChange={setContent}
            placeholder="Tulis uraian pengajuan atau isi dokumen SRP..."
            height={480}
          />
        </div>
      </div>
    </div>
  );
}
