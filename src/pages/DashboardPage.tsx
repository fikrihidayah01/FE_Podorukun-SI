import { Link } from 'react-router-dom';
import {
  PiHandCoins,
  PiBank,
  PiReceipt,
  PiNotebook,
  PiCaretRight,
  PiCheckCircle,
  PiHourglassMedium,
  PiCalendarCheck,
  PiBuildings,
} from 'react-icons/pi';
import { useAuthStore, ROLE_LABELS, type UserRole } from '../store/authStore';
import { useHutangStore, KATEGORI_HUTANG_LABELS, type KategoriHutang } from '../store/hutangStore';
import { usePiutangStore } from '../store/piutangStore';
import { usePinjamanBankStore } from '../store/pinjamanBankStore';
import { useJurnalStore } from '../store/jurnalStore';
import { useProyekStore } from '../store/proyekStore';
import menuConfig from '../config/menuConfig';
import { KATEGORI_HUTANG_HEX, MODULE_ACCENT, shade, tint } from '../config/theme';
import PageHeader, { PageBody } from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Money from '../components/ui/Money';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { StatGrid, StatTile } from '../components/ui/StatTile';
import { bulanIni, formatBulan, formatRupiahShort } from '../utils/format';

const HUTANG = MODULE_ACCENT['/keuangan/hutang'];
const PIUTANG = MODULE_ACCENT['/keuangan/piutang'];
const JURNAL = MODULE_ACCENT['/keuangan/jurnal'];

