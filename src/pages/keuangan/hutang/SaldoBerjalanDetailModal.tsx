import { useNavigate } from 'react-router-dom';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
import Notice from '../../../components/ui/Notice';
import { useHutangStore, KATEGORI_HUTANG_LABELS, type SaldoKodePembantu } from '../../../store/hutangStore';
import { useCoaStore } from '../../../store/coaStore';
import { useProyekStore } from '../../../store/proyekStore';
import { formatTanggal } from '../../../utils/format';

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
  isPeriodeTerkunci,
}: SaldoBerjalanDetailModalProps) {
  const navigate = useNavigate();
  const { getMutasiByKodePembantu } = useHutangStore();
  const { items: coaList } = useCoaStore();
  const { items: proyeks } = useProyekStore();

  if (!rowData) return null;

  const entries = getMutasiByKodePembantu(rowData.kodePembantu.id)
    .filter((m) => m.tanggal.startsWith(selectedBulan))
    .map((m) => ({ ...m, akun: coaList.find((a) => a.id === m.akunCoaId) }));

  const proyekName = proyeks.find((p) => p.id === rowData.kodePembantu.proyekId)?.nama || '-';
  const totalDebit = entries.filter((e) => e.jenisMutasi === 'debit').reduce((s, e) => s + e.nominal, 0);
  const totalKredit = entries.filter((e) => e.jenisMutasi === 'kredit').reduce((s, e) => s + e.nominal, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rincian saldo ${rowData.kodePembantu.nama}`}
      description={`${KATEGORI_HUTANG_LABELS[rowData.kodePembantu.kategori]}, ${proyekName}, ${periodeLabel}`}
      size="xl"
      footer={
        <>
          <Button
            onClick={() => navigate('/keuangan/coa?tab=saldo_awal')}
            disabled={isPeriodeTerkunci}
            title={isPeriodeTerkunci ? 'Periode terkunci, saldo awal tidak dapat diubah' : undefined}
          >
            Ubah saldo awal
          </Button>
          <Button onClick={() => navigate(`/keuangan/hutang/detail/${rowData.kodePembantu.id}`)}>Lihat kartu hutang</Button>
          <Button variant="primary" onClick={() => navigate('/keuangan/jurnal')}>
            Buka Jurnal Umum
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <dl
          className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/50 bg-line sm:grid-cols-3"
          style={{
            boxShadow: `
              8px 8px 10px -1px rgba(0, 0, 0, 0.7),
              -8px -8px 10px -1px rgba(255, 255, 255, 0.7)
            `,
          }}
        >
          <div className="bg-subtle px-4 py-3">
            <dt className="text-xs font-semibold text-ink-3">Saldo awal</dt>
            <dd className="mt-1 text-lg font-bold text-ink"><Money value={rowData.saldoAwal} /></dd>
          </div>
          <div className="bg-subtle px-4 py-3">
            <dt className="text-xs font-semibold text-ink-3">Mutasi bulan ini</dt>
            <dd className="mt-1 text-lg font-bold">
              {rowData.mutasiBulan === 0 ? <span className="text-ink-3">-</span> : <Money value={rowData.mutasiBulan} signed />}
            </dd>
          </div>
          <div className="bg-ink px-4 py-3 text-white">
            <dt className="text-xs font-semibold text-white/75">Saldo akhir</dt>
            <dd className="mt-1 text-lg font-bold"><Money value={rowData.saldoAkhir} /></dd>
          </div>
        </dl>

        {isPeriodeTerkunci && (
          <Notice tone="warning">Periode {periodeLabel} sudah dikunci. Koreksi hanya bisa lewat jurnal balik di periode berjalan.</Notice>
        )}

        <section>
          <h3 className="text-sm font-semibold text-ink">Mutasi pembentuk saldo</h3>
          <p className="mb-3 mt-0.5 text-[13px] text-ink-3">
            Angka di sini dihitung dari jurnal. Untuk memperbaikinya, koreksi jurnalnya di Jurnal Umum, bukan baris ini.
          </p>
          <div className="relative overflow-x-auto rounded-lg border border-line">
            <table className="tbl tbl-compact">
              <thead>
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Uraian</th>
                  <th scope="col">Akun</th>
                  <th scope="col">Referensi</th>
                  <th scope="col" className="num">Debit</th>
                  <th scope="col" className="num">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="!py-8 text-center text-ink-3">
                      Tidak ada mutasi di {periodeLabel}. Saldo akhir sama dengan saldo awal.
                    </td>
                  </tr>
                ) : (
                  entries.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap tabular-nums">{formatTanggal(e.tanggal)}</td>
                      <td className="text-ink">{e.uraian}</td>
                      <td>{e.akun ? `${e.akun.kodeAkun} - ${e.akun.namaAkun}` : <span className="text-ink-3">-</span>}</td>
                      <td>{e.referensi || <span className="text-ink-3">-</span>}</td>
                      <td className="num">{e.jenisMutasi === 'debit' ? <Money value={e.nominal} /> : <span className="text-ink-3">-</span>}</td>
                      <td className="num">{e.jenisMutasi === 'kredit' ? <Money value={e.nominal} /> : <span className="text-ink-3">-</span>}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {entries.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={4}>Total</td>
                    <td className="num"><Money value={totalDebit} /></td>
                    <td className="num"><Money value={totalKredit} /></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>
    </Modal>
  );
}
