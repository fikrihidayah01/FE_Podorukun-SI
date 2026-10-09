import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PiPlus, PiPencilSimple, PiTrash, PiCopy, PiBuildings, PiFileText,
} from 'react-icons/pi';
import { useMasterPtStore, type MasterPt } from '../../store/masterPtStore';
import { useTemplateDokumenStore, type TemplateDokumen, type TipeTransaksi } from '../../store/templateDokumenStore';
import { usePustakaPasalStore } from '../../store/pustakaPasalStore';
import PageHeader, { PageBody } from '../../components/ui/PageHeader';
import TabBar, { TabPanel } from '../../components/ui/TabBar';
import Panel from '../../components/ui/Panel';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button, { IconButton } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Field from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';

const TIPE_OPSI: TipeTransaksi[] = ['Cash', 'KPR', 'In House'];

const TIPE_BADGE: Record<TipeTransaksi, string> = {
  Cash: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  KPR: 'bg-blue-50 text-blue-700 border-blue-200',
  'In House': 'bg-amber-50 text-amber-700 border-amber-200',
};

type ActiveTab = 'master-pt' | 'template';

const TABS = [
  { key: 'master-pt', label: 'Master PT' },
  { key: 'template', label: 'Template Dokumen' },
];

const EMPTY_PT = (): Omit<MasterPt, 'id'> => ({
  namaPt: '',
  namaDirektur: '',
  ttl: '',
  pekerjaan: '',
  alamat: '',
  noKtp: '',
  perumahanId: undefined,
});