function sapaan() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/** Donat komposisi; tiap irisan diberi warna kategori yang sama dengan badge di halaman Hutang. */
function Donut({ parts, total }: { parts: { key: string; value: number; color: string }[]; total: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="h-44 w-44 shrink-0 -rotate-90" aria-hidden>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#eef1f4" strokeWidth="18" />
      {total > 0 &&
        parts.map((p) => {
          const len = (p.value / total) * c;
          const el = (
            <circle
              key={p.key}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth="18"
              strokeDasharray={`${Math.max(len - 2, 0)} ${c}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
    </svg>
  );
}

function KeuanganDashboard() {
  const bulan = bulanIni();
  const { getSaldoPerKodePembantu } = useHutangStore();
  const kavlings = usePiutangStore((s) => s.items);
  const { pinjamans, getDueReminders } = usePinjamanBankStore();
  const jurnals = useJurnalStore((s) => s.items);
  const proyeks = useProyekStore((s) => s.items);
  const proyekNama = (id: string) => proyeks.find((p) => p.id === id)?.nama ?? id;

  const saldo = getSaldoPerKodePembantu(bulan);
  const totalHutang = saldo.reduce((s, r) => s + r.saldoAkhir, 0);
  const mutasiBulan = saldo.reduce((s, r) => s + r.mutasiBulan, 0);

  const perKategori = (Object.keys(KATEGORI_HUTANG_LABELS) as KategoriHutang[])
    .map((k) => ({
      key: k,
      label: KATEGORI_HUTANG_LABELS[k],
      color: KATEGORI_HUTANG_HEX[k],
      value: saldo.filter((r) => r.kodePembantu.kategori === k).reduce((s, r) => s + r.saldoAkhir, 0),
    }))
    .filter((k) => k.value > 0)
    .sort((a, b) => b.value - a.value);
  const totalPositif = perKategori.reduce((s, k) => s + k.value, 0);

  const perProyek = proyeks
    .map((p) => ({ ...p, value: saldo.filter((r) => r.kodePembantu.proyekId === p.id).reduce((s, r) => s + r.saldoAkhir, 0) }))
    .sort((a, b) => b.value - a.value);
  const maxProyek = Math.max(1, ...perProyek.map((p) => p.value));

  const pinjamanAktif = pinjamans.filter((p) => p.status === 'aktif');
  const sisaPokokBank = pinjamanAktif.reduce((s, p) => s + p.sisaPokok, 0);
  const totalPencairan = pinjamanAktif.reduce((s, p) => s + p.totalPencairan, 0);
  const reminders = getDueReminders(30);
  const drafts = jurnals.filter((j) => j.status === 'draft');

  const now = new Date();
  const tagihan = kavlings
    .filter((k) => k.statusBast === 'belum_bast')
    .map((k) => {
      const dibayar = k.periodeAngsuran.reduce((s, p) => s + p.dibayar, 0);
      const tunggakan = k.periodeAngsuran
        .filter((p) => new Date(p.tanggalJatuhTempo) < now)
        .reduce((s, p) => s + Math.max(0, p.tagihan - p.dibayar), 0);
      return { k, dibayar, sisa: Math.max(0, k.nilaiSppr - dibayar), tunggakan, pct: k.nilaiSppr ? dibayar / k.nilaiSppr : 0 };
    })
    .sort((a, b) => b.tunggakan - a.tunggakan);
  const totalSppr = tagihan.reduce((s, t) => s + t.k.nilaiSppr, 0);
  const totalDibayar = tagihan.reduce((s, t) => s + t.dibayar, 0);
  const totalTunggakan = tagihan.reduce((s, t) => s + t.tunggakan, 0);
  const pctTertagih = totalSppr ? Math.round((totalDibayar / totalSppr) * 100) : 0;

  return (
    <>
      <StatGrid>
        <StatTile
          emphasis
          color={HUTANG}
          icon={PiHandCoins}
          label="Total hutang"
          value={formatRupiahShort(totalHutang)}
          hint={mutasiBulan === 0 ? 'Belum ada mutasi bulan ini' : `${mutasiBulan > 0 ? 'Naik' : 'Turun'} ${formatRupiahShort(Math.abs(mutasiBulan))} bulan ini`}
        />
        <StatTile
          color={KATEGORI_HUTANG_HEX.bank}
          icon={PiBank}
          label="Sisa pokok bank"
          value={formatRupiahShort(sisaPokokBank)}
          hint={`${pinjamanAktif.length} pinjaman, ${totalPencairan ? Math.round((1 - sisaPokokBank / totalPencairan) * 100) : 0}% pokok terbayar`}
        />
        <StatTile color={PIUTANG} icon={PiReceipt} label="Sisa tagihan user" value={formatRupiahShort(totalSppr - totalDibayar)} hint={`${pctTertagih}% dari SPPR sudah tertagih`} />
        <StatTile
          color={totalTunggakan > 0 ? '#b42318' : PIUTANG}
          icon={PiHourglassMedium}
          label="Tunggakan lewat jatuh tempo"
          value={formatRupiahShort(totalTunggakan)}
          tone={totalTunggakan > 0 ? 'danger' : 'default'}
          hint={`${tagihan.filter((t) => t.tunggakan > 0).length} kavling menunggak`}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel
          title="Komposisi hutang"
          description={`Saldo akhir ${formatBulan(bulan)} per kategori`}
          actions={
            <Link to="/keuangan/hutang" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:underline">
              Lihat hutang <PiCaretRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        >
          {totalPositif === 0 ? (
            <EmptyState compact icon={PiHandCoins} title="Belum ada saldo hutang" description="Saldo muncul setelah mutasi hutang dicatat." />
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <div className="relative">
                <Donut parts={perKategori} total={totalPositif} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-semibold text-ink-3">Total</span>
                  <span className="text-lg font-bold tabular-nums text-ink">{formatRupiahShort(totalPositif)}</span>
                </div>
              </div>
              <ul className="w-full flex-1 space-y-2.5" aria-label="Komposisi hutang per kategori">
                {perKategori.map((k) => {
                  const pct = Math.round((k.value / totalPositif) * 100);
                  return (
                    <li key={k.key}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 font-medium text-ink-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: k.color }} aria-hidden />
                          {k.label}
                        </span>
                        <span className="tabular-nums">
                          <span className="font-semibold text-ink">{formatRupiahShort(k.value)}</span>
                          <span className="ml-2 inline-block w-9 text-right text-xs font-semibold text-ink-3">{pct}%</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: tint(k.color, 14) }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: k.color }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Jatuh tempo 30 hari" description="Bunga dan pokok pinjaman bank" flush>
          {reminders.length === 0 ? (
            <EmptyState compact icon={PiCalendarCheck} title="Tidak ada jatuh tempo" description="Tidak ada bunga atau pokok bank yang jatuh tempo dalam 30 hari." />
          ) : (
            <ol className="px-4 py-4 sm:px-5">
              {reminders.map((r, i) => {
                const [dd, mm] = r.tanggalFormatted.split('/');
                const urgent = r.hariLagi <= 7;
                const color = urgent ? '#b42318' : r.hariLagi <= 14 ? '#b45309' : KATEGORI_HUTANG_HEX.bank;
                return (
                  <li key={`${r.pinjaman.id}-${r.jenis}`} className="relative flex gap-4 pb-4 last:pb-0">
                    {i < reminders.length - 1 && <span className="absolute left-[23px] top-12 h-[calc(100%-44px)] w-px bg-line" aria-hidden />}
                    <span
                      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl leading-none text-white shadow-sm"
                      style={{ backgroundImage: `linear-gradient(160deg, ${color}, ${shade(color, 70)})` }}
                    >
                      <span className="text-base font-bold tabular-nums">{dd}</span>
                      <span className="mt-0.5 text-[10px] font-semibold uppercase opacity-90">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][Number(mm) - 1]}
                      </span>
                    </span>
                    <Link to="/keuangan/hutang?tab=pinjaman_bank" className="group min-w-0 flex-1 rounded-lg pt-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink group-hover:text-brand-700">{r.pinjaman.namaBank}</span>
                        <Badge tone={r.jenis === 'pokok' ? 'brand' : 'neutral'}>{r.jenis === 'pokok' ? 'Pokok' : 'Bunga'}</Badge>
                      </span>
                      <span className="mt-0.5 block text-[13px]" style={{ color: urgent ? '#b42318' : undefined }}>
                        <span className={urgent ? 'font-semibold' : 'text-ink-3'}>
                          {r.hariLagi === 0 ? 'Hari ini' : `${r.hariLagi} hari lagi`}
                        </span>
                        <span className="text-ink-3">, {proyekNama(r.pinjaman.proyekId)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel
          title="Progres penagihan per kavling"
          description="Kavling belum serah terima, diurutkan dari tunggakan terbesar"
          actions={
            <Link to="/keuangan/piutang" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:underline">
              Lihat tagihan <PiCaretRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        >
          {tagihan.length === 0 ? (
            <EmptyState compact icon={PiReceipt} title="Tidak ada tagihan aktif" description="Semua kavling sudah serah terima." />
          ) : (
            <>
              <div className="mb-5 flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor: tint(PIUTANG, 9) }}>
                <div className="relative h-14 w-14 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
                    <circle cx="18" cy="18" r="15" fill="none" stroke={tint(PIUTANG, 25)} strokeWidth="4" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke={PIUTANG} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(pctTertagih / 100) * 94.2} 94.2`} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums" style={{ color: shade(PIUTANG) }}>
                    {pctTertagih}%
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-semibold" style={{ color: shade(PIUTANG) }}>
                    {formatRupiahShort(totalDibayar)} tertagih dari {formatRupiahShort(totalSppr)}
                  </p>
                  <p className="mt-0.5 text-ink-2">Sisa {formatRupiahShort(totalSppr - totalDibayar)} dari {tagihan.length} kavling</p>
                </div>
              </div>
              <ul className="space-y-4">
                {tagihan.map((t) => {
                  const pct = Math.round(t.pct * 100);
                  const tunggakPct = t.k.nilaiSppr ? (t.tunggakan / t.k.nilaiSppr) * 100 : 0;
                  return (
                    <li key={t.k.id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate text-sm">
                          <span className="font-semibold text-ink">{t.k.namaUser}</span>
                          <span className="text-ink-3"> {t.k.nomorKavling}, {proyekNama(t.k.proyekId)}</span>
                        </p>
                        {t.tunggakan > 0 ? (
                          <Badge tone="danger">Tunggak {formatRupiahShort(t.tunggakan)}</Badge>
                        ) : t.sisa === 0 ? (
                          <Badge tone="positive">Lunas</Badge>
                        ) : (
                          <span className="text-xs font-semibold text-ink-3">Lancar</span>
                        )}
                      </div>
                      <div
                        className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-neutral-soft"
                        role="img"
                        aria-label={`${pct}% terbayar${t.tunggakan ? `, tunggakan ${formatRupiahShort(t.tunggakan)}` : ''}`}
                      >
                        <span style={{ width: `${pct}%`, backgroundColor: PIUTANG }} />
                        {tunggakPct > 0 && <span style={{ width: `${tunggakPct}%`, backgroundColor: '#e5484d' }} />}
                      </div>
                      <p className="mt-1 text-xs tabular-nums text-ink-3">
                        {pct}% terbayar, sisa {formatRupiahShort(t.sisa)}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 flex flex-wrap gap-4 text-xs text-ink-3">
                <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm" style={{ backgroundColor: PIUTANG }} />Terbayar</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-[#e5484d]" />Tunggakan</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-neutral-soft ring-1 ring-line" />Belum jatuh tempo</span>
              </p>
            </>
          )}
        </Panel>

        <div className="space-y-5 lg:space-y-6">
          <Panel title="Hutang per proyek" description={`Saldo akhir ${formatBulan(bulan)}`}>
            <ul className="space-y-3.5">
              {perProyek.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ backgroundColor: tint(HUTANG, 12), color: shade(HUTANG, 85) }}>
                    {p.kode}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-ink">{p.nama}</span>
                      <Money value={p.value} short className="font-semibold text-ink" />
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-soft">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(2, (p.value / maxProyek) * 100)}%`, backgroundImage: `linear-gradient(90deg, ${tint(HUTANG, 60)}, ${HUTANG})` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Jurnal" description={`${jurnals.length} jurnal tercatat`} flush>
            {drafts.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: tint('#0e6b45', 14), color: '#0e6b45' }}>
                  <PiCheckCircle className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-sm text-ink-2">Tidak ada jurnal draft. Semua sudah masuk saldo berjalan.</p>
              </div>
            ) : (
              <Link to="/keuangan/jurnal" className="group flex items-center gap-3 px-4 py-4 hover:bg-subtle sm:px-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: JURNAL }}>
                  <PiNotebook className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex-1 text-sm">
                  <span className="font-semibold text-ink">{drafts.length} jurnal masih draft</span>
                  <span className="block text-ink-3">Belum masuk saldo berjalan sampai diposting</span>
                </span>
                <PiCaretRight className="h-4 w-4 text-ink-3 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function BelumTersedia({ role }: { role: UserRole }) {
  const pages = menuConfig[role].flatMap((g) => g.items).filter((i) => i.path !== '/dashboard');
  return (
    <Panel>
      <EmptyState
        icon={PiBuildings}
        title={`Dashboard ${ROLE_LABELS[role]} belum tersedia`}
        description="Modul untuk peran ini masih dalam pengembangan. Ringkasan akan muncul di sini setelah datanya terhubung."
        action={
          <ul className="flex flex-wrap gap-2 sm:justify-center">
            {pages.map((p) => (
              <li key={p.path}>
                <Link to={p.path} className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong/70 px-3 text-sm font-semibold text-ink hover:bg-subtle">
                  <p.icon className="h-4 w-4 text-ink-3" aria-hidden />
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        }
      />
    </Panel>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role;
  const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <PageHeader title={`${sapaan()}, ${user?.name?.split(' ')[0] ?? ''}`} description={`${tanggal}. Ringkasan posisi keuangan semua proyek.`} />
      <PageBody>{role === 'keuangan' ? <KeuanganDashboard /> : role ? <BelumTersedia role={role} /> : null}</PageBody>
    </>
  );
}
