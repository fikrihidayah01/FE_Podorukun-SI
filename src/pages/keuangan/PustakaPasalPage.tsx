import { useState } from 'react';
import { PiPlus, PiPencilSimple, PiTrash, PiBookOpen } from 'react-icons/pi';
import { usePustakaPasalStore, type Pasal, type PasalField, type BerlakuPasal } from '../../store/pustakaPasalStore';
import { useDokumenLegalStore } from '../../store/dokumenLegalStore';
import PageHeader, { PageBody } from '../../components/ui/PageHeader';
import Panel from '../../components/ui/Panel';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button, { IconButton } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Field from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';

const BERLAKU_LABEL: Record<BerlakuPasal, string> = {
  semua: 'Semua transaksi',
  cash: 'Cash',
  kpr: 'KPR',
  in_house: 'In House',
};

const BERLAKU_TONE: Record<BerlakuPasal, string> = {
  semua: 'bg-gray-100 text-gray-700 border-gray-200',
  cash: 'bg-green-50 text-green-700 border-green-200',
  kpr: 'bg-blue-50 text-blue-700 border-blue-200',
  in_house: 'bg-amber-50 text-amber-700 border-amber-200',
};

const EMPTY_FIELD = (): PasalField => ({
  id: crypto.randomUUID(),
  key: '',
  label: '',
  tipe: 'teks',
});

const EMPTY_PASAL = (): Omit<Pasal, 'id' | 'createdAt'> => ({
  judul: '',
  isi: '',
  berlaku: 'semua',
  fields: [],
  aktif: true,
});

