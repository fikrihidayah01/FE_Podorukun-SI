import { useMemo, useState } from 'react';
import { PiPlus, PiPencilSimple, PiTrash, PiMagnifyingGlass, PiClockCounterClockwise, PiLockSimple, PiTreeStructure, PiSpinnerGap } from 'react-icons/pi';
import DataTable, { type Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Panel from '../../components/ui/Panel';
import Button, { IconButton } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Field from '../../components/ui/Field';
import Notice from '../../components/ui/Notice';
import EmptyState from '../../components/ui/EmptyState';
import {
  useCoaStore,
  type Akun,
  type KategoriAkun,
  type KlasifikasiAkun,
  type TipeSaldo,
  type KategoriHutangPiutang,
  type StatusAkun,
  KATEGORI_AKUN_LABELS,
  KLASIFIKASI_AKUN_LABELS,
  KATEGORI_HUTANG_PIUTANG_LABELS,
} from '../../store/coaStore';
import { useJurnalStore } from '../../store/jurnalStore';
import { useSaldoAwalStore } from '../../store/saldoAwalStore';
import { useAuthStore } from '../../store/authStore';

const EMPTY_FORM: Partial<Akun> = {
  kodeAkun: '',
  namaAkun: '',
  kategori: 'aktiva',
  tipeSaldo: 'd',
  klasifikasi: 'neraca',
  status: 'aktif',
  wajibKodePembantu: false,
  wajibProyek: false,
  isKasBank: false,
  kasBankInduk: undefined,
  kategoriHutangPiutang: undefined,
  akunIndukId: '',
};

const ATURAN = [
  { key: 'wajibKodePembantu', label: 'Wajib kode pembantu', hint: 'Jurnal ditolak jika kode pembantu kosong' },
  { key: 'wajibProyek', label: 'Wajib proyek', hint: 'Setiap transaksi harus terikat ke satu proyek' },
  { key: 'isKasBank', label: 'Akun kas / bank', hint: 'Muncul sebagai pilihan di formulir pembayaran' },
] as const;

export default function DaftarAkunTab() {
  const { items, riwayat, add, update, remove, isLoading, error } = useCoaStore();
  const jurnals = useJurnalStore((s) => s.items);
  const periodes = useSaldoAwalStore((s) => s.periodes);
  const userName = useAuthStore((s) => s.user?.name ?? 'Sistem');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [riwayatId, setRiwayatId] = useState<string | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ id: string; payload: Omit<Akun, 'id'> } | null>(null);

  const hasTransactions = (akunId: string) =>
    jurnals.some((j) => j.rows.some((r) => r.akunId === akunId)) ||
    periodes.some((p) => p.saldo.some((s) => s.akunId === akunId && (s.debit > 0 || s.kredit > 0)));

  const parentIds = useMemo(() => new Set(items.map((a) => a.akunIndukId).filter(Boolean)), [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter(
        (a) =>
          (a.namaAkun.toLowerCase().includes(q) || a.kodeAkun.toLowerCase().includes(q)) &&
          (filterKategori === 'all' || a.kategori === filterKategori) &&
          (filterKlasifikasi === 'all' || a.klasifikasi === filterKlasifikasi),
      )
      .sort((a, b) => a.kodeAkun.localeCompare(b.kodeAkun));
  }, [items, search, filterKategori, filterKlasifikasi]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (item: Akun) => {
    setForm({ ...item, akunIndukId: item.akunIndukId || '' });
    setErrors({});
    setEditId(item.id);
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const kode = form.kodeAkun?.trim() ?? '';
    if (!kode) e.kodeAkun = 'Kode akun wajib diisi.';
    else if (kode.length !== 6) e.kodeAkun = 'Kode akun harus 6 digit.';
    else if (!editId && items.some((a) => a.kodeAkun.toLowerCase() === kode.toLowerCase())) e.kodeAkun = 'Kode akun ini sudah dipakai.';
    
    if (!form.namaAkun?.trim()) e.namaAkun = 'Nama akun wajib diisi.';
    
    if (form.isKasBank && !form.kasBankInduk) {
      e.kasBankInduk = 'Rekening penampung wajib dipilih jika akun adalah kas / bank.';
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload: Omit<Akun, 'id'> = {
      kodeAkun: form.kodeAkun!.trim(),
      namaAkun: form.namaAkun!.trim(),
      kategori: form.kategori as KategoriAkun,
      tipeSaldo: form.tipeSaldo as TipeSaldo,
      klasifikasi: form.klasifikasi as KlasifikasiAkun,
      status: form.status as StatusAkun,
      akunIndukId: form.akunIndukId || null,
      wajibKodePembantu: form.wajibKodePembantu || false,
      wajibProyek: form.wajibProyek || false,
      isKasBank: form.isKasBank || false,
      kasBankInduk: form.isKasBank ? form.kasBankInduk : null,
      kategoriHutangPiutang: ['hutang', 'aktiva'].includes(form.kategori as string) ? form.kategoriHutangPiutang : null,
    };
    try {
      if (editId) {
        const wasAktif = items.find((i) => i.id === editId)?.status === 'aktif';
        if (form.status === 'nonaktif' && wasAktif && hasTransactions(editId)) {
          setStatusConfirm({ id: editId, payload });
          return;
        }
        await update(editId, payload, userName);
      } else {
        await add(payload, userName);
      }
      setModalOpen(false);
    } catch (err: any) {
      setErrors({ ...errors, submit: err.message || 'Terjadi kesalahan' });
    }
  };

  const editLocked = editId ? hasTransactions(editId) : false;
  const riwayatAkun = items.find((i) => i.id === riwayatId);
  const riwayatRows = riwayat
    .filter((r) => r.akunId === riwayatId)
    .sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());

  const columns: Column<Akun>[] = [
    {
      key: 'kodeAkun',
      label: 'Kode',
      render: (r) => <span className={`tabular-nums ${parentIds.has(r.id) ? 'font-bold text-ink' : ''}`}>{r.kodeAkun}</span>,
    },
    {
      key: 'namaAkun',
      label: 'Nama akun',
      render: (r) => (
        <span className={`block ${r.akunIndukId ? 'pl-5' : ''} ${parentIds.has(r.id) ? 'font-bold text-ink' : 'text-ink'}`}>{r.namaAkun}</span>
      ),
    },
    { key: 'kategori', label: 'Kategori', render: (r) => KATEGORI_AKUN_LABELS[r.kategori] },
    { key: 'tipeSaldo', label: 'Saldo normal', render: (r) => (r.tipeSaldo === 'd' ? 'Debit' : 'Kredit') },
    { key: 'klasifikasi', label: 'Klasifikasi', render: (r) => KLASIFIKASI_AKUN_LABELS[r.klasifikasi] },
    {
      key: 'aturan',
      label: 'Aturan',
      render: (r) => {
        const tags = parentIds.has(r.id)
          ? ['Akun induk']
          : [r.isKasBank && 'Kas / bank', r.wajibProyek && 'Wajib proyek', r.wajibKodePembantu && 'Kode pembantu'].filter(Boolean);
        if (tags.length === 0) return <span className="text-ink-3">-</span>;
        return (
          <span className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <Badge key={t as string}>{t}</Badge>
            ))}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge tone={r.status === 'aktif' ? 'positive' : 'neutral'}>{r.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Badge>,
    },
    {
      key: 'aksi',
      label: 'Aksi',
      className: 'w-px whitespace-nowrap',
      render: (r) => {
        const inUse = hasTransactions(r.id);
        return (
          <div className="flex items-center gap-0.5">
            <IconButton icon={PiClockCounterClockwise} label={`Riwayat ${r.kodeAkun}`} onClick={() => setRiwayatId(r.id)} />
            <IconButton icon={PiPencilSimple} label={`Ubah ${r.kodeAkun}`} onClick={() => openEdit(r)} />
            {inUse ? (
              <IconButton icon={PiLockSimple} label="Sudah dipakai transaksi, tidak bisa dihapus" disabled />
            ) : (
              <IconButton icon={PiTrash} tone="danger" label={`Hapus ${r.kodeAkun}`} onClick={() => setDeleteId(r.id)} />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Panel
        title="Daftar akun"
        description={`${items.filter((i) => i.status === 'aktif').length} akun aktif dari ${items.length}`}
        flush
        actions={
          <Button variant="primary" icon={PiPlus} onClick={openAdd}>
            Tambah akun
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-3 border-b border-line px-4 py-3.5 sm:grid-cols-[minmax(0,1.4fr)_1fr_1fr] sm:px-5">
          <div>
            <label htmlFor="coa-cari" className="field-label">Cari</label>
            <div className="relative">
              <PiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <input
                id="coa-cari"
                type="search"
                className="control pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Kode atau nama akun"
              />
            </div>
          </div>
          <div>
            <label htmlFor="coa-kategori" className="field-label">Kategori</label>
            <select
              id="coa-kategori"
              className="control"
              value={filterKategori}
              onChange={(e) => {
                setFilterKategori(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Semua kategori</option>
              {Object.entries(KATEGORI_AKUN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="coa-klas" className="field-label">Klasifikasi</label>
            <select
              id="coa-klas"
              className="control"
              value={filterKlasifikasi}
              onChange={(e) => {
                setFilterKlasifikasi(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Semua klasifikasi</option>
              {Object.entries(KLASIFIKASI_AKUN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          label="Daftar akun"
          columns={columns}
          data={filtered}
          keyExtractor={(r) => r.id}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          rowClassName={(r) => (parentIds.has(r.id) ? '[&>td]:bg-subtle' : '')}
          empty={
            isLoading ? (
              <div className="flex justify-center p-10"><PiSpinnerGap className="h-6 w-6 animate-spin text-ink-3" /></div>
            ) : error ? (
              <EmptyState compact title="Gagal memuat" description={error} />
            ) : (
              <EmptyState
                compact
                icon={PiTreeStructure}
                title={items.length === 0 ? 'Belum ada akun' : 'Tidak ada akun yang cocok'}
                description={items.length === 0 ? 'Tambahkan akun pertama untuk mulai mencatat jurnal.' : 'Ubah kata kunci atau filter kategori dan klasifikasi.'}
              />
            )
          }
        />
      </Panel>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Ubah akun' : 'Tambah akun'}
        size="lg"
        footer={
          <>
            <Button onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit}>
              Simpan akun
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {errors.submit && <Notice tone="danger">{errors.submit}</Notice>}
          {editLocked && <Notice tone="warning">Akun ini sudah dipakai di transaksi, jadi kodenya terkunci. Akun hanya bisa dinonaktifkan, tidak dihapus.</Notice>}

          <Field label="Akun induk" optional>
            <select className="control control-cembung" value={form.akunIndukId || ''} onChange={(e) => setForm({ ...form, akunIndukId: e.target.value })}>
              <option value="">Tidak ada (akun level atas)</option>
              {items.map((i) => (
                <option key={i.id} value={i.id} disabled={i.id === editId}>
                  {i.kodeAkun} - {i.namaAkun}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
            <Field label="Kode akun" required error={errors.kodeAkun} hint="6 digit">
              <input
                className="control tabular-nums"
                inputMode="numeric"
                maxLength={6}
                value={form.kodeAkun}
                onChange={(e) => setForm({ ...form, kodeAkun: e.target.value })}
                placeholder="213020"
                disabled={editLocked}
              />
            </Field>
            <Field label="Nama akun" required error={errors.namaAkun}>
              <input className="control" value={form.namaAkun} onChange={(e) => setForm({ ...form, namaAkun: e.target.value })} placeholder="Contoh: Hutang material" />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Kategori">
              <select className="control control-cembung" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value as KategoriAkun })}>
                {Object.entries(KATEGORI_AKUN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Saldo normal">
              <select className="control control-cembung" value={form.tipeSaldo} onChange={(e) => setForm({ ...form, tipeSaldo: e.target.value as TipeSaldo })}>
                <option value="d">Debit</option>
                <option value="k">Kredit</option>
              </select>
            </Field>
            <Field label="Klasifikasi">
              <select className="control control-cembung" value={form.klasifikasi} onChange={(e) => setForm({ ...form, klasifikasi: e.target.value as KlasifikasiAkun })}>
                {Object.entries(KLASIFIKASI_AKUN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {['hutang', 'aktiva'].includes(form.kategori as string) && (
              <Field label="Kelompok hutang / piutang" hint="Menentukan pengelompokan di halaman Hutang dan Tagihan user">
                <select
                  className="control control-cembung"
                  value={form.kategoriHutangPiutang || ''}
                  onChange={(e) => setForm({ ...form, kategoriHutangPiutang: (e.target.value || undefined) as KategoriHutangPiutang | undefined })}
                >
                  <option value="">Tidak dikelompokkan</option>
                  {Object.entries(KATEGORI_HUTANG_PIUTANG_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Status">
              <select className="control control-cembung" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StatusAkun })}>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </Field>
          </div>

          <fieldset>
            <legend className="field-label">Aturan akun</legend>
            <div className="divide-y divide-line rounded-lg border border-line">
              {ATURAN.map((a) => (
                <div key={a.key}>
                  <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-subtle">
                    <input
                      type="checkbox"
                      className="checkbox mt-0.5"
                      checked={Boolean(form[a.key])}
                      onChange={(e) => setForm({ ...form, [a.key]: e.target.checked })}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{a.label}</span>
                      <span className="mt-0.5 block text-[13px] text-ink-3">{a.hint}</span>
                    </span>
                  </label>
                  {a.key === 'isKasBank' && form.isKasBank && (
                    <div className="border-t border-line bg-subtle px-4 py-3 pl-11">
                      <Field label="Tersambung ke" hint="Pilih rekening penampung" required error={errors.kasBankInduk}>
                        <select
                          className={`control control-cembung ${errors.kasBankInduk ? 'border-danger focus:ring-danger/20' : ''}`}
                          value={form.kasBankInduk || ''}
                          onChange={(e) => setForm({ ...form, kasBankInduk: e.target.value || undefined })}
                        >
                          <option value="">-- Pilih Rekening --</option>
                          <option value="REKENING TABUNGAN PENAMPUNG">REKENING TABUNGAN PENAMPUNG</option>
                          <option value="BANK BCA BRI BSI BNI (GIRO)">BANK BCA BRI BSI BNI (GIRO)</option>
                          <option value="BANK BTN BTNS (GIRO)">BANK BTN BTNS (GIRO)</option>
                          <option value="BANK MANDIRI">BANK MANDIRI</option>
                        </select>
                      </Field>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove(deleteId)}
        title="Hapus akun"
        message="Hapus akun ini? Akun yang dihapus tidak bisa dipulihkan."
        confirmLabel="Hapus akun"
      />

      <ConfirmDialog
        isOpen={statusConfirm !== null}
        onClose={() => setStatusConfirm(null)}
        onConfirm={() => {
          if (!statusConfirm) return;
          update(statusConfirm.id, statusConfirm.payload, userName);
          setModalOpen(false);
        }}
        title="Nonaktifkan akun"
        message="Akun ini masih punya saldo atau pernah dipakai transaksi. Setelah dinonaktifkan, akun tidak muncul lagi di formulir jurnal, tetapi riwayat saldonya tetap ada di laporan."
        confirmLabel="Nonaktifkan"
        isDestructive={false}
      />

      <Modal
        isOpen={riwayatId !== null}
        onClose={() => setRiwayatId(null)}
        title="Riwayat perubahan"
        description={riwayatAkun ? `${riwayatAkun.kodeAkun} - ${riwayatAkun.namaAkun}` : undefined}
        size="lg"
        footer={<Button onClick={() => setRiwayatId(null)}>Tutup</Button>}
      >
        <div className="space-y-4">
          {riwayatId && hasTransactions(riwayatId) && (
            <Notice tone="warning">Akun sudah punya transaksi. Kodenya tidak bisa diubah dan akun tidak bisa dihapus, hanya dinonaktifkan.</Notice>
          )}
          {riwayatRows.length === 0 ? (
            <EmptyState compact icon={PiClockCounterClockwise} title="Belum ada perubahan" description="Setiap perubahan akun tercatat di sini beserta nama pengubahnya." />
          ) : (
            <div className="relative overflow-x-auto rounded-lg border border-line">
              <table className="tbl tbl-compact">
                <thead>
                  <tr>
                    <th scope="col">Waktu</th>
                    <th scope="col">Kolom</th>
                    <th scope="col">Nilai lama</th>
                    <th scope="col">Nilai baru</th>
                    <th scope="col">Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatRows.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap tabular-nums">
                        {new Date(r.waktu)
                          .toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          .replace('.', ':')}
                      </td>
                      <td className="font-semibold text-ink">{r.field}</td>
                      <td>{r.nilaiLama}</td>
                      <td className="text-ink">{r.nilaiBaru}</td>
                      <td>{r.oleh}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
