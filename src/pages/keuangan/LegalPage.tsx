import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiPlus, PiMagnifyingGlass, PiFileText,
} from 'react-icons/pi';
import { useDokumenLegalStore, type DokumenLegal, type StatusDokumen, type DataPembeli } from '../../store/dokumenLegalStore';
import { useMasterPtStore } from '../../store/masterPtStore';
import { useProyekStore } from '../../store/proyekStore';
import { useTemplateDokumenStore, type TipeTransaksi } from '../../store/templateDokumenStore';
import { usePustakaPasalStore } from '../../store/pustakaPasalStore';
import PageHeader, { PageBody } from '../../components/ui/PageHeader';
import Panel from '../../components/ui/Panel';
import Modal from '../../components/ui/Modal';
import DataTable, { type Column } from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Money from '../../components/ui/Money';
import Field from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { formatTanggal } from '../../utils/format';

// Dummy kavling data — akan diganti dengan kavlingStore jika tersedia
const DUMMY_KAVLING = [
  { id: 'kav-001', nomor: 'A-01', luas: 120, perumahanId: '' },
  { id: 'kav-002', nomor: 'A-02', luas: 135, perumahanId: '' },
  { id: 'kav-003', nomor: 'B-05', luas: 90, perumahanId: '' },
  { id: 'kav-004', nomor: 'C-12', luas: 200, perumahanId: '' },
];

const STATUS: Record<StatusDokumen, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  final: { label: 'Final', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  ditandatangani: { label: 'Ditandatangani', cls: 'bg-green-50 text-green-700 border-green-200' },
};

const TIPE: Record<TipeTransaksi, string> = {
  Cash: 'bg-green-50 text-green-700 border-green-200',
  KPR: 'bg-blue-50 text-blue-700 border-blue-200',
  'In House': 'bg-amber-50 text-amber-700 border-amber-200',
};

const EMPTY_PEMBELI = (): DataPembeli => ({
  nama: '', ttl: '', pekerjaan: '', alamat: '', noKtp: '', noHp: '',
});