export default function MasterPtPage() {
  const { items: pts, add: addPt, update: updatePt, remove: removePt, fetch: fetchPts} = useMasterPtStore();
  const { items: templates, add: addTemplate, update: updateTemplate, duplikat, remove: removeTemplate, fetch: fetchTemplates } = useTemplateDokumenStore();
  const { items: pasals, fetch: fetchPasals } = usePustakaPasalStore();

  useEffect(() => {
    fetchPts();
    fetchTemplates();
    fetchPasals();
  }, [fetchPts, fetchTemplates, fetchPasals]);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: ActiveTab = tabParam === 'template' ? 'template' : 'master-pt';
  const setActiveTab = (t: ActiveTab) => setSearchParams(t === 'master-pt' ? {} : { tab: t }, { replace: true });

  // State modal PT
  const [ptModalOpen, setPtModalOpen] = useState(false);
  const [editingPtId, setEditingPtId] = useState<string | null>(null);
  const [ptForm, setPtForm] = useState(EMPTY_PT());
  const [ptErrors, setPtErrors] = useState<Partial<Record<keyof Omit<MasterPt, 'id' | 'perumahanId'>, string>>>({});
  const [deletePtId, setDeletePtId] = useState<string | null>(null);

  // State modal Template
  const [tmplModalOpen, setTmplModalOpen] = useState(false);
  const [editingTmplId, setEditingTmplId] = useState<string | null>(null);
  const [tmplForm, setTmplForm] = useState<{ ptId: string; tipeTransaksi: TipeTransaksi; polaNomor: string; pasalIds: string[] }>({
    ptId: '', tipeTransaksi: 'Cash', polaNomor: '', pasalIds: [],
  });
  const [deleteTmplId, setDeleteTmplId] = useState<string | null>(null);
  const [tmplFilterPt, setTmplFilterPt] = useState('all');

  // ─── PT handlers ───────────────────────────────────────
  const openAddPt = () => {
    setEditingPtId(null);
    setPtForm(EMPTY_PT());
    setPtErrors({});
    setPtModalOpen(true);
  };

  const openEditPt = (pt: MasterPt) => {
    setEditingPtId(pt.id);
    setPtForm({
      namaPt: pt.namaPt,
      namaDirektur: pt.namaDirektur,
      ttl: pt.ttl,
      pekerjaan: pt.pekerjaan,
      alamat: pt.alamat,
      noKtp: pt.noKtp,
      perumahanId: pt.perumahanId,
    });
    setPtErrors({});
    setPtModalOpen(true);
  };

  const savePt = () => {
    const errs: typeof ptErrors = {};
    if (!ptForm.namaPt.trim()) errs.namaPt = 'Nama PT wajib diisi.';
    if (!ptForm.namaDirektur.trim()) errs.namaDirektur = 'Nama direktur wajib diisi.';
    if (!ptForm.ttl?.trim()) errs.ttl = 'Tempat & tanggal lahir wajib diisi.';
    if (!ptForm.alamat?.trim()) errs.alamat = 'Alamat wajib diisi.';
    if (Object.keys(errs).length > 0) { setPtErrors(errs); return; }

    if (editingPtId) updatePt(editingPtId, ptForm);
    else addPt(ptForm);
    setPtModalOpen(false);
  };

  // ─── Template handlers ──────────────────────────────────
  const openAddTemplate = () => {
    setEditingTmplId(null);
    setTmplForm({ ptId: pts[0]?.id ?? '', tipeTransaksi: 'Cash', polaNomor: '', pasalIds: [] });
    setTmplModalOpen(true);
  };

  const openEditTemplate = (t: TemplateDokumen) => {
    setEditingTmplId(t.id);
    setTmplForm({ ptId: t.ptId, tipeTransaksi: t.tipeTransaksi, polaNomor: t.polaNomor, pasalIds: [...t.pasalIds] });
    setTmplModalOpen(true);
  };

  const saveTemplate = async () => {
    if (!tmplForm.ptId || !tmplForm.polaNomor.trim()) return;
    if (editingTmplId) await updateTemplate(editingTmplId, tmplForm);
    else await addTemplate(tmplForm);
    setTmplModalOpen(false);
  };

  const getPtNama = (id: string) => pts.find((p) => p.id === id)?.namaPt ?? '-';

  const filteredTemplates = tmplFilterPt === 'all'
    ? templates
    : templates.filter((t) => t.ptId === tmplFilterPt);

  const togglePasalInForm = (id: string) => {
    setTmplForm((prev) => ({
      ...prev,
      pasalIds: prev.pasalIds.includes(id)
        ? prev.pasalIds.filter((p) => p !== id)
        : [...prev.pasalIds, id],
    }));
  };

  return (
    <>
      <PageHeader
        title="Master PT dan Template"
        description="Kelola data PT dan template dokumen perjanjian per tipe transaksi"
        tabs={
          <TabBar
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(t) => setActiveTab(t as ActiveTab)}
            idPrefix="masterpt"
            label="Bagian Master PT"
          />
        }
      />

      <PageBody>
        <TabPanel idPrefix="masterpt" activeTab={activeTab}>
          {activeTab === 'master-pt' && (
          <Panel
            title="Daftar PT"
            description="Satu perumahan terikat ke satu PT. Data PT terisi otomatis di dokumen legal."
            actions={<Button variant="primary" icon={PiPlus} onClick={openAddPt}>Tambah PT</Button>}
          >
            {pts.length === 0 ? (
              <EmptyState icon={PiBuildings} title="Belum ada PT" description="Tambah PT untuk mulai membuat template dan dokumen legal." />
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th scope="col">Nama PT</th>
                      <th scope="col">Nama Direktur</th>
                      <th scope="col">Tempat &amp; Tanggal Lahir</th>
                      <th scope="col">Pekerjaan</th>
                      <th scope="col">Alamat</th>
                      <th scope="col"><span className="sr-only">Aksi</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pts.map((pt) => (
                      <tr key={pt.id}>
                        <td className="font-semibold text-ink">{pt.namaPt}</td>
                        <td>{pt.namaDirektur}</td>
                        <td className="text-ink-2">{pt.ttl}</td>
                        <td className="text-ink-2">{pt.pekerjaan}</td>
                        <td className="max-w-[200px] truncate text-ink-2" title={pt.alamat || undefined}>{pt.alamat}</td>
                        <td className="flex items-center gap-1">
                          <IconButton icon={PiPencilSimple} label={`Edit ${pt.namaPt}`} onClick={() => openEditPt(pt)} />
                          <IconButton icon={PiTrash} tone="danger" label={`Hapus ${pt.namaPt}`} onClick={() => setDeletePtId(pt.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        {/* ── Tab: Template Dokumen ── */}
        {activeTab === 'template' && (
          <Panel
            title="Template Dokumen"
            description="Template dibuat per kombinasi PT dan tipe transaksi. Salin template sebagai dasar template baru."
            actions={<Button variant="primary" icon={PiPlus} onClick={openAddTemplate}>Tambah template</Button>}
          >
            <div className="mb-4 flex items-center gap-3">
              <label htmlFor="tmpl-filter-pt" className="field-label shrink-0">Filter PT</label>
              <select
                id="tmpl-filter-pt"
                className="control max-w-xs"
                value={tmplFilterPt}
                onChange={(e) => setTmplFilterPt(e.target.value)}
              >
                <option value="all">Semua PT</option>
                {pts.map((p) => <option key={p.id} value={p.id}>{p.namaPt}</option>)}
              </select>
            </div>

            {filteredTemplates.length === 0 ? (
              <EmptyState icon={PiFileText} title="Belum ada template" description="Tambah template untuk mengatur susunan pasal per tipe transaksi." />
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th scope="col">PT</th>
                      <th scope="col">Tipe transaksi</th>
                      <th scope="col">Pola nomor</th>
                      <th scope="col">Pasal</th>
                      <th scope="col"><span className="sr-only">Aksi</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTemplates.map((t) => (
                      <tr key={t.id}>
                        <td className="max-w-[180px] truncate font-medium text-ink" title={getPtNama(t.ptId)}>{getPtNama(t.ptId)}</td>
                        <td>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${TIPE_BADGE[t.tipeTransaksi]}`}>
                            {t.tipeTransaksi}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-ink-2">{t.polaNomor}</td>
                        <td>
                          <Badge>{t.pasalIds.length} pasal</Badge>
                        </td>
                        <td className="flex items-center gap-1">
                          <IconButton icon={PiPencilSimple} label="Edit template" onClick={() => openEditTemplate(t)} />
                          <IconButton icon={PiCopy} label="Salin template" onClick={() => duplikat(t.id)} />
                          <IconButton icon={PiTrash} tone="danger" label="Hapus template" onClick={() => setDeleteTmplId(t.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}
        </TabPanel>
      </PageBody>

      {/* Modal PT */}
      <Modal
        isOpen={ptModalOpen}
        onClose={() => setPtModalOpen(false)}
        title={editingPtId ? 'Edit data PT' : 'Tambah PT baru'}
        size="lg"
        footer={
          <>
            <Button onClick={() => setPtModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={savePt}>{editingPtId ? 'Simpan perubahan' : 'Simpan PT'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nama PT" required error={ptErrors.namaPt}>
            <input className="control" value={ptForm.namaPt || ''} onChange={(e) => setPtForm((p) => ({ ...p, namaPt: e.target.value }))} placeholder="PT Contoh Sejahtera" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nama Direktur" required error={ptErrors.namaDirektur}>
              <input className="control" value={ptForm.namaDirektur || ''} onChange={(e) => setPtForm((p) => ({ ...p, namaDirektur: e.target.value }))} />
            </Field>
            <Field label="Tempat, Tanggal Lahir" required hint="Contoh: Jakarta, 15 Agustus 1980" error={ptErrors.ttl}>
              <input className="control" value={ptForm.ttl || ''} onChange={(e) => setPtForm((p) => ({ ...p, ttl: e.target.value }))} />
            </Field>
            <Field label="Pekerjaan">
              <input className="control" value={ptForm.pekerjaan || ''} onChange={(e) => setPtForm((p) => ({ ...p, pekerjaan: e.target.value }))} placeholder="Direktur" />
            </Field>
            <Field label="No. KTP">
              <input className="control tabular-nums" value={ptForm.noKtp || ''} onChange={(e) => setPtForm((p) => ({ ...p, noKtp: e.target.value }))} maxLength={16} />
            </Field>
          </div>
          <Field label="Alamat" required error={ptErrors.alamat}>
            <textarea className="control" rows={2} value={ptForm.alamat || ''} onChange={(e) => setPtForm((p) => ({ ...p, alamat: e.target.value }))} />
          </Field>
        </div>
      </Modal>

      {/* Modal Template */}
      <Modal
        isOpen={tmplModalOpen}
        onClose={() => setTmplModalOpen(false)}
        title={editingTmplId ? 'Edit template' : 'Tambah template dokumen'}
        size="lg"
        footer={
          <>
            <Button onClick={() => setTmplModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={saveTemplate}>{editingTmplId ? 'Simpan perubahan' : 'Simpan template'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="PT" required>
              <select className="control" value={tmplForm.ptId} onChange={(e) => setTmplForm((p) => ({ ...p, ptId: e.target.value }))}>
                <option value="">Pilih PT</option>
                {pts.map((pt) => <option key={pt.id} value={pt.id}>{pt.namaPt}</option>)}
              </select>
            </Field>
            <Field label="Tipe transaksi" required>
              <select className="control" value={tmplForm.tipeTransaksi} onChange={(e) => setTmplForm((p) => ({ ...p, tipeTransaksi: e.target.value as TipeTransaksi }))}>
                {TIPE_OPSI.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Pola nomor" hint='Gunakan {PT}, {TAHUN}, {NO} sebagai variabel. Contoh: PRSM/{TAHUN}/KPR/{NO}' required>
            <input className="control font-mono" value={tmplForm.polaNomor} onChange={(e) => setTmplForm((p) => ({ ...p, polaNomor: e.target.value }))} />
          </Field>
          <Field label="Susunan pasal" hint="Centang pasal yang dipakai dalam template ini, sesuai urutan tampil.">
            <div className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-line bg-subtle p-2 space-y-1">
              {pasals.length === 0 ? (
                <p className="py-3 text-center text-sm text-ink-3">Belum ada pasal di Pustaka Pasal.</p>
              ) : (
                pasals.map((pasal) => (
                  <label key={pasal.id} className="flex cursor-pointer items-start gap-2.5 rounded-md p-2 hover:bg-gray-100">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                      checked={tmplForm.pasalIds.includes(pasal.id)}
                      onChange={() => togglePasalInForm(pasal.id)}
                    />
                    <span className="text-sm text-ink">{pasal.judul}</span>
                    {!pasal.aktif && <Badge tone="neutral">Nonaktif</Badge>}
                  </label>
                ))
              )}
            </div>
          </Field>
        </div>
      </Modal>

      {/* Konfirmasi hapus PT */}
      <ConfirmDialog
        isOpen={deletePtId !== null}
        onClose={() => setDeletePtId(null)}
        onConfirm={() => deletePtId && removePt(deletePtId)}
        title="Hapus PT"
        message="Hapus PT ini? Template yang terikat ke PT ini tidak otomatis terhapus."
        confirmLabel="Hapus PT"
      />

      {/* Konfirmasi hapus template */}
      <ConfirmDialog
        isOpen={deleteTmplId !== null}
        onClose={() => setDeleteTmplId(null)}
        onConfirm={() => deleteTmplId && removeTemplate(deleteTmplId)}
        title="Hapus template"
        message="Hapus template ini? Dokumen yang sudah dibuat tidak ikut berubah."
        confirmLabel="Hapus template"
      />
    </>
  );
}
