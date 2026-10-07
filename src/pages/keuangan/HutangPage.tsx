import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PiPlus, PiLockSimple, PiLockSimpleOpen, PiArrowSquareOut, PiHandCoins, PiMapTrifold, PiBank, PiCalendarCheck } from 'react-icons/pi';
import PageHeader, { PageBody } from '../../components/ui/PageHeader';
import TabBar, { TabPanel } from '../../components/ui/TabBar';
import Panel, { TableScroll } from '../../components/ui/Panel';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Money from '../../components/ui/Money';
import EmptyState from '../../components/ui/EmptyState';
import { StatGrid, StatTile } from '../../components/ui/StatTile';
import ExportButton from '../../components/ui/ExportButton';
import {
  useHutangStore,
  KATEGORI_HUTANG_LABELS,
  type KategoriHutang,
  type SaldoKodePembantu,
} from '../../store/hutangStore';
import { useProyekStore } from '../../store/proyekStore';
import { usePinjamanBankStore } from '../../store/pinjamanBankStore';
import { buildFilename } from '../../utils/exportUtils';
import { bulanIni, formatBulan, formatRupiahShort, opsiBulan } from '../../utils/format';
import { KATEGORI_HUTANG_HEX, MODULE_ACCENT } from '../../config/theme';
import InputMutasiModal from './hutang/InputMutasiModal';
import AntarProyekTab from './hutang/AntarProyekTab';
import PinjamanBankTab from './hutang/PinjamanBankTab';
import AgunanShmTab from './hutang/AgunanShmTab';
import KontraktorTab from './hutang/KontraktorTab';
import SaldoBerjalanDetailModal from './hutang/SaldoBerjalanDetailModal';

const TABS = [
  { key: 'saldo', label: 'Saldo berjalan' },
  { key: 'antar_proyek', label: 'Antar proyek' },
  { key: 'pinjaman_bank', label: 'Pinjaman bank' },
  { key: 'agunan', label: 'Dokumen legal' },
  { key: 'kontraktor', label: 'Kontraktor' },
];