function StatusBadge({ status }: { status: StatusDokumen }) {
  const s = STATUS[status];
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

function TipeBadge({ tipe }: { tipe: TipeTransaksi }) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${TIPE[tipe]}`}>{tipe}</span>;
}

export default function LegalPage() {
  const { items, add, fetch: fetchDokumen } = useDokumenLegalStore();
  const { items: pts, fetch: fetchPts } = useMasterPtStore();
  const { items: proyeks } = useProyekStore();
  const { items: templates, fetch: fetchTemplates } = useTemplateDokumenStore();
  const { fetch: fetchPasals } = usePustakaPasalStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDokumen();
    fetchPts();
    fetchTemplates();
    fetchPasals();
  }, [fetchDokumen, fetchPts, fetchTemplates, fetchPasals]);

  const [page, setPage] = useState(1);
  const [buatOpen, setBuatOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [search, setSearch] = useState('');
  const [filterPerumahan, setFilterPerumahan] = useState('all');
  const [filterStatus, setFilterStatus] = useState<StatusDokumen | 'all'>('all');
  const [filterTipe, setFilterTipe] = useState<TipeTransaksi | 'all'>('all');

  // Langkah 1 form
  const [formPtId, setFormPtId] = useState('');
  const [formKavlingId, setFormKavlingId] = useState('');
  const [formTipe, setFormTipe] = useState<TipeTransaksi>('Cash');
  const [formPerumahanId, setFormPerumahanId] = useState('');

  // Langkah 2 form (data pembeli + harga)
  const [pembeli, setPembeli] = useState<DataPembeli>(EMPTY_PEMBELI());
  const [hargaAwal, setHargaAwal] = useState('');
  const [bphtb, setBphtb] = useState('');
  const [ajbBbn, setAjbBbn] = useState('');
  const [uangMuka, setUangMuka] = useState('');
  const [tanggalPerjanjian, setTanggalPerjanjian] = useState(new Date().toISOString().split('T')[0]);

  const hargaNett = (Number(hargaAwal) || 0) + (Number(bphtb) || 0) + (Number(ajbBbn) || 0);
  const sisaKpr = hargaNett - (Number(uangMuka) || 0);

  const templateAktif = templates.find((t) => t.ptId === formPtId && t.tipeTransaksi === formTipe);
  const ptAktif = pts.find((p) => p.id === formPtId);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter((d) =>
        (d.noDokumen.toLowerCase().includes(q) || d.pembeli.nama.toLowerCase().includes(q)) &&
        (filterPerumahan === 'all' || d.perumahanId === filterPerumahan) &&
        (filterStatus === 'all' || d.status === filterStatus) &&
        (filterTipe === 'all' || d.tipeTransaksi === filterTipe)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [items, search, filterPerumahan, filterStatus, filterTipe]);

  const openBuat = () => {
    setStep(1);
    setFormPtId(pts[0]?.id ?? '');
    setFormKavlingId(DUMMY_KAVLING[0]?.id ?? '');
    setFormTipe('Cash');
    setFormPerumahanId(proyeks[0]?.id ?? '');
    setPembeli(EMPTY_PEMBELI());
    setHargaAwal('');
    setBphtb('');
    setAjbBbn('');
    setUangMuka('');
    setTanggalPerjanjian(new Date().toISOString().split('T')[0]);
    setBuatOpen(true);
  };

  const handleNext = () => setStep(2);

  const handleSimpan = async (statusFinal: StatusDokumen) => {
    if (!formPtId || !formKavlingId) return;
    const pt = pts.find((p) => p.id === formPtId);
    const ptSingkatan = pt?.namaPt.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 4) ?? 'DOK';

    const pustakaStore = usePustakaPasalStore.getState();
    const pasalDokumen = (templateAktif?.pasalIds ?? []).map((pasalId) => {
      const p = pustakaStore.items.find((item) => item.id === pasalId);
      if (!p) return null;
      return {
        id: crypto.randomUUID(),
        pustakaId: p.id,
        judul: p.judul,
        isi: p.isi,
        fields: p.fields.map((f) => ({ ...f, nilai: '' })),
      };
    }).filter(Boolean) as any;

    const id = await add({
      ptId: formPtId,
      kavlingId: formKavlingId,
      perumahanId: formPerumahanId,
      pembeli,
      tipeTransaksi: formTipe,
      hargaAwal: Number(hargaAwal) || 0,
      bphtb: Number(bphtb) || 0,
      ajbBbn: Number(ajbBbn) || 0,
      uangMuka: Number(uangMuka) || 0,
      tanggalPerjanjian,
      status: statusFinal,
      pasalDokumen,
      ptSingkatan,
    });

    setBuatOpen(false);
    if (id) {
      navigate(`/keuangan/legal/${id}`);
    }
  };


  const columns: Column<DokumenLegal>[] = [
    { key: 'noDokumen', label: 'No. dokumen', render: (r) => <span className="font-mono text-sm font-semibold text-ink">{r.noDokumen}</span> },
    { key: 'pt', label: 'PT', render: (r) => <span className="text-sm text-ink-2">{pts.find((p) => p.id === r.ptId)?.namaPt ?? '-'}</span> },
    { key: 'kavling', label: 'Kavling', render: (r) => <span className="tabular-nums">{DUMMY_KAVLING.find((k) => k.id === r.kavlingId)?.nomor ?? r.kavlingId}</span> },
    {
      key: 'pembeli',
      label: 'Pembeli',
      render: (r) => (
        <>
          <span className="block font-medium text-ink">{r.pembeli.nama || '-'}</span>
          {r.tanggalPerjanjian && <span className="mt-0.5 block text-xs text-ink-3">{formatTanggal(r.tanggalPerjanjian)}</span>}
        </>
      ),
    },
    { key: 'tipe', label: 'Tipe', render: (r) => <TipeBadge tipe={r.tipeTransaksi} /> },
    {
      key: 'hargaNett',
      label: 'Harga nett',
      numeric: true,
      render: (r) => <Money value={r.hargaAwal + r.bphtb + r.ajbBbn} className="font-semibold text-ink" />,
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  const hasFilter = search || filterPerumahan !== 'all' || filterStatus !== 'all' || filterTipe !== 'all';

  return (
    <>
      <PageHeader
        title="Dokumen Legal"
        description="Surat perjanjian jual beli, KPR, dan in house per kavling"
        actions={<Button variant="primary" icon={PiPlus} onClick={openBuat}>Buat dokumen</Button>}
      />

      <PageBody>
        <Panel title="Daftar dokumen" description={`${items.length} dokumen tercatat`} flush>
          <div className="grid grid-cols-1 gap-3 border-b border-line px-4 py-3.5 sm:grid-cols-2 sm:px-5 xl:grid-cols-[minmax(0,1.5fr)_1fr_1fr_1fr]">
            <div>
              <label htmlFor="legal-cari" className="field-label">Cari</label>
              <div className="relative">
                <PiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
                <input
                  id="legal-cari"
                  type="search"
                  className="control pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="No. dokumen atau nama pembeli"
                />
              </div>
            </div>
            <div>
              <label htmlFor="legal-perumahan" className="field-label">Perumahan</label>
              <select id="legal-perumahan" className="control" value={filterPerumahan} onChange={(e) => { setFilterPerumahan(e.target.value); setPage(1); }}>
                <option value="all">Semua perumahan</option>
                {proyeks.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="legal-tipe" className="field-label">Tipe transaksi</label>
              <select id="legal-tipe" className="control" value={filterTipe} onChange={(e) => { setFilterTipe(e.target.value as TipeTransaksi | 'all'); setPage(1); }}>
                <option value="all">Semua tipe</option>
                <option value="Cash">Cash</option>
                <option value="KPR">KPR</option>
                <option value="In House">In House</option>
              </select>
            </div>
            <div>
              <label htmlFor="legal-status" className="field-label">Status</label>
              <select id="legal-status" className="control" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as StatusDokumen | 'all'); setPage(1); }}>
                <option value="all">Semua status</option>
                <option value="draft">Draft</option>
                <option value="final">Final</option>
                <option value="ditandatangani">Ditandatangani</option>
              </select>
            </div>
          </div>

          <DataTable
            label="Daftar dokumen legal"
            columns={columns}
            data={filteredItems}
            keyExtractor={(r) => r.id}
            page={page}
            onPageChange={setPage}
            onRowClick={(r) => navigate(`/keuangan/legal/${r.id}`)}
            rowActionLabel={(r) => `Buka dokumen ${r.noDokumen}`}
            empty={
              <EmptyState
                compact
                icon={PiFileText}
                title={hasFilter ? 'Tidak ada dokumen yang cocok' : 'Belum ada dokumen legal'}
                description={hasFilter ? 'Ubah kata kunci atau filter.' : 'Pakai tombol Buat dokumen untuk memulai.'}
              />
            }
          />
        </Panel>
      </PageBody>

      {/* Modal buat dokumen — 2 langkah */}
      <Modal
        isOpen={buatOpen}
        onClose={() => setBuatOpen(false)}
        title={step === 1 ? 'Buat dokumen — Langkah 1 dari 2' : 'Buat dokumen — Langkah 2 dari 2'}
        description={step === 1 ? 'Pilih kavling dan tipe transaksi' : 'Isi data pembeli dan harga'}
        size="lg"
        footer={
          step === 1 ? (
            <>
              <Button onClick={() => setBuatOpen(false)}>Batal</Button>
              <Button variant="primary" onClick={handleNext} disabled={!formPtId || !formKavlingId}>Lanjut</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setStep(1)}>Kembali</Button>
              <Button onClick={() => handleSimpan('draft')}>Simpan draft</Button>
              <Button variant="primary" onClick={() => handleSimpan('final')}>Simpan sebagai Final</Button>
            </>
          )
        }
      >
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="PT" required>
                <select className="control" value={formPtId} onChange={(e) => setFormPtId(e.target.value)}>
                  <option value="">Pilih PT</option>
                  {pts.map((pt) => <option key={pt.id} value={pt.id}>{pt.namaPt}</option>)}
                </select>
              </Field>
              <Field label="Perumahan / Proyek" required>
                <select className="control" value={formPerumahanId} onChange={(e) => setFormPerumahanId(e.target.value)}>
                  <option value="">Pilih perumahan</option>
                  {proyeks.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </Field>
              <Field label="Kavling" required>
                <select className="control" value={formKavlingId} onChange={(e) => setFormKavlingId(e.target.value)}>
                  <option value="">Pilih kavling</option>
                  {DUMMY_KAVLING.map((k) => <option key={k.id} value={k.id}>{k.nomor} ({k.luas} m²)</option>)}
                </select>
              </Field>
              <Field label="Tipe transaksi" required>
                <select className="control" value={formTipe} onChange={(e) => setFormTipe(e.target.value as TipeTransaksi)}>
                  <option value="Cash">Cash</option>
                  <option value="KPR">KPR</option>
                  <option value="In House">In House</option>
                </select>
              </Field>
            </div>

            {formPtId && formTipe && (
              <div className={`rounded-lg border p-3 text-sm ${templateAktif ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                {templateAktif
                  ? `Template ditemukan: ${templateAktif.polaNomor} (${templateAktif.pasalIds.length} pasal)`
                  : `Belum ada template untuk ${ptAktif?.namaPt ?? 'PT ini'} tipe ${formTipe}. Buat dulu di Master PT.`
                }
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-ink">Data Pembeli</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nama lengkap" required>
                <input className="control" value={pembeli.nama} onChange={(e) => setPembeli((p) => ({ ...p, nama: e.target.value }))} />
              </Field>
              <Field label="Tempat, Tanggal Lahir">
                <input className="control" value={pembeli.ttl} onChange={(e) => setPembeli((p) => ({ ...p, ttl: e.target.value }))} placeholder="Jakarta, 12 Maret 1990" />
              </Field>
              <Field label="Pekerjaan">
                <input className="control" value={pembeli.pekerjaan} onChange={(e) => setPembeli((p) => ({ ...p, pekerjaan: e.target.value }))} />
              </Field>
              <Field label="No. KTP">
                <input className="control tabular-nums" value={pembeli.noKtp} onChange={(e) => setPembeli((p) => ({ ...p, noKtp: e.target.value }))} maxLength={16} />
              </Field>
              <Field label="No. HP">
                <input className="control tabular-nums" value={pembeli.noHp} onChange={(e) => setPembeli((p) => ({ ...p, noHp: e.target.value }))} />
              </Field>
              <Field label="Tanggal perjanjian" required>
                <input type="date" className="control" value={tanggalPerjanjian} onChange={(e) => setTanggalPerjanjian(e.target.value)} />
              </Field>
            </div>
            <Field label="Alamat" className="sm:col-span-2">
              <textarea className="control" rows={2} value={pembeli.alamat} onChange={(e) => setPembeli((p) => ({ ...p, alamat: e.target.value }))} />
            </Field>

            <p className="text-sm font-semibold text-ink">Harga</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Harga awal" required>
                <input type="number" inputMode="numeric" className="control tabular-nums" value={hargaAwal} onChange={(e) => setHargaAwal(e.target.value)} placeholder="0" />
              </Field>
              <Field label="BPHTB">
                <input type="number" inputMode="numeric" className="control tabular-nums" value={bphtb} onChange={(e) => setBphtb(e.target.value)} placeholder="0" />
              </Field>
              <Field label="AJB + BBN">
                <input type="number" inputMode="numeric" className="control tabular-nums" value={ajbBbn} onChange={(e) => setAjbBbn(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Uang muka" hint={formTipe === 'KPR' ? `Sisa KPR: Rp ${sisaKpr.toLocaleString('id-ID')}` : undefined}>
                <input type="number" inputMode="numeric" className="control tabular-nums" value={uangMuka} onChange={(e) => setUangMuka(e.target.value)} placeholder="0" />
              </Field>
            </div>

            {hargaNett > 0 && (
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
                <p className="text-xs font-semibold text-brand-700">Harga nett (otomatis)</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-brand-800">
                  Rp {hargaNett.toLocaleString('id-ID')}
                </p>
                <p className="mt-0.5 text-xs text-brand-600">= Harga awal + BPHTB + AJB/BBN</p>
              </div>
            )}

          </div>
        )}
      </Modal>
    </>
  );
}