export default function PustakaPasalPage() {
  const { items, add, update, nonaktifkan, aktifkan, remove } = usePustakaPasalStore();
  const { getDokumenByPasalPustaka } = useDokumenLegalStore();

  const [filterBerlaku, setFilterBerlaku] = useState<BerlakuPasal | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'aktif' | 'nonaktif'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PASAL());
  const [formErrors, setFormErrors] = useState<{ judul?: string; isi?: string }>({});

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<'nonaktifkan' | 'hapus'>('nonaktifkan');

  const filtered = items.filter((p) =>
    (filterBerlaku === 'all' || p.berlaku === filterBerlaku) &&
    (filterStatus === 'all' || (filterStatus === 'aktif' ? p.aktif : !p.aktif))
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_PASAL());
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (pasal: Pasal) => {
    setEditingId(pasal.id);
    setForm({
      judul: pasal.judul,
      isi: pasal.isi,
      berlaku: pasal.berlaku,
      fields: pasal.fields.map((f) => ({ ...f })),
      aktif: pasal.aktif,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const saveForm = () => {
    const errs: typeof formErrors = {};
    if (!form.judul.trim()) errs.judul = 'Judul pasal wajib diisi.';
    if (!form.isi.trim()) errs.isi = 'Isi pasal wajib diisi.';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    if (editingId) update(editingId, form);
    else add(form);
    setModalOpen(false);
  };

  const addField = () => setForm((p) => ({ ...p, fields: [...p.fields, EMPTY_FIELD()] }));

  const updateField = (id: string, key: keyof PasalField, value: string) => {
    setForm((p) => ({
      ...p,
      fields: p.fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)),
    }));
  };

  const removeField = (id: string) => {
    setForm((p) => ({ ...p, fields: p.fields.filter((f) => f.id !== id) }));
  };

  const getJumlahDipakai = (id: string) => getDokumenByPasalPustaka(id).length;

  const handleNonaktifkan = (id: string) => {
    setConfirmId(id);
    setConfirmMode('nonaktifkan');
  };

  const confirmItem = items.find((p) => p.id === confirmId);
  const dipakai = confirmId ? getJumlahDipakai(confirmId) : 0;

  return (
    <>
      <PageHeader
        title="Pustaka Pasal"
        description="Pasal disimpan sebagai blok terpisah. Perubahan pasal tidak mempengaruhi dokumen yang sudah dibuat."
        actions={<Button variant="primary" icon={PiPlus} onClick={openAdd}>Tambah pasal</Button>}
      />

      <PageBody>
        <Panel
          title="Daftar pasal"
          description={`${items.length} pasal tersimpan`}
          flush
        >
          <div className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <div>
              <label htmlFor="pp-berlaku" className="field-label">Berlaku untuk</label>
              <select
                id="pp-berlaku"
                className="control"
                value={filterBerlaku}
                onChange={(e) => setFilterBerlaku(e.target.value as BerlakuPasal | 'all')}
              >
                <option value="all">Semua</option>
                {(Object.keys(BERLAKU_LABEL) as BerlakuPasal[]).map((k) => (
                  <option key={k} value={k}>{BERLAKU_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pp-status" className="field-label">Status</label>
              <select
                id="pp-status"
                className="control"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              >
                <option value="all">Semua status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={PiBookOpen} title="Tidak ada pasal" description="Tambah pasal baru atau ubah filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Judul pasal</th>
                    <th scope="col">Berlaku</th>
                    <th scope="col">Fields</th>
                    <th scope="col">Dipakai</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((pasal) => {
                    const jumlah = getJumlahDipakai(pasal.id);
                    return (
                      <tr key={pasal.id} className={!pasal.aktif ? 'opacity-60' : ''}>
                        <td className="font-medium text-ink">{pasal.judul}</td>
                        <td>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${BERLAKU_TONE[pasal.berlaku]}`}>
                            {BERLAKU_LABEL[pasal.berlaku]}
                          </span>
                        </td>
                        <td>
                          <Badge>{pasal.fields.length} field</Badge>
                        </td>
                        <td>
                          <span className="tabular-nums text-sm text-ink-2">{jumlah} dokumen</span>
                        </td>
                        <td>
                          {pasal.aktif
                            ? <Badge tone="positive">Aktif</Badge>
                            : <Badge tone="neutral">Nonaktif</Badge>
                          }
                        </td>
                        <td className="flex items-center gap-1">
                          <IconButton icon={PiPencilSimple} label={`Edit ${pasal.judul}`} onClick={() => openEdit(pasal)} />
                          {pasal.aktif ? (
                            <IconButton
                              icon={PiTrash}
                              tone="danger"
                              label={`Nonaktifkan ${pasal.judul}`}
                              onClick={() => handleNonaktifkan(pasal.id)}
                            />
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => aktifkan(pasal.id)}>
                              Aktifkan
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </PageBody>

      {/* Modal add/edit pasal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit pasal' : 'Tambah pasal baru'}
        size="xl"
        footer={
          <>
            <Button onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={saveForm}>{editingId ? 'Simpan perubahan' : 'Simpan pasal'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
            <Field label="Judul pasal" required error={formErrors.judul}>
              <input
                className="control"
                value={form.judul}
                onChange={(e) => setForm((p) => ({ ...p, judul: e.target.value }))}
                placeholder="Contoh: Pasal 1 — Identitas Para Pihak"
              />
            </Field>
            <Field label="Berlaku untuk">
              <select
                className="control"
                value={form.berlaku}
                onChange={(e) => setForm((p) => ({ ...p, berlaku: e.target.value as BerlakuPasal }))}
              >
                {(Object.keys(BERLAKU_LABEL) as BerlakuPasal[]).map((k) => (
                  <option key={k} value={k}>{BERLAKU_LABEL[k]}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Isi pasal"
            required
            hint="Gunakan {nama_field} sebagai placeholder. Contoh: Harga disepakati Rp {harga_jual}."
            error={formErrors.isi}
          >
            <textarea
              className="control"
              rows={5}
              value={form.isi}
              onChange={(e) => setForm((p) => ({ ...p, isi: e.target.value }))}
              placeholder="Tulis isi pasal di sini. Nilai yang berubah-ubah ditulis sebagai {nama_field}."
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="field-label mb-0">Fields dinamis</p>
              <Button size="sm" variant="ghost" icon={PiPlus} onClick={addField}>Tambah field</Button>
            </div>
            {form.fields.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-ink-3">
                Belum ada field. Tambah field untuk nilai yang berbeda di setiap dokumen.
              </p>
            ) : (
              <div className="space-y-2">
                {form.fields.map((field, i) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_120px_auto] items-end gap-2">
                    <Field label={i === 0 ? 'Key (variabel)' : ''}>
                      <input
                        className="control control-sm font-mono"
                        value={field.key}
                        onChange={(e) => updateField(field.id, 'key', e.target.value.replace(/\s/g, '_'))}
                        placeholder="harga_jual"
                      />
                    </Field>
                    <Field label={i === 0 ? 'Label tampil' : ''}>
                      <input
                        className="control control-sm"
                        value={field.label}
                        onChange={(e) => updateField(field.id, 'label', e.target.value)}
                        placeholder="Harga Jual"
                      />
                    </Field>
                    <Field label={i === 0 ? 'Tipe' : ''}>
                      <select
                        className="control control-sm"
                        value={field.tipe}
                        onChange={(e) => updateField(field.id, 'tipe', e.target.value)}
                      >
                        <option value="teks">Teks</option>
                        <option value="angka">Angka</option>
                        <option value="tanggal">Tanggal</option>
                      </select>
                    </Field>
                    <div className={i === 0 ? 'mt-6' : ''}>
                      <IconButton icon={PiTrash} tone="danger" label={`Hapus field ${field.label || field.key}`} onClick={() => removeField(field.id)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Konfirmasi nonaktifkan/hapus */}
      <ConfirmDialog
        isOpen={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (!confirmId) return;
          if (confirmMode === 'nonaktifkan') nonaktifkan(confirmId);
          else remove(confirmId);
          setConfirmId(null);
        }}
        title={confirmMode === 'nonaktifkan' ? 'Nonaktifkan pasal' : 'Hapus pasal'}
        message={
          confirmMode === 'nonaktifkan'
            ? `Nonaktifkan "${confirmItem?.judul}"? Pasal tidak akan muncul di pilihan template baru. ${dipakai > 0 ? `Dipakai di ${dipakai} dokumen — dokumen yang sudah dibuat tidak berubah.` : ''}`
            : `Hapus "${confirmItem?.judul}" secara permanen? ${dipakai > 0 ? `Peringatan: pasal ini dipakai di ${dipakai} dokumen.` : ''}`
        }
        confirmLabel={confirmMode === 'nonaktifkan' ? 'Nonaktifkan' : 'Hapus pasal'}
      />
    </>
  );
}
