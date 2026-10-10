import { useMemo, useState, useEffect } from 'react';
import {
  PiPlus,
  PiPencilSimple,
  PiTrash,
  PiMagnifyingGlass,
  PiClockCounterClockwise,
  PiLockSimple,
  PiTreeStructure,
  PiSpinnerGap,
  PiCaretDown,
  PiCaretRight,
} from 'react-icons/pi';
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
  const { items, riwayat, add, update, remove, isLoading, error, fetchRiwayat } = useCoaStore();
  const jurnals = useJurnalStore((s) => s.items);
  const periodes = useSaldoAwalStore((s) => s.periodes);
  const userName = useAuthStore((s) => s.user?.name ?? 'Sistem');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [riwayatId, setRiwayatId] = useState<string | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ id: string; payload: Omit<Akun, 'id'> } | null>(null);

  useEffect(() => {
    if (riwayatId) {
      fetchRiwayat(riwayatId);
    }
  }, [riwayatId, fetchRiwayat]);

  useEffect(() => {
    if (items.length > 0 && expandedIds.size === 0) {
      setExpandedIds(new Set(items.map((i) => i.id)));
    }
  }, [items]);


  const hasTransactions = (akunId: string) =>
    jurnals.some((j) => j.rows.some((r) => r.akunId === akunId)) ||
    Object.values(periodes).some((p) => p.saldo.some((s) => s.akunId === akunId && (s.debit > 0 || s.kredit > 0)));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(items.map((i) => i.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const childrenMap = useMemo(() => {
    const map = new Map<string, Akun[]>();
    items.forEach((item) => {
      const parentId = item.akunIndukId || 'root';
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId)!.push(item);
    });
    map.forEach((list) => list.sort((a, b) => a.kodeAkun.localeCompare(b.kodeAkun)));
    return map;
  }, [items]);

  type TreeRow = Akun & { depth: number; hasChildren: boolean; isExpanded: boolean };

  const treeRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    const isFiltering = Boolean(q || filterKategori !== 'all' || filterKlasifikasi !== 'all');

    const matchesFilter = (a: Akun) => {
      const matchSearch = !q || a.namaAkun.toLowerCase().includes(q) || a.kodeAkun.toLowerCase().includes(q);
      const matchKat = filterKategori === 'all' || a.kategori === filterKategori;
      const matchKlas = filterKlasifikasi === 'all' || a.klasifikasi === filterKlasifikasi;
      return matchSearch && matchKat && matchKlas;
    };

    const keepIds = new Set<string>();
    const autoExpandIds = new Set<string>();

    if (isFiltering) {
      items.forEach((a) => {
        if (matchesFilter(a)) {
          keepIds.add(a.id);
          let currentParentId = a.akunIndukId;
          while (currentParentId) {
            keepIds.add(currentParentId);
            autoExpandIds.add(currentParentId);
            const parentItem = items.find((i) => i.id === currentParentId);
            currentParentId = parentItem?.akunIndukId || null;
          }
        }
      });
    }

    const rows: TreeRow[] = [];

    const traverse = (parentId: string | null, depth: number) => {
      const children = childrenMap.get(parentId || 'root') || [];
      children.forEach((child) => {
        if (isFiltering && !keepIds.has(child.id)) return;

        const hasChildren = (childrenMap.get(child.id)?.length || 0) > 0;
        const isExpanded = isFiltering ? autoExpandIds.has(child.id) || expandedIds.has(child.id) : expandedIds.has(child.id);

        rows.push({
          ...child,
          depth,
          hasChildren,
          isExpanded,
        });

        if (hasChildren && isExpanded) {
          traverse(child.id, depth + 1);
        }
      });
    };

    traverse(null, 0);

    return rows;
  }, [items, childrenMap, search, filterKategori, filterKlasifikasi, expandedIds]);

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

  const columns: Column<TreeRow>[] = [
    {
      key: 'kodeAkun',
      label: 'Kode',
      className: 'w-[100px]',
      render: (r) => <span className={`tabular-nums ${r.hasChildren ? 'font-bold text-ink' : ''}`}>{r.kodeAkun}</span>,
    },
    {
      key: 'namaAkun',
      label: 'Nama akun',
      className: 'w-[320px]',
      render: (r) => {
        const indentPx = r.depth * 20;
        return (
          <div className="flex items-center gap-1.5" style={{ paddingLeft: `${indentPx}px` }}>
            {r.hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(r.id);
                }}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-black/5 text-ink-2 transition-transform duration-150"
                aria-label={r.isExpanded ? `Tutup sub-akun ${r.namaAkun}` : `Buka sub-akun ${r.namaAkun}`}
              >
                {r.isExpanded ? (
                  <PiCaretDown className="h-4 w-4 text-brand-600 font-bold" aria-hidden />
                ) : (
                  <PiCaretRight className="h-4 w-4 text-ink-3" aria-hidden />
                )}
              </button>
            ) : (
              <span className="inline-block h-6 w-6 shrink-0" aria-hidden />
            )}
            <span className={`truncate ${r.hasChildren ? 'font-bold text-ink' : r.depth === 0 ? 'font-semibold text-ink' : 'text-ink-2'}`}>
              {r.namaAkun}
            </span>
          </div>
        );
      },
    },
    { key: 'kategori', label: 'Kategori', className: 'w-[130px]', render: (r) => KATEGORI_AKUN_LABELS[r.kategori] },
    { key: 'tipeSaldo', label: 'Saldo normal', className: 'w-[130px]', render: (r) => (r.tipeSaldo === 'd' ? 'Debit' : 'Kredit') },
    { key: 'klasifikasi', label: 'Klasifikasi', className: 'w-[130px]', render: (r) => KLASIFIKASI_AKUN_LABELS[r.klasifikasi] },
    {
      key: 'aturan',
      label: 'Aturan',
      className: 'w-[220px]',
      render: (r) => {
        const tags = r.hasChildren
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
      className: 'w-[110px]',
      render: (r) => <Badge tone={r.status === 'aktif' ? 'positive' : 'neutral'}>{r.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Badge>,
    },
    {
      key: 'aksi',
      label: 'Aksi',
      className: 'w-[110px] whitespace-nowrap',
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
        title="Daftar akun berjenjang"
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-subtle/30 px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-2">
            <PiTreeStructure className="h-4 w-4 text-brand-600" aria-hidden />
            <span>Navigasi Berjenjang (Hierarki Akun)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={expandAll} icon={PiCaretDown}>
              Buka semua
            </Button>
            <Button size="sm" variant="secondary" onClick={collapseAll} icon={PiCaretRight}>
              Tutup semua
            </Button>
          </div>
        </div>

        <DataTable
          label="Daftar akun berjenjang"
          columns={columns as any}
          data={treeRows}
          keyExtractor={(r) => r.id}
          page={page}
          pageSize={50}
          onPageChange={setPage}
          tableClassName="table-fixed min-w-[1150px]"
          rowClassName={(r) => (r.hasChildren ? 'bg-subtle/40 font-semibold' : '')}
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
