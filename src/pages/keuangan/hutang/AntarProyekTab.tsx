import { useMemo } from 'react';
import { useHutangStore } from '../../../store/hutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import { ArrowRight, ArrowLeftRight } from 'lucide-react';
import ExportButton from '../../../components/ui/ExportButton';
import { buildFilename } from '../../../utils/exportUtils';

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

interface AntarProyekTabProps {
  selectedProyekId: string;
  selectedBulan?: string;
}

export default function AntarProyekTab({ selectedProyekId, selectedBulan }: AntarProyekTabProps) {
  const { getMutasiAntarProyek, kodePembantus } = useHutangStore();
  const { items: proyeks } = useProyekStore();

  const proyekMap = useMemo(() => {
    const m = new Map<string, string>();
    proyeks.forEach((p) => m.set(p.id, p.nama));
    return m;
  }, [proyeks]);

  const mutasis = useMemo(() => {
    return getMutasiAntarProyek(selectedProyekId || undefined);
  }, [getMutasiAntarProyek, selectedProyekId]);

  const kpMap = useMemo(() => {
    const m = new Map<string, string>();
    kodePembantus.forEach((kp) => m.set(kp.id, kp.nama));
    return m;
  }, [kodePembantus]);

  return (
    <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full space-y-4">
      {/* Header toolbar */}
      <div className="rounded-2xl bg-[#FCFBFC] border border-gray-200 p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-teal-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Riwayat Hutang Antar Proyek</h3>
            <p className="text-xs text-gray-500">
              Transaksi hutang-piutang antar proyek dicatat otomatis di kedua sisi
            </p>
          </div>
        </div>
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
          getData={() => mutasis.map((m) => ({
            tanggal: m.tanggal,
            proyek: proyekMap.get(m.proyekId) ?? m.proyekId,
            pihak: kpMap.get(m.kodePembantuId) ?? '-',
            proyekLawan: m.proyekLawanId ? (proyekMap.get(m.proyekLawanId) ?? m.proyekLawanId) : '-',
            jenis: m.jenisMutasi === 'kredit' ? 'Kredit' : 'Debit',
            nominal: m.nominal,
            uraian: m.uraian,
          }))}
          opts={{
            namaLaporan: 'Laporan Hutang Antar Proyek',
            filenameBase: buildFilename('Antar_Proyek', selectedProyekId ? proyekMap.get(selectedProyekId) : undefined, selectedBulan),
          }}
        />
      </div>

      {/* Info note */}
      <div className="rounded-lg bg-teal-50 border border-teal-200 px-4 py-3">
        <p className="text-xs text-teal-700">
          <strong>Mirror entry:</strong> Setiap mutasi hutang antar proyek otomatis membuat pencatatan lawan (piutang) di proyek pemberi pinjaman. Pelunasan juga ter-update di kedua sisi.
        </p>
      </div>

      {/* Table */}
      {mutasis.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <ArrowLeftRight className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Belum ada transaksi antar proyek</p>
          <p className="mt-1 text-xs text-gray-400">
            Input mutasi dengan kategori "Hutang antar proyek" untuk memulai
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Proyek</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Pihak</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Proyek Lawan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Jenis</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nominal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Uraian</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Mirror</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {mutasis.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{m.tanggal}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{proyekMap.get(m.proyekId) ?? m.proyekId}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{kpMap.get(m.kodePembantuId) ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.proyekLawanId ? (
                      <span className="flex items-center gap-1">
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        {proyekMap.get(m.proyekLawanId) ?? m.proyekLawanId}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-medium ${
                      m.jenisMutasi === 'kredit'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {m.jenisMutasi === 'kredit' ? 'Kredit' : 'Debit'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-left text-gray-700">
                    {m.jenisMutasi === 'debit' ? (
                      <span className="text-red-600">({formatRupiah(m.nominal)})</span>
                    ) : (
                      formatRupiah(m.nominal)
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{m.uraian}</td>
                  <td className="px-4 py-3 text-left">
                    {m.mirrorMutasiId ? (
                      <span className="w-32 inline-flex items-center justify-start text-left whitespace-nowrap gap-1 rounded-full bg-teal-100 px-3 py-0.5 text-xs font-medium text-teal-700">
                        <ArrowLeftRight className="h-2.5 w-2.5" />
                        Mirror
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
