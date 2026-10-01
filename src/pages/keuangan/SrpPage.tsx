import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PiPlus, PiFileText, PiPencilSimple, PiTrash, PiArrowSquareOut, PiCornersOut } from 'react-icons/pi';
import { useSrpStore, type SrpDoc } from '../../store/srpStore';
import PageHeader, { PageBody } from '../../components/ui/PageHeader';
import Panel from '../../components/ui/Panel';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button, { IconButton } from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import SummernoteEditor from '../../components/ui/SummernoteEditor';

function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Teks polos dari HTML editor, untuk cuplikan di kartu. */
function cuplikan(html: string) {
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
  return text.replace(/\s+/g, ' ').trim();
}

export default function SrpPage() {
  const { docs, create, update, remove } = useSrpStore();
  const navigate = useNavigate();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formJudul, setFormJudul] = useState('');
  const [formContent, setFormContent] = useState('');
  const [titleError, setTitleError] = useState('');

  const sorted = [...docs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const openCreate = () => {
    setEditingId(null);
    setFormJudul('');
    setFormContent('');
    setTitleError('');
    setModalOpen(true);
  };

  const openEdit = (doc: SrpDoc) => {
    setEditingId(doc.id);
    setFormJudul(doc.judul);
    setFormContent(doc.content || '');
    setTitleError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formJudul.trim()) {
      setTitleError('Judul dokumen wajib diisi.');
      return;
    }
    if (editingId) update(editingId, { judul: formJudul.trim(), content: formContent });
    else create(formJudul.trim(), formContent);
    closeModal();
  };

  const openFullPage = () => {
    const judul = formJudul.trim() || 'Dokumen tanpa judul';
    let id = editingId;
    if (id) update(id, { judul, content: formContent });
    else id = create(judul, formContent);
    closeModal();
    navigate(`/keuangan/srp/${id}`);
  };

  return (
    <>
      <PageHeader
        title="Dokumen SRP"
        description="Susun, simpan, dan sunting dokumen SRP keuangan"
        actions={
          <Button variant="primary" icon={PiPlus} onClick={openCreate}>
            Buat dokumen
          </Button>
        }
      />

      <PageBody>
        {sorted.length === 0 ? (
          <Panel>
            <EmptyState
              icon={PiFileText}
              title="Belum ada dokumen SRP"
              description="Pakai tombol Buat dokumen di atas. Dokumen tersimpan di sini dan bisa dibuka di editor halaman penuh."
            />
          </Panel>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((doc) => {
              const teks = doc.content ? cuplikan(doc.content) : '';
              return (
                <li key={doc.id} className="group relative flex flex-col rounded-xl border border-line bg-surface p-4 shadow-sm transition-colors hover:border-line-strong/60">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-soft text-ink-2">
                      <PiFileText className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[15px] font-semibold text-ink">
                        <Link to={`/keuangan/srp/${doc.id}`} className="rounded after:absolute after:inset-0 after:rounded-xl hover:text-brand-700">
                          {doc.judul}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-xs text-ink-3">Diubah {timeAgo(doc.updatedAt)}</p>
                    </div>
                  </div>
                  <p className={`mt-3 line-clamp-3 flex-1 text-[13px] leading-relaxed ${teks ? 'text-ink-2' : 'italic text-ink-3'}`}>
                    {teks || 'Belum ada isi.'}
                  </p>
                  <div className="relative z-10 mt-3 flex items-center justify-end gap-0.5 border-t border-line pt-2">
                    <IconButton icon={PiPencilSimple} label={`Ubah cepat ${doc.judul}`} onClick={() => openEdit(doc)} />
                    <IconButton icon={PiArrowSquareOut} label={`Buka ${doc.judul} di halaman penuh`} onClick={() => navigate(`/keuangan/srp/${doc.id}`)} />
                    <IconButton icon={PiTrash} tone="danger" label={`Hapus ${doc.judul}`} onClick={() => setDeleteId(doc.id)} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Ubah dokumen SRP' : 'Buat dokumen SRP'}
        size="xl"
        headerActions={<IconButton icon={PiCornersOut} label="Buka di halaman penuh" onClick={openFullPage} />}
        footer={
          <>
            <Button onClick={closeModal}>Batal</Button>
            <Button variant="primary" onClick={handleSave}>
              {editingId ? 'Simpan perubahan' : 'Simpan dokumen'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Judul dokumen" required error={titleError}>
            <input
              className="control"
              value={formJudul}
              onChange={(e) => {
                setFormJudul(e.target.value);
                setTitleError('');
              }}
              placeholder="Contoh: SRP Proyek Gedung A, September 2026"
            />
          </Field>
          <div>
            <p className="field-label">Isi dokumen</p>
            <SummernoteEditor
              value={formContent}
              onChange={setFormContent}
              placeholder="Tulis rencana pembayaran, rincian biaya, atau catatan SRP di sini"
              height={260}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove(deleteId)}
        title="Hapus dokumen"
        message="Hapus dokumen SRP ini? Seluruh isinya hilang dan tidak bisa dipulihkan."
        confirmLabel="Hapus dokumen"
      />
    </>
  );
}
