import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Edit, RotateCcw } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { useHutangStore, KATEGORI_HUTANG_LABELS, type SaldoKodePembantu } from '../../../store/hutangStore';
import { useCoaStore } from '../../../store/coaStore';
import { useProyekStore } from '../../../store/proyekStore';

interface SaldoBerjalanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowData: SaldoKodePembantu | null;
  periodeLabel: string;
  selectedBulan: string;
  isPeriodeTerkunci: boolean;
}

export default function SaldoBerjalanDetailModal({
  isOpen,
  onClose,
  rowData,
  periodeLabel,
  selectedBulan,
  isPeriodeTerkunci
}: SaldoBerjalanDetailModalProps) {
  const navigate = useNavigate();
  const { getMutasiByKodePembantu } = useHutangStore();
  const { items: coaList } = useCoaStore();
  const { items: proyeks } = useProyekStore();

  function formatRupiah(n: number) {
    return 'Rp ' + n.toLocaleString('id-ID');
  }

  function formatDateFull(iso: string) {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  const relatedJurnalEntries = useMemo(() => {
    if (!rowData) return [];
    const kpMutasis = getMutasiByKodePembantu(rowData.kodePembantu.id);
    return kpMutasis.map((m, idx) => ({
      id: m.id,
      noJurnal: `JU-${selectedBulan.replace('-', '')}-${String(idx + 1).padStart(3, '0')}`,
      tanggal: formatDateFull(m.tanggal),
      uraian: m.uraian,
      debit: m.jenisMutasi === 'debit' ? m.nominal : 0,
      kredit: m.jenisMutasi === 'kredit' ? m.nominal : 0,
      akun: coaList.find((a) => a.id === m.akunCoaId)?.namaAkun || 'Hutang Usaha',
      // Mocking status since it doesn't exist in mutasi data yet
      status: idx % 2 === 0 ? 'diposting' : 'draft',
      nominal: m.jenisMutasi === 'kredit' ? m.nominal : -m.nominal, // assuming kredit increases hutang
    }));
  }, [rowData, getMutasiByKodePembantu, selectedBulan, coaList]);

  if (!rowData) return null;

  const proyek = proyeks.find(p => p.id === rowData.kodePembantu.proyekId);
  const proyekName = proyek?.nama || '-';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rincian Saldo — ${rowData.kodePembantu.nama}`}
      size="xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            onClick={() => navigate('/keuangan/coa')}
            disabled={isPeriodeTerkunci}
            title={isPeriodeTerkunci ? 'Periode sedang terkunci, saldo awal tidak dapat diubah' : 'Buka halaman Saldo Awal di COA'}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            Ubah saldo awal
          </button>
          <button
            onClick={() => navigate('/keuangan/hutang/detail/' + rowData.kodePembantu.id)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Ubah data pihak
          </button>
          <button
            onClick={() => navigate('/keuangan/jurnal')}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Buka di Jurnal Umum
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">Kategori</span>
              <span className="text-sm font-semibold text-gray-900 mt-0.5">{KATEGORI_HUTANG_LABELS[rowData.kodePembantu.kategori]}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">Proyek</span>
              <span className="text-sm font-semibold text-gray-900 mt-0.5">{proyekName}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">Periode</span>
              <span className="text-sm font-semibold text-gray-900 mt-0.5">{periodeLabel}</span>
            </div>
          </div>
        </div>

        {/* Summary Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Saldo Awal</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatRupiah(rowData.saldoAwal)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Mutasi (Bulan Ini)</p>
            <p className={`text-lg font-bold mt-1 ${rowData.mutasiBulan < 0 ? 'text-red-600' : rowData.mutasiBulan > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
              {formatRupiah(Math.abs(rowData.mutasiBulan))}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Saldo Akhir</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatRupiah(rowData.saldoAkhir)}</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100">
          <Info className="h-5 w-5 text-blue-600 shrink-0" />
          <p className="text-sm">
            Angka di tabel dihitung dari jurnal. Perbaikan dilakukan pada jurnalnya, bukan pada baris ini.
          </p>
        </div>

        {/* Jurnal Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900">Daftar jurnal pembentuk mutasi</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">No. Bukti</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nominal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {relatedJurnalEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Tidak ada mutasi jurnal pada periode ini.
                    </td>
                  </tr>
                ) : (
                  relatedJurnalEntries.map((je) => (
                    <tr key={je.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{je.tanggal}</td>
                      <td className="px-4 py-3 text-indigo-600">{je.noJurnal}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {formatRupiah(Math.abs(je.nominal))}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          je.status === 'diposting' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {je.status === 'diposting' ? 'Diposting' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {je.status === 'draft' ? (
                          <button className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        ) : (
                          <button className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700">
                            <RotateCcw className="h-3.5 w-3.5" />
                            Jurnal balik
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
