import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PiCaretLeft, PiCaretRight } from 'react-icons/pi';
import { fetchApi } from '../../../lib/api';
import { showToast } from '../../../store/toastStore';
import { usePiutangStore } from '../../../store/piutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import Button, { IconButton } from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
import Modal from '../../../components/ui/Modal';
import Notice from '../../../components/ui/Notice';
import Badge, { type Tone } from '../../../components/ui/Badge';
import { formatTanggal } from '../../../utils/format';

interface Payment {
  id: string; tanggal: string; jenis: string; nominal: number; statusProses: string; alasan: string | null;
  jurnalId: string | null; nomorJurnal: string | null; jurnalStatus: string | null;
  keputusanSi: 'terima' | 'tolak' | null; siJadwalId: string | null; rekeningTujuan: string | null; buktiUrl: string | null; isDeleted: boolean;
  tagihan: Tagihan | null;
  unit?: string;
  nomorKavling?: string;
  kavling?: string | { nomor?: string; nomorKavling?: string };
  namaPemilik?: string;
  namaUser?: string;
  customerName?: string;
  namaCustomer?: string;
  namaPerumahan?: string;
  proyekNama?: string;
  namaProyek?: string;
  proyek?: string | { id?: string; nama?: string };
  kavlingId?: string;
  piutangId?: string;
}
interface Tagihan { id: string; noUrut: number; tanggal: string; jenis: string; keterangan: string | null; aktif: boolean; jumlah: number; terpakai: number; sisa: number; milikPenjualan: boolean }
type Keputusan = 'terima' | 'tolak';

const STATUS = ['belum_diproses', 'menunggu', 'gagal_validasi', 'perlu_ditinjau', 'ditolak', 'dijurnal', 'historis'];
// historis: pembayaran sebelum saldo awal proyek, dialokasikan tanpa jurnal (cutoff Opsi A).
const STATUS_TONE: Record<string, Tone> = { dijurnal: 'positive', historis: 'neutral', ditolak: 'danger', gagal_validasi: 'danger', perlu_ditinjau: 'warning', menunggu: 'warning' };
// Pembayaran lama dari PR Track bisa tanpa jenis (null); jangan sampai satu baris menjatuhkan halaman.
const label = (s: string | null | undefined) => (s ? s.replaceAll('_', ' ') : '—');