export default function HutangPage() {
  const { getSaldoPerKodePembantu } = useHutangStore();
  const { items: proyeks } = useProyekStore();
  const { getDueReminders } = usePinjamanBankStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedProyek, setSelectedProyek] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<KategoriHutang | ''>('');
  const [selectedBulan, setSelectedBulan] = useState(bulanIni());
  // Simulasi status periode sampai backend menyediakan status tutup buku
  const [isPeriodeTerkunci, setIsPeriodeTerkunci] = useState(false);

  const [inputOpen, setInputOpen] = useState(false);
  const [selectedJurnalRow, setSelectedJurnalRow] = useState<SaldoKodePembantu | null>(null);

  const tabParam = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.key === tabParam) ? tabParam! : 'saldo';
  const setActiveTab = (key: string) => setSearchParams(key === 'saldo' ? {} : { tab: key }, { replace: true });

  const monthOptions = useMemo(() => opsiBulan(), []);
  const periodeLabel = formatBulan(selectedBulan);
  const proyekNama = (id?: string) => proyeks.find((p) => p.id === id)?.nama;

  // Dihitung langsung: komponen berlangganan seluruh store, jadi render ulang setiap ada mutasi baru
  const saldoData = getSaldoPerKodePembantu(selectedBulan, selectedProyek || undefined, selectedKategori || undefined);
  const semuaSaldo = getSaldoPerKodePembantu(selectedBulan, selectedProyek || undefined);
  const dueReminders = getDueReminders(7);

  const totalOf = (rows: SaldoKodePembantu[], kat?: KategoriHutang) =>
    rows.filter((r) => !kat || r.kodePembantu.kategori === kat).reduce((s, r) => s + r.saldoAkhir, 0);

  const totals = {
    saldoAwal: saldoData.reduce((s, r) => s + r.saldoAwal, 0),
    mutasi: saldoData.reduce((s, r) => s + r.mutasiBulan, 0),
    saldoAkhir: totalOf(saldoData),
  };

  const rekapKategori = (Object.keys(KATEGORI_HUTANG_LABELS) as KategoriHutang[]).map((kat) => ({
    kat,
    total: totalOf(semuaSaldo, kat),
  }));

  return (
    <>
      <PageHeader
        title="Hutang"
        description={`Periode ${periodeLabel}`}
        status={
          <button
            type="button"
            onClick={() => setIsPeriodeTerkunci((v) => !v)}
            aria-pressed={isPeriodeTerkunci}
            title="Simulasi: klik untuk mengunci atau membuka periode"
            className="rounded-md"
          >
            <Badge tone={isPeriodeTerkunci ? 'warning' : 'positive'}>
              {isPeriodeTerkunci ? <PiLockSimple aria-hidden /> : <PiLockSimpleOpen aria-hidden />}
              {isPeriodeTerkunci ? 'Periode terkunci' : 'Periode terbuka'}
            </Badge>
          </button>
        }
        actions={
          <Button variant="primary" icon={PiPlus} onClick={() => setInputOpen(true)}>
            Input mutasi
          </Button>
        }
        tabs={<TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} idPrefix="hutang" label="Bagian hutang" />}
      />

      <PageBody>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-3xl">
          <div>
            <label htmlFor="f-proyek" className="field-label">Proyek</label>
            <select id="f-proyek" className="control" value={selectedProyek} onChange={(e) => setSelectedProyek(e.target.value)}>
              <option value="">Semua proyek</option>
              {proyeks.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-kategori" className="field-label">Kategori</label>
            <select
              id="f-kategori"
              className="control"
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value as KategoriHutang | '')}
            >
              <option value="">Semua kategori</option>
              {(Object.keys(KATEGORI_HUTANG_LABELS) as KategoriHutang[]).map((k) => (
                <option key={k} value={k}>{KATEGORI_HUTANG_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="f-bulan" className="field-label">Periode</label>
            <select id="f-bulan" className="control" value={selectedBulan} onChange={(e) => setSelectedBulan(e.target.value)}>
              {monthOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <StatGrid>
          <StatTile
            emphasis
            color={MODULE_ACCENT['/keuangan/hutang']}
            icon={PiHandCoins}
            label="Total hutang"
            value={formatRupiahShort(totalOf(semuaSaldo))}
            hint={selectedProyek ? proyekNama(selectedProyek) : 'Semua proyek'}
          />
          <StatTile color={KATEGORI_HUTANG_HEX.lahan} icon={PiMapTrifold} label="Hutang lahan" value={formatRupiahShort(totalOf(semuaSaldo, 'lahan'))} />
          <StatTile color={KATEGORI_HUTANG_HEX.bank} icon={PiBank} label="Hutang bank" value={formatRupiahShort(totalOf(semuaSaldo, 'bank'))} />
          <StatTile
            color="#b45309"
            icon={PiCalendarCheck}
            label="Jatuh tempo 7 hari"
            value={`${dueReminders.length} tagihan`}
            tone={dueReminders.length > 0 ? 'warning' : 'default'}
            hint={dueReminders[0] ? `Terdekat ${dueReminders[0].tanggalFormatted}` : 'Tidak ada pinjaman bank jatuh tempo'}
          />
        </StatGrid>

        <TabPanel idPrefix="hutang" activeTab={activeTab}>
          {activeTab === 'saldo' && (
            <>
              <Panel
                title="Saldo berjalan per kode pembantu"
                description="Angka dihitung dari jurnal. Klik nilai mutasi untuk melihat jurnal pembentuknya."
                flush
                actions={
                  <ExportButton
                    getColumns={() => [
                      { header: 'Kode Pembantu', key: 'kodePembantu', width: 30 },
                      { header: 'Proyek', key: 'proyek', width: 18 },
                      { header: 'Kategori', key: 'kategori', width: 16 },
                      { header: 'Saldo Awal', key: 'saldoAwal', isNumber: true, width: 18 },
                      { header: 'Total Debit', key: 'totalDebit', isNumber: true, width: 18 },
                      { header: 'Total Kredit', key: 'totalKredit', isNumber: true, width: 18 },
                      { header: 'Mutasi', key: 'mutasiBulan', isNumber: true, width: 18 },
                      { header: 'Saldo Akhir', key: 'saldoAkhir', isNumber: true, width: 18 },
                    ]}
                    getData={() => [
                      ...saldoData.map((s) => ({
                        kodePembantu: s.kodePembantu.nama,
                        proyek: proyekNama(s.kodePembantu.proyekId) ?? '',
                        kategori: KATEGORI_HUTANG_LABELS[s.kodePembantu.kategori],
                        saldoAwal: s.saldoAwal,
                        totalDebit: s.totalDebit,
                        totalKredit: s.totalKredit,
                        mutasiBulan: s.mutasiBulan,
                        saldoAkhir: s.saldoAkhir,
                      })),
                      {
                        kodePembantu: 'TOTAL',
                        proyek: '',
                        kategori: '',
                        saldoAwal: totals.saldoAwal,
                        totalDebit: saldoData.reduce((s, r) => s + r.totalDebit, 0),
                        totalKredit: saldoData.reduce((s, r) => s + r.totalKredit, 0),
                        mutasiBulan: totals.mutasi,
                        saldoAkhir: totals.saldoAkhir,
                      },
                    ]}
                    opts={{
                      namaLaporan: 'Laporan Hutang: Saldo Berjalan',
                      proyek: proyekNama(selectedProyek) ?? 'Semua Proyek',
                      periode: periodeLabel,
                      filenameBase: buildFilename('Saldo_Berjalan', proyekNama(selectedProyek), periodeLabel),
                    }}
                  />
                }
              >
                {saldoData.length === 0 ? (
                  <EmptyState
                    compact
                    icon={PiHandCoins}
                    title="Tidak ada kode pembantu untuk filter ini"
                    description="Ubah proyek atau kategori, atau catat mutasi baru lewat tombol Input mutasi."
                  />
                ) : (
                  <TableScroll label="Saldo berjalan per kode pembantu">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th scope="col">Kode pembantu</th>
                          <th scope="col">Kategori</th>
                          <th scope="col" className="num">Saldo awal</th>
                          <th scope="col" className="num">Mutasi bulan ini</th>
                          <th scope="col" className="num">Saldo akhir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saldoData.map((row) => (
                          <tr key={row.kodePembantu.id}>
                            <td>
                              <Link
                                to={`/keuangan/hutang/detail/${row.kodePembantu.id}`}
                                className="font-semibold text-ink underline-offset-2 hover:text-brand-700 hover:underline"
                              >
                                {row.kodePembantu.nama}
                              </Link>
                              <p className="mt-0.5 text-xs text-ink-3">{proyekNama(row.kodePembantu.proyekId)}</p>
                            </td>
                            <td>
                              <Badge color={KATEGORI_HUTANG_HEX[row.kodePembantu.kategori]}>{KATEGORI_HUTANG_LABELS[row.kodePembantu.kategori]}</Badge>
                            </td>
                            <td className="num">{row.saldoAwal ? <Money value={row.saldoAwal} /> : <span className="text-ink-3">-</span>}</td>
                            <td className="num">
                              <button
                                type="button"
                                onClick={() => setSelectedJurnalRow(row)}
                                className="group inline-flex items-center gap-1.5 rounded-md font-medium text-ink hover:text-brand-700 underline-offset-2 hover:underline"
                                aria-label={`Lihat jurnal pembentuk mutasi ${row.kodePembantu.nama}`}
                              >
                                {row.mutasiBulan === 0 ? <span className="text-ink-3">-</span> : <Money value={row.mutasiBulan} signed />}
                                <PiArrowSquareOut className="h-3.5 w-3.5 text-ink-3 opacity-60 group-hover:opacity-100" aria-hidden />
                              </button>
                            </td>
                            <td className="num font-semibold text-ink">
                              <Money value={row.saldoAkhir} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2}>Total</td>
                          <td className="num"><Money value={totals.saldoAwal} /></td>
                          <td className="num"><Money value={totals.mutasi} signed /></td>
                          <td className="num"><Money value={totals.saldoAkhir} /></td>
                        </tr>
                      </tfoot>
                    </table>
                  </TableScroll>
                )}
              </Panel>

              <Panel title="Komposisi hutang per kategori" description={`Saldo akhir ${periodeLabel}, ${proyekNama(selectedProyek) ?? 'semua proyek'}`} flush>
                {(() => {
                  const positif = rekapKategori.filter((r) => r.total > 0);
                  const sum = positif.reduce((s, r) => s + r.total, 0);
                  return (
                    <>
                      {sum > 0 && (
                        <div className="px-4 pt-4 sm:px-5">
                          <div
                            className="flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full"
                            role="img"
                            aria-label={`Komposisi hutang: ${positif
                              .map((r) => `${KATEGORI_HUTANG_LABELS[r.kat]} ${Math.round((r.total / sum) * 100)}%`)
                              .join(', ')}`}
                          >
                            {positif.map((r) => (
                              <span key={r.kat} style={{ width: `${(r.total / sum) * 100}%`, backgroundColor: KATEGORI_HUTANG_HEX[r.kat] }} />
                            ))}
                          </div>
                        </div>
                      )}
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-4 py-4 sm:grid-cols-4 sm:px-5 xl:grid-cols-7">
                        {rekapKategori.map(({ kat, total }) => (
                          <div key={kat} className="min-w-0">
                            <dt className="flex items-center gap-2 text-[13px] font-semibold text-ink-3">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: KATEGORI_HUTANG_HEX[kat] }} aria-hidden />
                              {KATEGORI_HUTANG_LABELS[kat]}
                            </dt>
                            <dd className={`mt-1 text-base font-bold tabular-nums ${total === 0 ? 'text-ink-3' : 'text-ink'}`}>
                              {formatRupiahShort(total)}
                              {sum > 0 && total > 0 && (
                                <span className="ml-1.5 text-xs font-semibold text-ink-3">{Math.round((total / sum) * 100)}%</span>
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  );
                })()}
              </Panel>
            </>
          )}

          {activeTab === 'antar_proyek' && <AntarProyekTab selectedProyekId={selectedProyek} selectedBulan={periodeLabel} />}
          {activeTab === 'pinjaman_bank' && <PinjamanBankTab selectedProyekId={selectedProyek} selectedBulan={periodeLabel} />}
          {activeTab === 'agunan' && <AgunanShmTab selectedProyekId={proyekNama(selectedProyek)} selectedBulan={periodeLabel} />}
          {activeTab === 'kontraktor' && <KontraktorTab />}
        </TabPanel>
      </PageBody>

      <InputMutasiModal isOpen={inputOpen} onClose={() => setInputOpen(false)} />

      <SaldoBerjalanDetailModal
        isOpen={selectedJurnalRow !== null}
        onClose={() => setSelectedJurnalRow(null)}
        rowData={selectedJurnalRow}
        periodeLabel={periodeLabel}
        selectedBulan={selectedBulan}
        isPeriodeTerkunci={isPeriodeTerkunci}
      />
    </>
  );
}
