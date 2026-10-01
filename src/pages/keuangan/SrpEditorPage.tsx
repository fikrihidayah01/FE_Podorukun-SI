import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PiFloppyDisk, PiCheckCircle, PiFileText } from 'react-icons/pi';
import { useSrpStore } from '../../store/srpStore';
import SummernoteEditor from '../../components/ui/SummernoteEditor';
import PageHeader, { PageBody } from '../../components/ui/PageHeader';
import Panel from '../../components/ui/Panel';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function SrpEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { docs, update } = useSrpStore();
  const doc = docs.find((d) => d.id === id);

  const [judul, setJudul] = useState(doc?.judul ?? '');
  const [content, setContent] = useState(doc?.content ?? '');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = !!doc && (judul !== doc.judul || content !== doc.content);

  const handleSave = useCallback(() => {
    if (!id) return;
    setIsSaving(true);
    update(id, { judul, content });
    setSavedAt(new Date());
    setTimeout(() => setIsSaving(false), 300);
  }, [id, judul, content, update]);

  // Simpan otomatis 2 detik setelah berhenti mengetik
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(handleSave, 2000);
    return () => clearTimeout(timer);
  }, [isDirty, handleSave]);

  // Perubahan yang belum sempat tersimpan otomatis ikut disimpan saat meninggalkan halaman
  const latest = useRef({ judul, content, isDirty });
  useEffect(() => {
    latest.current = { judul, content, isDirty };
  });
  useEffect(
    () => () => {
      if (id && latest.current.isDirty) update(id, { judul: latest.current.judul, content: latest.current.content });
    },
    [id, update],
  );

  const back = { to: '/keuangan/srp', label: 'Dokumen SRP' };

  if (!doc) {
    return (
      <>
        <PageHeader title="Dokumen SRP" back={back} />
        <PageBody>
          <Panel>
            <EmptyState
              icon={PiFileText}
              title="Dokumen tidak ditemukan"
              description="Dokumen mungkin sudah dihapus. Kembali ke daftar untuk membuka dokumen lain."
              action={<Button onClick={() => navigate('/keuangan/srp')}>Ke daftar dokumen</Button>}
            />
          </Panel>
        </PageBody>
      </>
    );
  }

  const status = isSaving ? (
    <Badge>Menyimpan</Badge>
  ) : isDirty ? (
    <Badge tone="warning">Belum disimpan</Badge>
  ) : savedAt ? (
    <Badge tone="positive">
      <PiCheckCircle aria-hidden />
      Tersimpan {savedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
    </Badge>
  ) : null;

  return (
    <>
      <PageHeader
        back={back}
        title={
          <>
            <label htmlFor="srp-judul" className="sr-only">Judul dokumen</label>
            <input
              id="srp-judul"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul dokumen SRP"
              className="-mx-1.5 w-full min-w-0 rounded-md bg-transparent px-1.5 py-0.5 outline-none hover:bg-subtle focus-visible:bg-subtle focus-visible:ring-2 focus-visible:ring-brand-600 sm:min-w-[28rem]"
            />
          </>
        }
        status={<span aria-live="polite">{status}</span>}
        actions={
          <>
            {/* TODO: aktifkan setelah endpoint ekspor dokumen tersedia */}
            <Button disabled title="Ekspor PDF dan Word segera hadir">
              Ekspor (segera hadir)
            </Button>
            <Button variant="primary" icon={PiFloppyDisk} loading={isSaving} onClick={handleSave}>
              Simpan
            </Button>
          </>
        }
      />

      <PageBody className="flex flex-1 flex-col">
        <div className="rounded-xl border border-line bg-surface p-2 shadow-sm sm:p-3">
          <SummernoteEditor value={content} onChange={setContent} placeholder="Tulis uraian pengajuan atau isi dokumen SRP" height={520} />
        </div>
      </PageBody>
    </>
  );
}
