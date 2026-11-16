import { useEffect, useMemo, useState } from 'react';
import { PiHouseLine, PiFileText, PiHandCoins, PiHourglassMedium } from 'react-icons/pi';
import { usePiutangStore, TIPE_TRANSAKSI_LABELS, type KavlingTagihan } from '../../../store/piutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import Badge from '../../../components/ui/Badge';
import Money from '../../../components/ui/Money';
import Notice from '../../../components/ui/Notice';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import ExportButton from '../../../components/ui/ExportButton';
import { StatGrid, StatTile } from '../../../components/ui/StatTile';
import { KATEGORI_HUTANG_HEX } from '../../../config/theme';
import { buildFilename } from '../../../utils/exportUtils';
import { bulanIni, formatBulan, formatRupiah } from '../../../utils/format';
import PiutangActions from '../piutang/PiutangActions';
import JadwalRealisasiModal from '../piutang/JadwalRealisasiModal';

/**
 * Penjualan unit yang belum BAST. Uang yang sudah dibayar pembeli adalah hutang
 * (akun 212007) sampai serah terima; setelah BAST kavling pindah ke halaman Piutang.
 */
export default function PenjualanUnitTab({ selectedProyekId = '' }: { selectedProyekId?: string }) {
  const { items, fetchItems, isLoading, error } = usePiutangStore();
  const proyeks = useProyekStore((s) => s.items);
  const [selectedKavlingId, setSelectedKavlingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const proyekNama = (id: string) => proyeks.find((p) => p.id === id)?.nama ?? id;
  const periode = formatBulan(bulanIni());

  const rows = useMemo(
    () =>
      items.filter(
        (kv) => kv.statusBast === 'belum_bast' && kv.status !== 'batal' && (!selectedProyekId || kv.proyekId === selectedProyekId),
      ),
    [items, selectedProyekId],
  );

  const totals = rows.reduce(
    (acc, kv: KavlingTagihan) => ({ nilai: acc.nilai + kv.nilaiSppr, dibayar: acc.dibayar + kv.totalDibayar, sisa: acc.sisa + kv.sisa }),
    { nilai: 0, dibayar: 0, sisa: 0 },
  );

  return (
    <>
      {error && (
        <Notice
          tone="danger"
          title="Data penjualan unit gagal dimuat"
          action={
            <Button size="sm" onClick={() => void fetchItems()}>
              Muat ulang
            </Button>
          }
        >
          {error}. Angka di bawah bisa kosong atau belum terbaru.
        </Notice>
      )}

      <StatGrid columns={3}>
        <StatTile
          emphasis
          color={KATEGORI_HUTANG_HEX.penjualan_unit}
          icon={PiHandCoins}
          label="Hutang penjualan unit"
          value={formatRupiah(totals.dibayar)}
          hint={`${rows.length} kavling belum BAST`}
        />
        <StatTile color="#1e293b" icon={PiFileText} label="Nilai kontrak (SPPR)" value={formatRupiah(totals.nilai)} />
        <StatTile color="#b45309" icon={PiHourglassMedium} label="Sisa tagihan" value={formatRupiah(totals.sisa)} />
      </StatGrid>

      <Notice>
        Uang yang sudah dibayar pembeli sebelum serah terima dicatat sebagai hutang (uang muka user). Saat BAST dicatat, saldonya
        diakui sebagai penjualan dan sisa harga menjadi piutang.
      </Notice>

      <Panel
        title="Penjualan unit belum BAST"
        description="Klik baris untuk melihat jadwal angsuran dan realisasinya. Catat BAST lewat menu aksi."
        flush
        actions={
          <ExportButton
            getColumns={() => [
              { header: 'Nama User', key: 'namaUser', width: 25 },
              { header: 'No. Kavling', key: 'nomorKavling', width: 15 },
              { header: 'Proyek', key: 'proyek', width: 20 },
              { header: 'Tipe Transaksi', key: 'tipe', width: 15 },
              { header: 'Nilai SPPR', key: 'nilaiSppr', isNumber: true, width: 18 },
              { header: 'Hutang (Dibayar)', key: 'dibayar', isNumber: true, width: 18 },
              { header: 'Sisa Tagihan', key: 'sisa', isNumber: true, width: 18 },
            ]}
            getData={() => [
              ...rows.map((kv) => ({
                namaUser: kv.namaUser,
                nomorKavling: kv.nomorKavling,
                proyek: proyekNama(kv.proyekId),
                tipe: TIPE_TRANSAKSI_LABELS[kv.tipeTransaksi],
                nilaiSppr: kv.nilaiSppr,
                dibayar: kv.totalDibayar,
                sisa: kv.sisa,
              })),
              { namaUser: 'TOTAL', nomorKavling: '', proyek: '', tipe: '', nilaiSppr: totals.nilai, dibayar: totals.dibayar, sisa: totals.sisa },
            ]}
            opts={{
              namaLaporan: 'Laporan Hutang: Penjualan Unit (Belum BAST)',
              proyek: selectedProyekId ? proyekNama(selectedProyekId) : 'Semua Proyek',
              periode,
              filenameBase: buildFilename('Hutang_Penjualan_Unit', selectedProyekId ? proyekNama(selectedProyekId) : undefined, periode),
            }}
          />
        }
      >
        {isLoading && items.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-3">Memuat penjualan unit…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            compact
            icon={PiHouseLine}
            title="Tidak ada penjualan unit yang belum BAST"
            description="Penjualan yang sudah serah terima tampil di halaman Piutang."
          />
        ) : (
          <TableScroll label="Penjualan unit belum BAST">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">User / kavling</th>
                  <th scope="col">Tipe</th>
                  <th scope="col" className="num">Nilai SPPR</th>
                  <th scope="col" className="num">Hutang (dibayar)</th>
                  <th scope="col" className="num">Sisa tagihan</th>
                  <th scope="col" className="w-14 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((kv) => (
                  <tr
                    key={kv.id}
                    data-clickable=""
                    tabIndex={0}
                    aria-label={`Jadwal angsuran ${kv.namaUser}, ${kv.nomorKavling}`}
                    onClick={() => setSelectedKavlingId(kv.id)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setSelectedKavlingId(kv.id);
                      }
                    }}
                  >
                    <td>
                      <p className="font-semibold text-ink">{kv.namaUser}</p>
                      <p className="mt-0.5 text-xs text-ink-3">
                        {kv.nomorKavling}, {proyekNama(kv.proyekId)}
                      </p>
                    </td>
                    <td>
                      <Badge>{TIPE_TRANSAKSI_LABELS[kv.tipeTransaksi]}</Badge>
                    </td>
                    <td className="num"><Money value={kv.nilaiSppr} /></td>
                    <td className="num font-semibold text-ink"><Money value={kv.totalDibayar} /></td>
                    <td className="num">
                      {kv.sisa === 0 ? <Badge tone="positive">Lunas</Badge> : <Money value={kv.sisa} />}
                    </td>
                    <td className="text-center">
                      <PiutangActions item={kv} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total</td>
                  <td className="num"><Money value={totals.nilai} /></td>
                  <td className="num"><Money value={totals.dibayar} /></td>
                  <td className="num"><Money value={totals.sisa} /></td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </TableScroll>
        )}
      </Panel>

      <JadwalRealisasiModal
        key={selectedKavlingId ?? 'tutup'}
        kavlingId={selectedKavlingId}
        isOpen={selectedKavlingId !== null}
        onClose={() => setSelectedKavlingId(null)}
      />
    </>
  );
}
