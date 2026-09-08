import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHutangStore, KATEGORI_HUTANG_LABELS, KATEGORI_HUTANG_COLOR } from '../../../store/hutangStore';
import { useProyekStore } from '../../../store/proyekStore';
import ExportButton from '../../../components/ui/ExportButton';
import { buildFilename } from '../../../utils/exportUtils';
import { ArrowLeft } from 'lucide-react';

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function DetailKodePembantuPage() {
  const { kodePembantuId } = useParams<{ kodePembantuId: string }>();
  const navigate = useNavigate();
  const { kodePembantus, getMutasiByKodePembantu } = useHutangStore();
  const { items: proyeks } = useProyekStore();

  const kp = kodePembantus.find((k) => k.id === kodePembantuId);
  const mutasis = useMemo(() => {
    if (!kodePembantuId) return [];
    return getMutasiByKodePembantu(kodePembantuId);
  }, [kodePembantuId, getMutasiByKodePembantu]);

  const proyekNama = proyeks.find((p) => p.id === kp?.proyekId)?.nama ?? '-';

  if (!kp) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Kode pembantu tidak ditemukan.</p>
        <button onClick={() => navigate('/keuangan/hutang')} className="mt-2 text-sm text-indigo-600 hover:underline">
          ← Kembali
        </button>
      </div>
    );
  }

  // Compute running balance
  let runningBalance = 0;
  const rows = mutasis.map((m) => {
    if (m.jenisMutasi === 'kredit') {
      runningBalance += m.nominal;
    } else {
      runningBalance -= m.nominal;
    }
    return { ...m, saldo: runningBalance };
  });

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm w-full">
        <button
          onClick={() => navigate('/keuangan/hutang')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Hutang
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{kp.nama}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-gray-500">{proyekNama}</span>
              <span
                className={`w-32 inline-flex items-center justify-start text-left whitespace-nowrap rounded-full border px-3 py-0.5 text-xs font-medium ${KATEGORI_HUTANG_COLOR[kp.kategori]}`}
              >
                {KATEGORI_HUTANG_LABELS[kp.kategori]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ExportButton
              getColumns={() => [
                { header: 'Tanggal (dd/mm/yyyy)', key: 'tanggal', width: 16 },
                { header: 'Uraian', key: 'uraian', width: 35 },
                { header: 'Debit', key: 'debit', isNumber: true, width: 18 },
                { header: 'Kredit', key: 'kredit', isNumber: true, width: 18 },
                { header: 'Saldo Berjalan', key: 'saldo', isNumber: true, width: 20 },
              ]}
              getData={() =>
                rows.map((r) => ({
                  tanggal: formatDate(r.tanggal),
                  uraian: r.uraian,
                  debit: r.jenisMutasi === 'debit' ? r.nominal : null,
                  kredit: r.jenisMutasi === 'kredit' ? r.nominal : null,
                  saldo: r.saldo,
                }))
              }
              opts={{
                namaLaporan: `Kartu Hutang — ${kp.nama}`,
                proyek: proyekNama,
                filenameBase: buildFilename(`Kartu_Hutang_${kp.nama.replace(/\s+/g, '_')}`, proyekNama),
              }}
            />

            <div className="text-right pl-4 border-l border-gray-200">
              <p className="text-xs text-gray-500">Saldo Akhir</p>
              <p className="text-lg font-bold text-gray-900">{formatRupiah(runningBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mutation history table with dd/mm/yyyy date format (FE-06a) */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tanggal (dd/mm/yyyy)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Uraian
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Debit
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Kredit
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Saldo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  Belum ada riwayat mutasi.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(row.tanggal)}</td>
                  <td className="px-4 py-3 text-gray-600">{row.uraian}</td>
                  <td className="px-4 py-3 text-left font-mono">
                    {row.jenisMutasi === 'debit' ? (
                      <span className="text-red-600">{formatRupiah(row.nominal)}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-left font-mono">
                    {row.jenisMutasi === 'kredit' ? (
                      <span className="text-emerald-600">{formatRupiah(row.nominal)}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-left font-mono font-semibold text-gray-900">
                    {formatRupiah(row.saldo)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
