import { useMemo } from 'react';
import { useHutangStore, KATEGORI_HUTANG_LABELS, KATEGORI_HUTANG_COLOR, type KategoriHutang } from '../../../store/hutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import { ArrowRight, ArrowLeftRight } from 'lucide-react';

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

interface AntarProyekTabProps {
  selectedProyekId: string;
}

export default function AntarProyekTab({ selectedProyekId }: AntarProyekTabProps) {
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
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <ArrowLeftRight className="h-5 w-5 text-teal-600" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Riwayat Hutang Antar Proyek</h3>
          <p className="text-xs text-gray-500">
            Transaksi hutang-piutang antar proyek dicatat otomatis di kedua sisi
          </p>
        </div>
      </div>

      {/* Info note */}
      <div className="mb-4 rounded-lg bg-teal-50 border border-teal-200 px-4 py-3">
        <p className="text-xs text-teal-700">
          <strong>Mirror entry:</strong> Setiap mutasi hutang antar proyek otomatis membuat pencatatan lawan (piutang) di proyek pemberi pinjaman. Pelunasan juga ter-update di kedua sisi.
        </p>
      </div>

      {/* Table */}
      {mutasis.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <ArrowLeftRight className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Belum ada transaksi antar proyek</p>
          <p className="mt-1 text-xs text-gray-400">
            Input mutasi dengan kategori "Hutang antar proyek" untuk memulai
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Proyek</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Pihak</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Proyek Lawan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Jenis</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Nominal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Uraian</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Mirror</th>
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
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.jenisMutasi === 'kredit'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {m.jenisMutasi === 'kredit' ? 'Kredit' : 'Debit'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">
                    {m.jenisMutasi === 'debit' ? (
                      <span className="text-red-600">({formatRupiah(m.nominal)})</span>
                    ) : (
                      formatRupiah(m.nominal)
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{m.uraian}</td>
                  <td className="px-4 py-3 text-center">
                    {m.mirrorMutasiId ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
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
