import { useMemo } from 'react';
import { PiArrowRight, PiArrowsLeftRight } from 'react-icons/pi';
import { useHutangStore } from '../../../store/hutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import Badge from '../../../components/ui/Badge';
import Money from '../../../components/ui/Money';
import Notice from '../../../components/ui/Notice';
import EmptyState from '../../../components/ui/EmptyState';
import ExportButton from '../../../components/ui/ExportButton';
import { buildFilename } from '../../../utils/exportUtils';
import { formatTanggal } from '../../../utils/format';

interface AntarProyekTabProps {
  selectedProyekId: string;
  selectedBulan?: string;
}

export default function AntarProyekTab({ selectedProyekId, selectedBulan }: AntarProyekTabProps) {
  const { getMutasiAntarProyek, kodePembantus } = useHutangStore();
  const { items: proyeks } = useProyekStore();

  const proyekMap = useMemo(() => new Map(proyeks.map((p) => [p.id, p.nama])), [proyeks]);
  const kpMap = useMemo(() => new Map(kodePembantus.map((kp) => [kp.id, kp.nama])), [kodePembantus]);
  const mutasis = getMutasiAntarProyek(selectedProyekId || undefined);

  return (
    <>
      <Notice title="Dicatat di kedua sisi">
        Setiap mutasi hutang antar proyek otomatis membuat catatan piutang di proyek pemberi pinjaman (mirror). Pelunasan
        juga diperbarui di kedua sisi.
      </Notice>

      <Panel
        title="Riwayat hutang antar proyek"
        description={`${mutasis.length} transaksi`}
        flush
        actions={
          <ExportButton
            getColumns={() => [
              { header: 'Tanggal', key: 'tanggal', width: 14 },
              { header: 'Proyek', key: 'proyek', width: 18 },
              { header: 'Pihak', key: 'pihak', width: 24 },
              { header: 'Proyek Lawan', key: 'proyekLawan', width: 18 },
              { header: 'Jenis', key: 'jenis', width: 12 },
              { header: 'Nominal', key: 'nominal', isNumber: true, width: 20 },
              { header: 'Uraian', key: 'uraian', width: 30 },
            ]}
            getData={() =>
              mutasis.map((m) => ({
                tanggal: formatTanggal(m.tanggal),
                proyek: proyekMap.get(m.proyekId) ?? m.proyekId,
                pihak: kpMap.get(m.kodePembantuId) ?? '-',
                proyekLawan: m.proyekLawanId ? (proyekMap.get(m.proyekLawanId) ?? m.proyekLawanId) : '-',
                jenis: m.jenisMutasi === 'kredit' ? 'Kredit' : 'Debit',
                nominal: m.nominal,
                uraian: m.uraian,
              }))
            }
            opts={{
              namaLaporan: 'Laporan Hutang Antar Proyek',
              filenameBase: buildFilename('Antar_Proyek', selectedProyekId ? proyekMap.get(selectedProyekId) : undefined, selectedBulan),
            }}
          />
        }
      >
        {mutasis.length === 0 ? (
          <EmptyState
            compact
            icon={PiArrowsLeftRight}
            title="Belum ada transaksi antar proyek"
            description='Catat lewat Input mutasi dengan kategori "Antar proyek". Catatan lawannya dibuat otomatis.'
          />
        ) : (
          <TableScroll label="Riwayat hutang antar proyek">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Proyek</th>
                  <th scope="col">Pihak</th>
                  <th scope="col">Proyek lawan</th>
                  <th scope="col">Jenis</th>
                  <th scope="col" className="num">Nominal</th>
                  <th scope="col">Uraian</th>
                </tr>
              </thead>
              <tbody>
                {mutasis.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap tabular-nums">{formatTanggal(m.tanggal)}</td>
                    <td className="font-semibold text-ink">{proyekMap.get(m.proyekId) ?? m.proyekId}</td>
                    <td>{kpMap.get(m.kodePembantuId) ?? '-'}</td>
                    <td>
                      {m.proyekLawanId ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <PiArrowRight className="h-3.5 w-3.5 text-ink-3" aria-hidden />
                          {proyekMap.get(m.proyekLawanId) ?? m.proyekLawanId}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className="flex flex-wrap gap-1">
                        <Badge>{m.jenisMutasi === 'kredit' ? 'Kredit' : 'Debit'}</Badge>
                        {m.mirrorMutasiId && <Badge tone="brand">Mirror</Badge>}
                      </span>
                    </td>
                    <td className="num font-semibold text-ink">
                      <Money value={m.jenisMutasi === 'debit' ? -m.nominal : m.nominal} accounting />
                    </td>
                    <td className="max-w-[260px] truncate" title={m.uraian}>
                      {m.uraian}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Panel>
    </>
  );
}
