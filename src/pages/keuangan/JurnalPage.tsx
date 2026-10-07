import { useRef, useMemo, useState } from 'react';
import {
  PiPlus, PiMagnifyingGlass, PiTrash, PiLockSimpleOpen, PiNotebook,
  PiPaperclip, PiFilePdf, PiImage, PiX, PiDownloadSimple, PiArrowSquareOut,
} from 'react-icons/pi';
import { useJurnalStore, type Jurnal, type JurnalRow, type JurnalStatus, type Lampiran } from '../../store/jurnalStore';
import { useCoaStore } from '../../store/coaStore';
import { useProyekStore } from '../../store/proyekStore';
import PageHeader, { PageBody } from '../../components/ui/PageHeader';
import Panel from '../../components/ui/Panel';
import Modal from '../../components/ui/Modal';
import DataTable, { type Column } from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button, { IconButton } from '../../components/ui/Button';
import Badge, { type Tone } from '../../components/ui/Badge';
import Money from '../../components/ui/Money';
import Notice from '../../components/ui/Notice';
import Field from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { bulanIni, formatBulan, formatTanggal } from '../../utils/format';

const DUMMY_KODE_PEMBANTU = [
  { id: 'LH-0008', nama: 'Pak Warsito (pemilik lahan)', kategori: 'lahan', proyek: 'Atlantis Hills' },
  { id: 'BK-0001', nama: 'Bank Mandiri', kategori: 'bank', proyek: 'Umum' },
  { id: 'KT-0012', nama: 'PT Bangun Jaya', kategori: 'kontraktor', proyek: 'Atlantis Icon' },
];

const STATUS: Record<JurnalStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'warning' },
  diposting: { label: 'Diposting', tone: 'positive' },
  dikoreksi: { label: 'Dikoreksi', tone: 'danger' },
};

const SUMBER_LABEL: Record<string, string> = {
  manual: 'Manual',
  pinjaman: 'Pinjaman',
  kontraktor: 'Kontraktor',
  mirror: 'Mirror',
};

const MAKS_UKURAN_MB = 10;

const EMPTY_ROW = (): JurnalRow => ({ id: crypto.randomUUID(), akunId: '', kodePembantuId: '', keterangan: '', debit: 0, kredit: 0 });

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status as JurnalStatus];
  return <Badge tone={s?.tone ?? 'neutral'}>{s?.label ?? status}</Badge>;
}