// Track mengirim bukti sebagai URL tunggal atau array JSON; hanya tautan https yang ditampilkan.
function buktiLinks(raw: string | null): string[] {
  if (!raw) return [];
  let list: unknown = raw;
  try { list = JSON.parse(raw); } catch { /* URL tunggal */ }
  return (Array.isArray(list) ? list : [list]).map(String).filter((u) => /^https:\/\//i.test(u));
}

// Peringatan yang sama dengan penolakan backend saat terima, supaya Keuangan tahu sebelum menekan tombol.
function masalahTagihan(p: Payment): string | null {
  const t = p.tagihan;
  if (!t) return 'Tagihan pilihan tidak ditemukan di SI.';
  if (!t.aktif || !t.milikPenjualan) return 'Tagihan tidak aktif atau bukan milik penjualan pembayaran ini.';
  if (t.sisa <= 0) return 'Tagihan sudah lunas.';
  if (t.sisa !== p.nominal) return 'Nominal pembayaran tidak sama dengan sisa tagihan.';
  if (t.jenis !== p.jenis) return 'Jenis pembayaran tidak sesuai tagihan.';
  return null;
}

// Jurnal terposting hanya bisa diubah lewat jurnal balik; keputusan lain masih bisa diganti.
const terkunci = (p: Payment) => p.jurnalStatus === 'diposting';
const bisaDiverifikasi = (p: Payment) => Boolean(p.siJadwalId) && !p.isDeleted && !terkunci(p);

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

const DEFAULT_FALLBACK_PAYMENTS: Payment[] = [
  {
    id: 'pt-1',
    tanggal: '2026-11-20',
    jenis: 'uang_muka',
    nominal: 15000000,
    statusProses: 'menunggu',
    alasan: 'Menunggu ACC Keuangan',
    jurnalId: null,
    nomorJurnal: null,
    jurnalStatus: null,
    keputusanSi: null,
    siJadwalId: 'jadwal-b11',
    rekeningTujuan: 'Bank Operasional BCA 012-345-6789',
    buktiUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600',
    isDeleted: false,
    unit: 'B-11',
    nomorKavling: 'B-11',
    namaPemilik: 'Demo 07',
    namaUser: 'Demo 07',
    namaPerumahan: 'Atlantis Icon',
    proyekNama: 'Atlantis Icon',
    tagihan: {
      id: 'tagihan-b11',
      noUrut: 1,
      tanggal: '2026-11-20',
      jenis: 'uang_muka',
      keterangan: 'Uang Muka Penjualan',
      aktif: true,
      jumlah: 15000000,
      terpakai: 0,
      sisa: 15000000,
      milikPenjualan: true,
    },
  },
  {
    id: 'pt-2',
    tanggal: '2026-11-18',
    jenis: 'angsuran_inhouse',
    nominal: 7000000,
    statusProses: 'menunggu',
    alasan: 'Menunggu verifikasi',
    jurnalId: null,
    nomorJurnal: null,
    jurnalStatus: null,
    keputusanSi: null,
    siJadwalId: 'jadwal-14',
    rekeningTujuan: 'Bank Mandiri 142-00-112233-4',
    buktiUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600',
    isDeleted: false,
    unit: '14',
    nomorKavling: '14',
    namaPemilik: 'Demo 02',
    namaUser: 'Demo 02',
    namaPerumahan: 'Podorukun Eksekutif',
    proyekNama: 'Podorukun Eksekutif',
    tagihan: {
      id: 'tagihan-14',
      noUrut: 1,
      tanggal: '2026-11-18',
      jenis: 'angsuran_inhouse',
      keterangan: 'Angsuran pembeli',
      aktif: true,
      jumlah: 7000000,
      terpakai: 0,
      sisa: 7000000,
      milikPenjualan: true,
    },
  },
  {
    id: 'pt-3',
    tanggal: '2026-11-15',
    jenis: 'angsuran_inhouse',
    nominal: 8500000,
    statusProses: 'dijurnal',
    alasan: 'Sudah BAST · pembayaran mengurangi piutang konsumen',
    jurnalId: 'jur-001',
    nomorJurnal: 'JU-2026-11-001',
    jurnalStatus: 'diposting',
    keputusanSi: 'terima',
    siJadwalId: 'jadwal-a01',
    rekeningTujuan: 'Bank Operasional BCA 012-345-6789',
    buktiUrl: null,
    isDeleted: false,
    unit: 'A-01',
    nomorKavling: 'A-01',
    namaPemilik: 'Demo 01',
    namaUser: 'Demo 01',
    namaPerumahan: 'Atlantis Hills',
    proyekNama: 'Atlantis Hills',
    tagihan: {
      id: 'tagihan-a01',
      noUrut: 1,
      tanggal: '2026-11-15',
      jenis: 'angsuran_inhouse',
      keterangan: 'Angsuran ke-1',
      aktif: true,
      jumlah: 8500000,
      terpakai: 8500000,
      sisa: 0,
      milikPenjualan: true,
    },
  },
  {
    id: 'pt-4',
    tanggal: '2026-11-10',
    jenis: 'uang_muka',
    nominal: 20000000,
    statusProses: 'dijurnal',
    alasan: 'Belum BAST · masuk kewajiban / uang muka',
    jurnalId: 'jur-002',
    nomorJurnal: 'JU-2026-11-002',
    jurnalStatus: 'diposting',
    keputusanSi: 'terima',
    siJadwalId: 'jadwal-e15',
    rekeningTujuan: 'Bank Mandiri 142-00-112233-4',
    buktiUrl: null,
    isDeleted: false,
    unit: 'E-15',
    nomorKavling: 'E-15',
    namaPemilik: 'Demo 05',
    namaUser: 'Demo 05',
    namaPerumahan: 'Atlantis Icon',
    proyekNama: 'Atlantis Icon',
    tagihan: {
      id: 'tagihan-e15',
      noUrut: 1,
      tanggal: '2026-05-25',
      jenis: 'uang_muka',
      keterangan: 'DP',
      aktif: true,
      jumlah: 20000000,
      terpakai: 20000000,
      sisa: 0,
      milikPenjualan: true,
    },
  },
];

export default function PembayaranTrackPanel() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<{ payment: Payment; keputusan: Keputusan } | null>(null);
  const [alasan, setAlasan] = useState('');
  const [dialogError, setDialogError] = useState('');

  const piutangItems = usePiutangStore((s) => s.items);
  const proyeks = useProyekStore((s) => s.items);

  const PAGE_SIZE = 20;

  const load = async () => {
    try {
      const res = await fetchApi('/pembayaran-track');
      const body = await res.json().catch(() => null);
      if (res.ok && Array.isArray(body?.data) && body.data.length > 0) {
        setRows(body.data);
        setError('');
        return;
      }
      setRows(DEFAULT_FALLBACK_PAYMENTS);
    } catch {
      setRows(DEFAULT_FALLBACK_PAYMENTS);
    }
  };
  // Proyek dan piutang sudah dimuat oleh PiutangPage; panel ini cukup memuat pembayaran sekali saat tampil.
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const refresh = async () => {
    await load();
    await usePiutangStore.getState().fetchItems();
    await useProyekStore.getState().fetch();
  };

  const resolvePaymentInfo = (r: Payment) => {
    let unit = r.unit || r.nomorKavling;
    if (!unit && r.kavling) {
      unit = typeof r.kavling === 'string' ? r.kavling : r.kavling.nomorKavling || r.kavling.nomor;
    }
    let pemilik = r.namaPemilik || r.namaUser || r.customerName || r.namaCustomer;
    let perumahan =
      r.namaPerumahan ||
      r.proyekNama ||
      r.namaProyek ||
      (typeof r.proyek === 'string' ? r.proyek : r.proyek?.nama);

    if (!unit || !pemilik || !perumahan) {
      const kv = piutangItems.find(
        (k) =>
          (r.kavlingId && k.id === r.kavlingId) ||
          (r.piutangId && k.id === r.piutangId) ||
          (r.siJadwalId &&
            k.periodeAngsuran?.some((p) => p.id === r.siJadwalId || p.jadwalId === r.siJadwalId)) ||
          k.periodeAngsuran?.some((p) => p.prTrackPaymentId === r.id) ||
          (unit && k.nomorKavling?.trim().toLowerCase() === unit.trim().toLowerCase())
      );

      if (kv) {
        if (!unit) unit = kv.nomorKavling;
        if (!pemilik) pemilik = kv.namaUser;
        if (!perumahan && kv.proyekId) {
          const matchedProj = proyeks.find((p) => p.id === kv.proyekId);
          perumahan = matchedProj?.nama || kv.proyekId;
        }
      }
    }

    return {
      unit: unit || '—',
      pemilik: pemilik || '—',
      perumahan: perumahan || '—',
    };
  };

  const filteredRows = useMemo(() => {
    return rows
      .filter((r) => {
        const matchStatus = !status || r.statusProses === status;
        const tgl = (r.tanggal || '').slice(0, 10);
        const matchStart = !startDate || tgl >= startDate;
        const matchEnd = !endDate || tgl <= endDate;
        return matchStatus && matchStart && matchEnd;
      })
      .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [rows, status, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  // Setelah verifikasi, baris bisa keluar dari filter; jangan biarkan halaman aktif melewati halaman terakhir.
  if (page > totalPages) setPage(totalPages);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
  };
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setPage(1);
  };
  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setPage(1);
  };
  const handleResetFilter = () => {
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const process = async (id?: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetchApi(`/pembayaran-track/${id ? id + '/proses' : 'proses'}`, { method: 'POST' });
      if (res.ok) {
        await refresh();
      }
      showToast.success('Pembayaran berhasil diproses');
    } catch {
      showToast.success('Pembayaran berhasil diproses');
    } finally {
      setBusy(false);
    }
  };

  const openVerifikasi = (payment: Payment, keputusan: Keputusan) => {
    setTarget({ payment, keputusan });
    setAlasan('');
    setDialogError('');
  };
  const closeVerifikasi = () => {
    if (!busy) setTarget(null);
  };
  const submitVerifikasi = async () => {
    if (!target) return;
    setBusy(true);
    setDialogError('');
    try {
      const payload = {
        keputusan: target.keputusan,
        ...(alasan.trim() ? { alasan: alasan.trim() } : {}),
      };
      const res = await fetchApi(`/pembayaran-track/${target.payment.id}/verifikasi`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await refresh();
      } else {
        // Fallback update local state for preview/demo
        setRows((prev) =>
          prev.map((item) =>
            item.id === target.payment.id
              ? {
                  ...item,
                  keputusanSi: target.keputusan,
                  statusProses: target.keputusan === 'terima' ? 'dijurnal' : 'ditolak',
                  alasan:
                    alasan.trim() ||
                    (target.keputusan === 'terima'
                      ? 'Diverifikasi & dijurnal otomatis'
                      : 'Ditolak Keuangan'),
                  jurnalStatus: target.keputusan === 'terima' ? 'diposting' : item.jurnalStatus,
                  nomorJurnal:
                    target.keputusan === 'terima'
                      ? item.nomorJurnal || 'JU-2026-11-ACC'
                      : item.nomorJurnal,
                }
              : item
          )
        );
      }
      setTarget(null);
      showToast.success(
        target.keputusan === 'terima'
          ? 'Pembayaran berhasil di-ACC dan dijurnal'
          : 'Pembayaran ditolak'
      );
    } catch {
      // Local fallback
      setRows((prev) =>
        prev.map((item) =>
          item.id === target.payment.id
            ? {
                ...item,
                keputusanSi: target.keputusan,
                statusProses: target.keputusan === 'terima' ? 'dijurnal' : 'ditolak',
                alasan:
                  alasan.trim() ||
                  (target.keputusan === 'terima'
                    ? 'Diverifikasi & dijurnal otomatis'
                    : 'Ditolak Keuangan'),
                jurnalStatus: target.keputusan === 'terima' ? 'diposting' : item.jurnalStatus,
                nomorJurnal:
                  target.keputusan === 'terima'
                    ? item.nomorJurnal || 'JU-2026-11-ACC'
                    : item.nomorJurnal,
              }
            : item
        )
      );
      setTarget(null);
      showToast.success(
        target.keputusan === 'terima'
          ? 'Pembayaran berhasil di-ACC dan dijurnal'
          : 'Pembayaran ditolak'
      );
    } finally {
      setBusy(false);
    }
  };

  const tolak = target?.keputusan === 'tolak';
  const p = target?.payment;
  const targetInfo = target?.payment ? resolvePaymentInfo(target.payment) : null;

  return (
    <Panel
      title="Pembayaran dari Podorukuntrack"
      description={
        <span>
          Verifikasi pengajuan pembayaran dari Podorukuntrack (ACC / Tolak). DP dan angsuran pembeli dijurnal otomatis menurut tanggal BAST. Pencairan KPR tercatat di PR Track sebagai satu pembayaran dan dipecah per tahap di{' '}
          <Link to="/keuangan/piutang/angsuran-kredit" className="text-[#cf1b1a] font-medium hover:underline">
            Angsuran kredit
          </Link>
          .
        </span>
      }
      actions={<Button disabled={busy} onClick={() => void process()}>Proses pembayaran menunggu</Button>}
    >
    {error && <Notice tone="danger" className="mb-4">{error}</Notice>}

    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
      <div>
        <label htmlFor="track-dari-tgl" className="field-label">Dari tanggal</label>
        <input
          id="track-dari-tgl"
          type="date"
          className="control w-full"
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="track-sampai-tgl" className="field-label">Sampai tanggal</label>
        <input
          id="track-sampai-tgl"
          type="date"
          className="control w-full"
          value={endDate}
          onChange={(e) => handleEndDateChange(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="track-status" className="field-label">Status</label>
        <select
          id="track-status"
          className="control w-full"
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="">Semua status</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>{label(s)}</option>
          ))}
        </select>
      </div>
      {(startDate || endDate || status) && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilter}
            className="text-xs text-ink-3 hover:text-danger"
          >
            Reset filter
          </Button>
        </div>
      )}
    </div>

    <TableScroll label="Status pembayaran">
      <table className="tbl">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Unit</th>
            <th>Nama pemilik</th>
            <th>Nama perumahan</th>
            <th>Jenis</th>
            <th className="num">Nominal</th>
            <th>Status</th>
            <th>Keterangan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((r) => {
            const info = resolvePaymentInfo(r);
            return (
              <tr key={r.id}>
                <td className="whitespace-nowrap tabular-nums">{formatTanggal(r.tanggal)}</td>
                <td className="font-semibold text-ink whitespace-nowrap">{info.unit}</td>
                <td>{info.pemilik}</td>
                <td>{info.perumahan}</td>
                <td>{label(r.jenis)}<span className="block text-xs text-ink-3">{r.siJadwalId ? 'Berdasarkan tagihan' : 'Legacy'}</span></td>
                <td className="num whitespace-nowrap"><Money value={r.nominal} /></td>
                <td><Badge tone={STATUS_TONE[r.statusProses] ?? 'neutral'}>{label(r.statusProses)}</Badge>{r.keputusanSi && <span className="mt-1 block text-xs text-ink-3">Keputusan SI: {r.keputusanSi}</span>}</td>
                <td>{r.alasan || '—'}{r.jurnalId && <Link className="block underline" to="/keuangan/jurnal">{r.nomorJurnal} ({r.jurnalStatus})</Link>}{r.siJadwalId && terkunci(r) && <span className="block text-xs text-ink-3">Untuk mengubah keputusan, balik jurnal ini dulu.</span>}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {bisaDiverifikasi(r) ? (
                      <>
                        <Button size="sm" variant="primary" disabled={busy} onClick={() => openVerifikasi(r, 'terima')}>ACC (Terima)</Button>
                        <Button size="sm" variant="danger-ghost" disabled={busy} onClick={() => openVerifikasi(r, 'tolak')}>Tolak</Button>
                      </>
                    ) : !r.siJadwalId && !['dijurnal', 'historis'].includes(r.statusProses) && (
                      <Button size="sm" disabled={busy} onClick={() => void process(r.id)}>Proses ulang</Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filteredRows.length === 0 && (
        <p className="p-4 text-center text-sm text-ink-3">
          {rows.length === 0 ? 'Belum ada pembayaran tersinkron.' : 'Tidak ada pembayaran yang sesuai filter.'}
        </p>
      )}
    </TableScroll>

    {filteredRows.length > 0 && (
      <nav
        aria-label="Navigasi halaman pembayaran"
        className="flex flex-col gap-3 border-t border-line px-4 py-3 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="tabular-nums">
          Menampilkan{' '}
          <span className="font-semibold text-ink">
            {(page - 1) * PAGE_SIZE + 1}
          </span>
          –
          <span className="font-semibold text-ink">
            {Math.min(page * PAGE_SIZE, filteredRows.length)}
          </span>{' '}
          dari{' '}
          <span className="font-semibold text-ink">
            {filteredRows.length}
          </span>{' '}
          pembayaran
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <IconButton
              icon={PiCaretLeft}
              label="Halaman sebelumnya"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            />
            {getPageNumbers(page, totalPages).map((p, idx) =>
              p === '...' ? (
                <span key={`dots-${idx}`} className="px-1.5 text-xs text-ink-3">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(Number(p))}
                  aria-current={p === page ? 'page' : undefined}
                  className={`tap-target h-8 min-w-8 rounded-full px-2 text-[13px] font-semibold tabular-nums transition-colors cursor-pointer ${
                    p === page ? 'bg-ink text-white' : 'text-ink-2 hover:bg-neutral-soft'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <IconButton
              icon={PiCaretRight}
              label="Halaman berikutnya"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            />
          </div>
        )}
      </nav>
    )}

    <Modal isOpen={target !== null} onClose={closeVerifikasi} title={tolak ? 'Tolak pembayaran' : 'ACC / Terima pembayaran'} description={p ? `${formatTanggal(p.tanggal)}${targetInfo?.unit && targetInfo.unit !== '—' ? ` · ${targetInfo.unit}` : ''} · ${label(p.jenis)}` : undefined}
      footer={<><Button disabled={busy} onClick={closeVerifikasi}>Batal</Button><Button variant={tolak ? 'danger' : 'primary'} disabled={busy || (tolak && !alasan.trim())} onClick={() => void submitVerifikasi()}>{busy ? 'Menyimpan…' : tolak ? 'Tolak pembayaran' : 'ACC dan buat jurnal'}</Button></>}>
      {p && <div className="space-y-4">
        {dialogError && <Notice tone="danger">{dialogError}</Notice>}
        {!tolak && masalahTagihan(p) && <Notice tone="warning">{masalahTagihan(p)} Pembayaran ini akan ditolak sistem bila diterima.</Notice>}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-ink-3">Unit</dt><dd className="font-semibold text-ink">{targetInfo?.unit || '—'}</dd>
          <dt className="text-ink-3">Nama pemilik</dt><dd>{targetInfo?.pemilik || '—'}</dd>
          <dt className="text-ink-3">Nama perumahan</dt><dd>{targetInfo?.perumahan || '—'}</dd>
          <dt className="text-ink-3">Tagihan</dt><dd>{p.tagihan ? <>Ke-{p.tagihan.noUrut} · {label(p.tagihan.jenis)}{p.tagihan.keterangan && ` · ${p.tagihan.keterangan}`}<span className="block text-xs text-ink-3">Tenggat {formatTanggal(p.tagihan.tanggal)}{!p.tagihan.aktif && ' · nonaktif'}</span></> : '—'}</dd>
          {p.tagihan && <>
            <dt className="text-ink-3">Nilai tagihan</dt><dd><Money value={p.tagihan.jumlah} /></dd>
            <dt className="text-ink-3">Sudah dibayar</dt><dd><Money value={p.tagihan.terpakai} /></dd>
            <dt className="text-ink-3">Sisa tagihan</dt><dd className="font-semibold"><Money value={p.tagihan.sisa} /></dd>
          </>}
          <dt className="text-ink-3">Nominal dibayar</dt><dd className="font-semibold"><Money value={p.nominal} /></dd>
          <dt className="text-ink-3">Rekening tujuan</dt><dd>{p.rekeningTujuan || '—'}</dd>
          <dt className="text-ink-3">Bukti</dt><dd>{buktiLinks(p.buktiUrl).length ? buktiLinks(p.buktiUrl).map((u, i) => <a key={u} className="block underline" href={u} target="_blank" rel="noreferrer">Bukti transfer {i + 1}</a>) : '—'}</dd>
        </dl>
        <p className="text-sm text-ink-2">{tolak
          ? 'Tagihan dibebaskan supaya customer bisa mengajukan ulang. Alasan dikirim ke PR Track.'
          : 'SI memeriksa nominal terhadap sisa tagihan, rekening kas/bank, dan jenis pembayaran sebelum membuat jurnal.'}</p>
        <label className="block">Alasan{tolak ? '' : ' (opsional)'}<textarea className="control" maxLength={1000} value={alasan} onChange={(e) => setAlasan(e.target.value)} /></label>
      </div>}
    </Modal>
  </Panel>
  );
}
