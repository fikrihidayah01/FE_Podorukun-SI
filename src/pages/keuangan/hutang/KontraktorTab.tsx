import { Fragment, useMemo, useState } from 'react';
import { PiCaretRight, PiPlus, PiHardHat, PiFileText, PiCheckCircle, PiHandCoins } from 'react-icons/pi';
import { useKontrakStore, type Kontrak } from '../../../store/kontrakStore';
import { useProyekStore } from '../../../store/proyekStore';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Money from '../../../components/ui/Money';
import EmptyState from '../../../components/ui/EmptyState';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { StatGrid, StatTile } from '../../../components/ui/StatTile';
import { formatRupiah, formatTanggalPanjang } from '../../../utils/format';
import KontrakFormModal from './KontrakFormModal';
import AdendumFormModal from './AdendumFormModal';
import CatatPembayaranKontrakModal from './CatatPembayaranKontrakModal';

export default function KontraktorTab() {
  const { kontraks, adendums, pembayarans, cancelKontrak } = useKontrakStore();
  const proyeks = useProyekStore((s) => s.items);

  const [selectedProyek, setSelectedProyek] = useState('');
  const [selectedKontraktor, setSelectedKontraktor] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [isKontrakModalOpen, setIsKontrakModalOpen] = useState(false);
  const [adendumKontrak, setAdendumKontrak] = useState<Kontrak | null>(null);
  const [bayarKontrak, setBayarKontrak] = useState<Kontrak | null>(null);
  const [batalTarget, setBatalTarget] = useState<Kontrak | null>(null);

  const allKontraktors = Array.from(new Set(kontraks.map((k) => k.namaKontraktor)));

  const rows = useMemo(
    () =>
      kontraks
        .filter((k) => (!selectedProyek || k.proyekId === selectedProyek) && (!selectedKontraktor || k.namaKontraktor === selectedKontraktor))
        .map((k) => {
          const pRiwayat = pembayarans.filter((p) => p.kontrakId === k.id);
          const aRiwayat = adendums
            .filter((a) => a.kontrakId === k.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const nilaiTerkini = aRiwayat.length > 0 ? aRiwayat[0].nilaiBaru : k.nilaiKontrak;
          const terbayar = pRiwayat.reduce((sum, p) => sum + p.nominal, 0);
          return { ...k, nilaiTerkini, terbayar, sisa: nilaiTerkini - terbayar, pRiwayat, aRiwayat };
        }),
    [kontraks, adendums, pembayarans, selectedProyek, selectedKontraktor],
  );

  const total = rows.reduce(
    (acc, r) => ({ nilai: acc.nilai + r.nilaiTerkini, terbayar: acc.terbayar + r.terbayar, sisa: acc.sisa + r.sisa }),
    { nilai: 0, terbayar: 0, sisa: 0 },
  );

  return (
    <>
      <StatGrid columns={3}>
        <StatTile color="#1e293b" icon={PiFileText} label="Nilai kontrak" value={formatRupiah(total.nilai)} hint={`${rows.length} kontrak`} />
        <StatTile color="#0e6b45" icon={PiCheckCircle} label="Sudah dibayar (kas bon)" value={formatRupiah(total.terbayar)} />
        <StatTile emphasis color="#c2410c" icon={PiHandCoins} label="Sisa yang harus dibayar" value={formatRupiah(total.sisa)} />
      </StatGrid>

      <Panel
        title="Hutang ke kontraktor per kavling"
        description="Klik kavling untuk melihat riwayat kas bon, mencatat pembayaran, atau adendum."
        flush
        actions={
          <Button variant="primary" icon={PiPlus} onClick={() => setIsKontrakModalOpen(true)}>
            Tambah kontrak
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-3 border-b border-line px-4 py-3.5 sm:grid-cols-2 sm:px-5 lg:max-w-2xl">
          <div>
            <label htmlFor="f-k-proyek" className="field-label">Proyek</label>
            <select id="f-k-proyek" className="control" value={selectedProyek} onChange={(e) => setSelectedProyek(e.target.value)}>
              <option value="">Semua proyek</option>
              {proyeks.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-k-kontraktor" className="field-label">Kontraktor</label>
            <select id="f-k-kontraktor" className="control" value={selectedKontraktor} onChange={(e) => setSelectedKontraktor(e.target.value)}>
              <option value="">Semua kontraktor</option>
              {allKontraktors.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            compact
            icon={PiHardHat}
            title={kontraks.length === 0 ? 'Belum ada kontrak' : 'Tidak ada kontrak untuk filter ini'}
            description={kontraks.length === 0 ? 'Tambahkan SPK kontraktor. Hutang diakui penuh saat SPK disimpan.' : 'Ubah filter proyek atau kontraktor.'}
          />
        ) : (
          <TableScroll label="Hutang kontraktor per kavling">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Kavling</th>
                  <th scope="col">Tipe</th>
                  <th scope="col">Kontraktor</th>
                  <th scope="col" className="num">Nilai kontrak</th>
                  <th scope="col" className="num">Kas bon</th>
                  <th scope="col" className="num">Sisa</th>
                  <th scope="col">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const open = expandedRow === row.id;
                  return (
                    <Fragment key={row.id}>
                      <tr className={open ? '[&>td]:bg-subtle [&>td]:border-b-0' : ''}>
                        <td>
                          <button
                            type="button"
                            onClick={() => setExpandedRow(open ? null : row.id)}
                            aria-expanded={open}
                            aria-controls={`kontrak-${row.id}`}
                            className="-ml-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-semibold text-ink hover:bg-neutral-soft"
                          >
                            <PiCaretRight className={`h-4 w-4 text-ink-3 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden />
                            {row.kavling || '-'}
                          </button>
                        </td>
                        <td>{row.tipe || '-'}</td>
                        <td className="font-medium text-ink">
                          {row.namaKontraktor}
                          {row.status === 'batal' && <Badge tone="danger" className="ml-2">Dibatalkan</Badge>}
                        </td>
                        <td className="num font-semibold text-ink"><Money value={row.nilaiTerkini} /></td>
                        <td className="num"><Money value={row.terbayar} /></td>
                        <td className="num font-semibold text-ink"><Money value={row.sisa} /></td>
                        <td className="max-w-[240px] truncate" title={row.keterangan}>{row.keterangan || '-'}</td>
                      </tr>

                      {open && (
                        <tr id={`kontrak-${row.id}`} className="[&>td]:bg-subtle">
                          <td colSpan={7} className="!px-4 !pb-5 !pt-1 sm:!pl-11">
                            <div className="max-w-3xl space-y-4">
                              <p className="text-[13px] text-ink-3">
                                SPK {row.noSpk}, {formatTanggalPanjang(row.tanggalSpk)}
                              </p>
                              {row.pRiwayat.length === 0 && row.aRiwayat.length === 0 ? (
                                <p className="text-sm text-ink-3">Belum ada pembayaran atau adendum.</p>
                              ) : (
                                <ul className="divide-y divide-line rounded-lg border border-line bg-surface text-sm">
                                  {row.aRiwayat.map((a) => (
                                    <li key={a.id} className="flex flex-col gap-1 px-3.5 py-2.5 sm:flex-row sm:items-center sm:gap-4">
                                      <span className="w-28 shrink-0 tabular-nums text-ink-3">{formatTanggalPanjang(a.tanggal)}</span>
                                      <span className="flex-1 text-ink-2">
                                        <Badge tone="warning" className="mr-2">Adendum</Badge>
                                        {a.alasan}
                                      </span>
                                      <span className="font-semibold text-ink">
                                        Nilai baru <Money value={a.nilaiBaru} />
                                      </span>
                                    </li>
                                  ))}
                                  {row.pRiwayat.map((p) => (
                                    <li key={p.id} className="flex flex-col gap-1 px-3.5 py-2.5 sm:flex-row sm:items-center sm:gap-4">
                                      <span className="w-28 shrink-0 tabular-nums text-ink-3">{formatTanggalPanjang(p.tanggal)}</span>
                                      <span className="flex-1 text-ink-2">{p.keterangan || p.noBukti}</span>
                                      <Money value={p.nominal} className="font-semibold text-ink" />
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {row.status !== 'batal' && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button size="sm" icon={PiPlus} onClick={() => setBayarKontrak(row)}>
                                    Catat pembayaran
                                  </Button>
                                  <Button size="sm" icon={PiPlus} onClick={() => setAdendumKontrak(row)}>
                                    Adendum
                                  </Button>
                                  <Button size="sm" variant="danger-ghost" className="sm:ml-auto" onClick={() => setBatalTarget(row)}>
                                    Batalkan kontrak
                                  </Button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Total</td>
                  <td className="num"><Money value={total.nilai} /></td>
                  <td className="num"><Money value={total.terbayar} /></td>
                  <td className="num"><Money value={total.sisa} /></td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </TableScroll>
        )}
      </Panel>

      <KontrakFormModal isOpen={isKontrakModalOpen} onClose={() => setIsKontrakModalOpen(false)} />
      {adendumKontrak && <AdendumFormModal isOpen kontrak={adendumKontrak} onClose={() => setAdendumKontrak(null)} />}
      {bayarKontrak && <CatatPembayaranKontrakModal isOpen kontrak={bayarKontrak} onClose={() => setBayarKontrak(null)} />}
      <ConfirmDialog
        isOpen={batalTarget !== null}
        onClose={() => setBatalTarget(null)}
        onConfirm={() => batalTarget && cancelKontrak(batalTarget.id)}
        title="Batalkan kontrak"
        message={`Batalkan kontrak ${batalTarget?.noSpk ?? ''} untuk kavling ${batalTarget?.kavling ?? ''}? Kontrak tidak bisa menerima pembayaran atau adendum lagi.`}
        confirmLabel="Batalkan kontrak"
      />
    </>
  );
}