function formatUkuran(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function JurnalPage() {
  const { items, counter, add, remove } = useJurnalStore();
  const { items: akuns } = useCoaStore();
  const { items: proyeks } = useProyekStore();

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [detailJurnal, setDetailJurnal] = useState<Jurnal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Jurnal | null>(null);

  const [filterProyek, setFilterProyek] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSumber, setFilterSumber] = useState('all');
  const [filterLampiran, setFilterLampiran] = useState('all');
  const [search, setSearch] = useState('');

  const [tanggal, setTanggal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [formProyekId, setFormProyekId] = useState('');
  const [rows, setRows] = useState<JurnalRow[]>([EMPTY_ROW(), EMPTY_ROW()]);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [lampiranForm, setLampiranForm] = useState<Lampiran[]>([]);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const nomorBerikutnya = `JU-${String(counter + 1).padStart(4, '0')}`;
  const totalDebit = rows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalKredit = rows.reduce((s, r) => s + (Number(r.kredit) || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalKredit;

  const getAkun = (id: string) => akuns.find((a) => a.id === id);
  const leafAkuns = akuns.filter((a) => a.status === 'aktif' && !akuns.some((c) => c.akunIndukId === a.id));
  const hasEmptyWajibKodePembantu = rows.some((r) => getAkun(r.akunId)?.wajibKodePembantu && !r.kodePembantuId);

  // Cek apakah ada akun kas/bank di baris
  const hasKasBank = rows.some((r) => r.akunId && getAkun(r.akunId)?.isKasBank === true);
  const wajibLampiran = hasKasBank && lampiranForm.length === 0;

  const siapPosting = isBalanced && !hasEmptyWajibKodePembantu && !wajibLampiran;

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter(
        (item) =>
          (item.nomorJurnal.toLowerCase().includes(q) || item.keterangan.toLowerCase().includes(q)) &&
          (filterProyek === 'all' || item.proyekId === filterProyek) &&
          (filterStatus === 'all' || item.status === filterStatus) &&
          (filterSumber === 'all' || item.sumber === filterSumber) &&
          (filterLampiran === 'all' ||
            (filterLampiran === 'ada' && (item.lampiran?.length ?? 0) > 0) ||
            (filterLampiran === 'tidak_ada' && (item.lampiran?.length ?? 0) === 0)),
      )
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [items, search, filterProyek, filterStatus, filterSumber, filterLampiran]);

  const getProyekName = (id?: string) => (id ? (proyeks.find((p) => p.id === id)?.nama ?? 'Proyek tidak dikenal') : '-');
  const getAkunLabel = (id: string) => {
    const a = getAkun(id);
    return a ? `${a.kodeAkun} - ${a.namaAkun}` : '-';
  };

  const openForm = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    setKeterangan('');
    setFormProyekId('');
    setRows([EMPTY_ROW(), EMPTY_ROW()]);
    setFormErrors([]);
    setLampiranForm([]);
    setUploadError('');
    setFormOpen(true);
  };

  const updateRow = (id: string, field: keyof JurnalRow, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, [field]: value };
        if (field === 'debit' && Number(value) > 0) next.kredit = 0;
        if (field === 'kredit' && Number(value) > 0) next.debit = 0;
        return next;
      }),
    );
  };

  const handleFileInput = (files: FileList | null) => {
    if (!files) return;
    setUploadError('');
    const accepted: Lampiran[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const isPdf = file.type === 'application/pdf';
      const isGambar = file.type.startsWith('image/');
      if (!isPdf && !isGambar) {
        errors.push(`${file.name}: format tidak didukung (gunakan PDF atau gambar).`);
        return;
      }
      if (file.size > MAKS_UKURAN_MB * 1024 * 1024) {
        errors.push(`${file.name}: ukuran melebihi ${MAKS_UKURAN_MB} MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setLampiranForm((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            nama: file.name,
            dataUrl,
            tipe: isPdf ? 'pdf' : 'gambar',
            ukuranBytes: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
      accepted.push({} as Lampiran); // placeholder untuk penghitung
    });

    if (errors.length > 0) setUploadError(errors.join(' '));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hapusLampiranForm = (id: string) => {
    setLampiranForm((prev) => prev.filter((l) => l.id !== id));
  };

  const validate = (posting: boolean) => {
    const errs: string[] = [];
    if (!tanggal) errs.push('Tanggal jurnal wajib diisi.');
    if (!formProyekId) errs.push('Pilih proyek jurnal.');
    if (!keterangan.trim()) errs.push('Keterangan jurnal wajib diisi.');
    if (rows.some((r) => !r.akunId)) errs.push('Setiap baris harus memilih akun.');
    if (posting) {
      if (totalDebit === 0) errs.push('Total debit tidak boleh nol untuk diposting.');
      else if (!isBalanced) errs.push('Total debit harus sama dengan total kredit untuk diposting.');
      if (hasEmptyWajibKodePembantu) errs.push('Ada baris dengan akun yang mewajibkan kode pembantu, tetapi kodenya masih kosong.');
      if (wajibLampiran) errs.push('Akun kas/bank terlibat. Lampiran nota wajib diunggah sebelum posting.');
    }
    setFormErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = (status: 'draft' | 'diposting') => {
    if (!validate(status === 'diposting')) return;
    add({
      tanggal,
      keterangan: keterangan.trim(),
      proyekId: formProyekId || undefined,
      sumber: 'manual',
      status,
      rows: rows.map((r) => ({ ...r, debit: Number(r.debit), kredit: Number(r.kredit) })),
      lampiran: lampiranForm,
    });
    setFormOpen(false);
    setPage(1);
  };

  const impactRow = rows.find((r) => r.akunId && r.kodePembantuId && r.debit + r.kredit > 0);
  const impactKp = impactRow && DUMMY_KODE_PEMBANTU.find((k) => k.id === impactRow.kodePembantuId);
  const impactText = (() => {
    if (!impactRow || !impactKp) return null;
    const isAktiva = getAkun(impactRow.akunId)?.kategori === 'aktiva';
    const berkurang = (isAktiva && impactRow.kredit > 0) || (!isAktiva && impactRow.debit > 0);
    return { kp: impactKp, berkurang, nominal: impactRow.debit + impactRow.kredit };
  })();

  const columns: Column<Jurnal>[] = [
    { key: 'tanggal', label: 'Tanggal', className: 'whitespace-nowrap tabular-nums', render: (r) => formatTanggal(r.tanggal) },
    { key: 'nomorJurnal', label: 'No. bukti', render: (r) => <span className="font-semibold tabular-nums text-ink">{r.nomorJurnal}</span> },
    {
      key: 'keterangan',
      label: 'Uraian',
      render: (r) => (
        <>
          <span className="block font-medium text-ink">{r.keterangan}</span>
          {r.proyekId && <span className="mt-0.5 block text-xs text-ink-3">{getProyekName(r.proyekId)}</span>}
        </>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      numeric: true,
      render: (r) => <Money value={r.rows.reduce((s, row) => s + row.debit, 0)} className="font-semibold text-ink" />,
    },
    { key: 'sumber', label: 'Sumber', render: (r) => <Badge>{SUMBER_LABEL[r.sumber] ?? r.sumber}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'lampiran',
      label: '',
      className: 'w-8 text-center',
      render: (r) =>
        (r.lampiran?.length ?? 0) > 0 ? (
          <PiPaperclip
            className="mx-auto h-4 w-4 text-ink-3"
            aria-label={`${r.lampiran.length} lampiran`}
            title={`${r.lampiran.length} lampiran`}
          />
        ) : null,
    },
  ];

  const hasFilter = search || filterProyek !== 'all' || filterStatus !== 'all' || filterSumber !== 'all' || filterLampiran !== 'all';

  return (
    <>
      <PageHeader
        title="Jurnal umum"
        description={`Periode ${formatBulan(bulanIni())}`}
        status={
          <Badge tone="positive">
            <PiLockSimpleOpen aria-hidden />
            Periode terbuka
          </Badge>
        }
        actions={
          <Button variant="primary" icon={PiPlus} onClick={openForm}>
            Buat jurnal
          </Button>
        }
      />

      <PageBody>
        <Panel title="Daftar jurnal" description={`${items.length} jurnal tercatat. Klik baris untuk melihat rinciannya.`} flush>
          <div className="grid grid-cols-1 gap-3 border-b border-line px-4 py-3.5 sm:grid-cols-2 sm:px-5 xl:grid-cols-[minmax(0,1.5fr)_1fr_1fr_1fr_1fr]">
            <div>
              <label htmlFor="j-cari" className="field-label">Cari</label>
              <div className="relative">
                <PiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
                <input
                  id="j-cari"
                  type="search"
                  className="control pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="No. bukti atau uraian"
                />
              </div>
            </div>
            <div>
              <label htmlFor="j-proyek" className="field-label">Proyek</label>
              <select id="j-proyek" className="control" value={filterProyek} onChange={(e) => { setFilterProyek(e.target.value); setPage(1); }}>
                <option value="all">Semua proyek</option>
                {proyeks.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="j-status" className="field-label">Status</label>
              <select id="j-status" className="control" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                <option value="all">Semua status</option>
                {(Object.keys(STATUS) as JurnalStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="j-sumber" className="field-label">Sumber</label>
              <select id="j-sumber" className="control" value={filterSumber} onChange={(e) => { setFilterSumber(e.target.value); setPage(1); }}>
                <option value="all">Semua sumber</option>
                {Object.entries(SUMBER_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="j-lampiran" className="field-label">Lampiran</label>
              <select id="j-lampiran" className="control" value={filterLampiran} onChange={(e) => { setFilterLampiran(e.target.value); setPage(1); }}>
                <option value="all">Semua</option>
                <option value="ada">Ada lampiran</option>
                <option value="tidak_ada">Tanpa lampiran</option>
              </select>
            </div>
          </div>

          <DataTable
            label="Daftar jurnal"
            columns={columns}
            data={filteredItems}
            keyExtractor={(r) => r.id}
            page={page}
            onPageChange={setPage}
            onRowClick={(r) => setDetailJurnal(r)}
            rowActionLabel={(r) => `Buka jurnal ${r.nomorJurnal}`}
            empty={
              <EmptyState
                compact
                icon={PiNotebook}
                title={hasFilter ? 'Tidak ada jurnal yang cocok' : 'Belum ada jurnal'}
                description={
                  hasFilter
                    ? 'Ubah kata kunci atau filter.'
                    : 'Pakai tombol Buat jurnal di atas. Jurnal dari modul hutang juga muncul di daftar ini.'
                }
              />
            }
          />
        </Panel>
      </PageBody>

      {/* Form modal buat jurnal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Buat jurnal umum"
        description="Mutasi tercatat di saldo berjalan sesuai akun dan kode pembantu setelah diposting"
        size="xl"
        footer={
          <>
            <Button onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={() => handleSubmit('draft')}>Simpan draft</Button>
            <Button variant="primary" onClick={() => handleSubmit('diposting')} disabled={!siapPosting}>
              Simpan dan posting
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1.4fr]">
            <Field label="Tanggal" required>
              <input type="date" className="control" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </Field>
            <Field label="No. bukti" hint="Diberikan otomatis saat disimpan">
              <input className="control tabular-nums" value={nomorBerikutnya} readOnly />
            </Field>
            <Field label="Proyek" required>
              <select className="control" value={formProyekId} onChange={(e) => setFormProyekId(e.target.value)}>
                <option value="">Pilih proyek</option>
                {proyeks.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </Field>
            <Field label="Keterangan" required className="md:col-span-3">
              <input className="control" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Contoh: Pembayaran lahan kavling A-08" />
            </Field>
          </div>

          {formErrors.length > 0 && (
            <Notice tone="danger" title="Periksa kembali jurnal ini">
              <ul className="list-disc space-y-0.5 pl-4">
                {formErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Notice>
          )}

          <div className="relative overflow-x-auto rounded-lg border border-line">
            <table className="tbl tbl-compact min-w-[760px]">
              <thead>
                <tr>
                  <th scope="col" className="w-[30%]">Akun</th>
                  <th scope="col" className="w-[18%]">Kode pembantu</th>
                  <th scope="col">Keterangan baris</th>
                  <th scope="col" className="num w-36">Debit</th>
                  <th scope="col" className="num w-36">Kredit</th>
                  <th scope="col" className="w-10"><span className="sr-only">Hapus</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const akun = getAkun(row.akunId);
                  const n = i + 1;
                  return (
                    <tr key={row.id}>
                      <td>
                        <select aria-label={`Akun baris ${n}`} className="control control-sm" value={row.akunId} onChange={(e) => updateRow(row.id, 'akunId', e.target.value)}>
                          <option value="">Pilih akun</option>
                          {leafAkuns.map((a) => (
                            <option key={a.id} value={a.id}>{a.kodeAkun} - {a.namaAkun}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {akun ? (
                          <select
                            aria-label={`Kode pembantu baris ${n}${akun.wajibKodePembantu ? ' (wajib)' : ''}`}
                            aria-invalid={akun.wajibKodePembantu && !row.kodePembantuId ? true : undefined}
                            className="control control-sm"
                            value={row.kodePembantuId || ''}
                            onChange={(e) => updateRow(row.id, 'kodePembantuId', e.target.value)}
                          >
                            <option value="">{akun.wajibKodePembantu ? 'Wajib dipilih' : 'Tidak wajib'}</option>
                            {DUMMY_KODE_PEMBANTU.map((kp) => (
                              <option key={kp.id} value={kp.id}>{kp.id}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-ink-3">Pilih akun dulu</span>
                        )}
                      </td>
                      <td>
                        <input aria-label={`Keterangan baris ${n}`} className="control control-sm" value={row.keterangan} onChange={(e) => updateRow(row.id, 'keterangan', e.target.value)} />
                      </td>
                      <td>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          aria-label={`Debit baris ${n}`}
                          className="control control-sm control-num"
                          value={row.debit || ''}
                          onChange={(e) => updateRow(row.id, 'debit', Number(e.target.value))}
                          disabled={row.kredit > 0}
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          aria-label={`Kredit baris ${n}`}
                          className="control control-sm control-num"
                          value={row.kredit || ''}
                          onChange={(e) => updateRow(row.id, 'kredit', Number(e.target.value))}
                          disabled={row.debit > 0}
                          placeholder="0"
                        />
                      </td>
                      <td className="!px-1 text-center">
                        <IconButton
                          icon={PiTrash}
                          tone="danger"
                          label={`Hapus baris ${n}`}
                          onClick={() => rows.length > 2 && setRows((prev) => prev.filter((r) => r.id !== row.id))}
                          disabled={rows.length <= 2}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>
                    <Button size="sm" variant="ghost" icon={PiPlus} onClick={() => setRows((prev) => [...prev, EMPTY_ROW()])} className="-ml-2">
                      Tambah baris
                    </Button>
                  </td>
                  <td className="num"><Money value={totalDebit} /></td>
                  <td className="num"><Money value={totalKredit} /></td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Area lampiran */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <p className="field-label mb-0">
                Lampiran nota/bukti
                {hasKasBank && <span className="ml-1 text-red-500">*</span>}
              </p>
              {hasKasBank && (
                <Badge tone="warning">Wajib — ada akun kas/bank</Badge>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              multiple
              className="sr-only"
              id="lampiran-input"
              onChange={(e) => handleFileInput(e.target.files)}
            />
            <label
              htmlFor="lampiran-input"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-subtle p-5 text-center transition-colors hover:border-brand-600/50 hover:bg-brand-50"
            >
              <PiPaperclip className="h-6 w-6 text-ink-3" aria-hidden />
              <span className="text-sm font-medium text-ink-2">Klik untuk pilih file</span>
              <span className="text-xs text-ink-3">PDF atau gambar, maks {MAKS_UKURAN_MB} MB per file, bisa lebih dari satu</span>
            </label>

            {uploadError && (
              <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>
            )}

            {lampiranForm.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {lampiranForm.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2">
                    {l.tipe === 'pdf'
                      ? <PiFilePdf className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
                      : <PiImage className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                    }
                    <span className="flex-1 truncate text-sm text-ink">{l.nama}</span>
                    <span className="shrink-0 text-xs text-ink-3">{formatUkuran(l.ukuranBytes)}</span>
                    <button
                      type="button"
                      onClick={() => hapusLampiranForm(l.id)}
                      className="shrink-0 rounded p-0.5 text-ink-3 hover:text-red-600"
                      aria-label={`Hapus lampiran ${l.nama}`}
                    >
                      <PiX className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {siapPosting ? (
            <Notice tone="positive">Debit dan kredit seimbang. Jurnal siap diposting.</Notice>
          ) : (
            <Notice tone="warning">
              {totalDebit === 0 && totalKredit === 0
                ? 'Isi nominal debit dan kredit. Posting aktif setelah keduanya seimbang.'
                : !isBalanced
                  ? `Belum seimbang, selisih Rp ${Math.abs(totalDebit - totalKredit).toLocaleString('id-ID')}.`
                  : wajibLampiran
                    ? 'Akun kas/bank terlibat. Unggah lampiran nota sebelum posting.'
                    : 'Ada kode pembantu wajib yang masih kosong.'}
            </Notice>
          )}

          {impactText && (
            <Notice title="Akan tercatat di saldo berjalan">
              {impactText.kp.nama} ({impactText.kp.proyek}): hutang {impactText.berkurang ? 'berkurang' : 'bertambah'}{' '}
              <Money value={impactText.nominal} />.
            </Notice>
          )}
        </div>
      </Modal>

      {/* Detail jurnal */}
      <Modal
        isOpen={detailJurnal !== null}
        onClose={() => setDetailJurnal(null)}
        title={`Jurnal ${detailJurnal?.nomorJurnal ?? ''}`}
        description={detailJurnal?.keterangan}
        size="lg"
        footer={
          <>
            {detailJurnal?.status === 'draft' && (
              <Button variant="danger-ghost" icon={PiTrash} onClick={() => setDeleteTarget(detailJurnal)} className="sm:mr-auto">
                Hapus draft
              </Button>
            )}
            <Button onClick={() => setDetailJurnal(null)}>Tutup</Button>
          </>
        }
      >
        {detailJurnal && (
          <div className="space-y-5">
            <dl
              className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/50 bg-line md:grid-cols-4"
              style={{
                boxShadow: `
                  8px 8px 10px -1px rgba(0, 0, 0, 0.7),
                  -8px -8px 10px -1px rgba(255, 255, 255, 0.7)
                `,
              }}
            >
              {[
                { label: 'Tanggal', value: formatTanggal(detailJurnal.tanggal) },
                { label: 'Proyek', value: getProyekName(detailJurnal.proyekId) },
                { label: 'Sumber', value: <Badge>{SUMBER_LABEL[detailJurnal.sumber] ?? detailJurnal.sumber}</Badge> },
                { label: 'Status', value: <StatusBadge status={detailJurnal.status} /> },
              ].map((d) => (
                <div key={d.label} className="bg-subtle px-4 py-3">
                  <dt className="text-xs font-semibold text-ink-3">{d.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">{d.value}</dd>
                </div>
              ))}
            </dl>

            <div className="relative overflow-x-auto rounded-lg border border-line">
              <table className="tbl tbl-compact">
                <thead>
                  <tr>
                    <th scope="col">Akun</th>
                    <th scope="col">Kode pembantu</th>
                    <th scope="col">Keterangan</th>
                    <th scope="col" className="num">Debit</th>
                    <th scope="col" className="num">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {detailJurnal.rows.map((r) => (
                    <tr key={r.id}>
                      <td className={r.kredit ? 'pl-8 text-ink-2' : 'text-ink'}>{getAkunLabel(r.akunId)}</td>
                      <td>{r.kodePembantuId || <span className="text-ink-3">-</span>}</td>
                      <td>{r.keterangan || <span className="text-ink-3">-</span>}</td>
                      <td className="num">{r.debit ? <Money value={r.debit} /> : <span className="text-ink-3">-</span>}</td>
                      <td className="num">{r.kredit ? <Money value={r.kredit} /> : <span className="text-ink-3">-</span>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total</td>
                    <td className="num"><Money value={detailJurnal.rows.reduce((s, r) => s + r.debit, 0)} /></td>
                    <td className="num"><Money value={detailJurnal.rows.reduce((s, r) => s + r.kredit, 0)} /></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Panel lampiran di detail */}
            {(detailJurnal.lampiran?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">
                  Lampiran ({detailJurnal.lampiran.length})
                </p>
                <ul className="space-y-1.5">
                  {detailJurnal.lampiran.map((l) => (
                    <li key={l.id} className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2">
                      {l.tipe === 'pdf'
                        ? <PiFilePdf className="h-4 w-4 shrink-0 text-red-500" aria-hidden />
                        : <PiImage className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                      }
                      <span className="flex-1 truncate text-sm text-ink">{l.nama}</span>
                      <span className="shrink-0 text-xs text-ink-3">{formatUkuran(l.ukuranBytes)}</span>
                      <a
                        href={l.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={l.nama}
                        className="shrink-0 rounded p-0.5 text-ink-3 hover:text-brand-600"
                        aria-label={`Buka ${l.nama}`}
                      >
                        <PiArrowSquareOut className="h-4 w-4" aria-hidden />
                      </a>
                      <a
                        href={l.dataUrl}
                        download={l.nama}
                        className="shrink-0 rounded p-0.5 text-ink-3 hover:text-brand-600"
                        aria-label={`Unduh ${l.nama}`}
                      >
                        <PiDownloadSimple className="h-4 w-4" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          remove(deleteTarget.id);
          setDetailJurnal(null);
        }}
        title="Hapus draft jurnal"
        message={`Hapus draft ${deleteTarget?.nomorJurnal ?? ''}? Jurnal yang dihapus tidak bisa dipulihkan.`}
        confirmLabel="Hapus draft"
      />
    </>
  );
}
