import { useMemo, useState } from 'react';
import { PiPlus, PiTrash, PiBank, PiWarning } from 'react-icons/pi';
import {
  usePinjamanBankStore,
  type PinjamanBank,
  type PolaPembayaran,
  POLA_PEMBAYARAN_LABELS,
} from '../../../store/pinjamanBankStore';
import { useProyekStore } from '../../../store/proyekStore';
import { useCoaStore } from '../../../store/coaStore';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ExportButton from '../../../components/ui/ExportButton';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import Button, { IconButton } from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Money from '../../../components/ui/Money';
import Notice from '../../../components/ui/Notice';
import Field from '../../../components/ui/Field';
import EmptyState from '../../../components/ui/EmptyState';
import { buildFilename } from '../../../utils/exportUtils';
import { formatTanggal } from '../../../utils/format';
import PinjamanBankDetailModal from './PinjamanBankDetailModal';

interface FormState {
  proyekId: string;
  namaBank: string;
  pola: PolaPembayaran;
  tanggalPencairanAwal: string;
  nominalPencairanAwal: string;
  tanggalAcuanBunga: string;
  tanggalJatuhTempoPokok: string;
  akunHutangId: string;
  akunBebanBungaId: string;
  keterangan: string;
}

const INITIAL_FORM: FormState = {
  proyekId: '',
  namaBank: '',
  pola: 'terpisah',
  tanggalPencairanAwal: '',
  nominalPencairanAwal: '',
  tanggalAcuanBunga: '15',
  tanggalJatuhTempoPokok: '',
  akunHutangId: '',
  akunBebanBungaId: '',
  keterangan: '',
};

interface PinjamanBankTabProps {
  selectedProyekId?: string;
  selectedBulan?: string;
}

export default function PinjamanBankTab({ selectedProyekId, selectedBulan }: PinjamanBankTabProps) {
  const { pinjamans, addPinjaman, removePinjaman, getDueReminders } = usePinjamanBankStore();
  const proyeks = useProyekStore((s) => s.items);
  const akuns = useCoaStore((s) => s.items);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [formError, setFormError] = useState('');

  const [detailPinjaman, setDetailPinjaman] = useState<PinjamanBank | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PinjamanBank | null>(null);

  const reminders = getDueReminders(14);

  const filteredPinjamans = useMemo(
    () => (selectedProyekId ? pinjamans.filter((p) => p.proyekId === selectedProyekId) : pinjamans),
    [pinjamans, selectedProyekId],
  );

  const proyekName = (pid: string) => proyeks.find((p) => p.id === pid)?.nama ?? pid;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const openAdd = () => {
    setForm({ ...INITIAL_FORM, proyekId: selectedProyekId || proyeks[0]?.id || '' });
    setFormError('');
    setShowAdd(true);
  };

  const handleSubmit = () => {
    const nominal = Number(form.nominalPencairanAwal);
    const acuanBunga = Number(form.tanggalAcuanBunga);

    if (
      !form.proyekId ||
      !form.namaBank.trim() ||
      !form.tanggalPencairanAwal ||
      !form.tanggalJatuhTempoPokok ||
      !nominal ||
      nominal <= 0 ||
      !acuanBunga ||
      acuanBunga < 1 ||
      acuanBunga > 31
    ) {
      setFormError('Lengkapi semua kolom wajib. Nominal harus lebih dari 0 dan tanggal acuan bunga antara 1 dan 31.');
      return;
    }

    addPinjaman({
      proyekId: form.proyekId,
      namaBank: form.namaBank.trim(),
      pola: form.pola,
      tanggalPencairanAwal: form.tanggalPencairanAwal,
      nominalPencairanAwal: nominal,
      tanggalAcuanBunga: acuanBunga,
      tanggalJatuhTempoPokok: form.tanggalJatuhTempoPokok,
      akunHutangId: form.akunHutangId || undefined,
      akunBebanBungaId: form.akunBebanBungaId || undefined,
      keterangan: form.keterangan.trim() || undefined,
    });

    setShowAdd(false);
  };

  return (
    <>
      {reminders.length > 0 && (
        <Notice tone="warning" title="Jatuh tempo dalam 14 hari">
          {reminders.slice(0, 3).map((r) => r.label).join('. ')}.
        </Notice>
      )}

      <Panel
        title="Pinjaman bank"
        description={`${filteredPinjamans.length} pinjaman tercatat. Klik baris untuk mencatat pembayaran atau top-up.`}
        flush
        actions={
          <>
            <ExportButton
              getColumns={() => [
                { header: 'Bank', key: 'namaBank', width: 20 },
                { header: 'Proyek', key: 'proyek', width: 18 },
                { header: 'Pola Pembayaran', key: 'pola', width: 16 },
                { header: 'Total Pencairan', key: 'totalPencairan', isNumber: true, width: 20 },
                { header: 'Sisa Pokok', key: 'sisaPokok', isNumber: true, width: 20 },
                { header: 'Penebusan', key: 'penebusan', isNumber: true, width: 20 },
                { header: 'Acuan Bunga', key: 'acuanBunga', width: 16 },
                { header: 'Jatuh Tempo Pokok', key: 'jatuhTempoPokok', width: 18 },
              ]}
              getData={() => [
                ...filteredPinjamans.map((p) => ({
                  namaBank: p.namaBank,
                  proyek: proyekName(p.proyekId),
                  pola: POLA_PEMBAYARAN_LABELS[p.pola],
                  totalPencairan: p.totalPencairan,
                  sisaPokok: p.sisaPokok,
                  penebusan: p.penebusan,
                  acuanBunga: `Tgl ${p.tanggalAcuanBunga}`,
                  jatuhTempoPokok: formatTanggal(p.tanggalJatuhTempoPokok),
                })),
                {
                  namaBank: 'TOTAL',
                  proyek: '',
                  pola: '',
                  totalPencairan: filteredPinjamans.reduce((s, p) => s + p.totalPencairan, 0),
                  sisaPokok: filteredPinjamans.reduce((s, p) => s + p.sisaPokok, 0),
                  penebusan: filteredPinjamans.reduce((s, p) => s + p.penebusan, 0),
                  acuanBunga: '',
                  jatuhTempoPokok: '',
                },
              ]}
              opts={{
                namaLaporan: 'Laporan Pinjaman Bank',
                proyek: selectedProyekId ? proyekName(selectedProyekId) : 'Semua Proyek',
                periode: selectedBulan,
                filenameBase: buildFilename('Pinjaman_Bank', selectedProyekId ? proyekName(selectedProyekId) : undefined, selectedBulan),
              }}
            />
            <Button variant="primary" icon={PiPlus} onClick={openAdd}>
              Tambah pinjaman
            </Button>
          </>
        }
      >
        {filteredPinjamans.length === 0 ? (
          <EmptyState
            compact
            icon={PiBank}
            title="Belum ada pinjaman bank"
            description="Tambahkan pinjaman untuk memantau sisa pokok, bunga, dan jatuh temponya."
          />
        ) : (
          <TableScroll label="Daftar pinjaman bank">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Bank / proyek</th>
                  <th scope="col">Pola</th>
                  <th scope="col" className="num">Total pencairan</th>
                  <th scope="col" className="num">Sisa pokok</th>
                  <th scope="col" className="num">Penebusan</th>
                  <th scope="col">Jatuh tempo</th>
                  <th scope="col"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredPinjamans.map((p) => (
                  <tr
                    key={p.id}
                    data-clickable=""
                    tabIndex={0}
                    aria-label={`Buka pembayaran ${p.namaBank}`}
                    onClick={() => setDetailPinjaman(p)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setDetailPinjaman(p);
                      }
                    }}
                  >
                    <td>
                      <p className="font-semibold text-ink">{p.namaBank}</p>
                      <p className="mt-0.5 text-xs text-ink-3">{proyekName(p.proyekId)}</p>
                    </td>
                    <td>
                      <Badge>{POLA_PEMBAYARAN_LABELS[p.pola]}</Badge>
                    </td>
                    <td className="num font-semibold text-ink"><Money value={p.totalPencairan} /></td>
                    <td className="num"><Money value={p.sisaPokok} /></td>
                    <td className="num">
                      {p.penebusan < 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-danger">
                          <PiWarning className="h-3.5 w-3.5" aria-label="Penebusan negatif" />
                          <Money value={p.penebusan} accounting />
                        </span>
                      ) : (
                        <Money value={p.penebusan} tone={p.penebusan === 0 ? 'muted' : 'default'} />
                      )}
                    </td>
                    <td className="whitespace-nowrap text-[13px]">
                      <p className="font-medium text-ink">Bunga tiap tgl {p.tanggalAcuanBunga}</p>
                      <p className="tabular-nums text-ink-3">Pokok {formatTanggal(p.tanggalJatuhTempoPokok)}</p>
                    </td>
                    <td className="w-12 !pr-3 text-right">
                      <IconButton
                        icon={PiTrash}
                        tone="danger"
                        label={`Hapus pinjaman ${p.namaBank}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(p);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Panel>

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Tambah pinjaman bank"
        size="lg"
        footer={
          <>
            <Button onClick={() => setShowAdd(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit}>
              Simpan pinjaman
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <Notice tone="danger">{formError}</Notice>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Proyek" required>
              <select className="control" value={form.proyekId} onChange={(e) => set('proyekId', e.target.value)}>
                <option value="">Pilih proyek</option>
                {proyeks.map((pr) => (
                  <option key={pr.id} value={pr.id}>{pr.nama}</option>
                ))}
              </select>
            </Field>
            <Field label="Nama bank" required>
              <input className="control" value={form.namaBank} onChange={(e) => set('namaBank', e.target.value)} placeholder="Contoh: Bank Mandiri" />
            </Field>
            <Field label="Pola pembayaran" required>
              <select className="control" value={form.pola} onChange={(e) => set('pola', e.target.value as PolaPembayaran)}>
                {(Object.keys(POLA_PEMBAYARAN_LABELS) as PolaPembayaran[]).map((k) => (
                  <option key={k} value={k}>{POLA_PEMBAYARAN_LABELS[k]}</option>
                ))}
              </select>
            </Field>
            <Field label="Nominal pencairan awal" required>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className="control control-num"
                value={form.nominalPencairanAwal}
                onChange={(e) => set('nominalPencairanAwal', e.target.value)}
                placeholder="0"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Tanggal pencairan" required>
              <input type="date" className="control" value={form.tanggalPencairanAwal} onChange={(e) => set('tanggalPencairanAwal', e.target.value)} />
            </Field>
            <Field label="Tanggal acuan bunga" required hint="Tanggal 1-31 tiap bulan">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                className="control"
                value={form.tanggalAcuanBunga}
                onChange={(e) => set('tanggalAcuanBunga', e.target.value)}
              />
            </Field>
            <Field label="Jatuh tempo pokok" required>
              <input type="date" className="control" value={form.tanggalJatuhTempoPokok} onChange={(e) => set('tanggalJatuhTempoPokok', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Akun hutang (COA)" optional>
              <select className="control" value={form.akunHutangId} onChange={(e) => set('akunHutangId', e.target.value)}>
                <option value="">Pilih akun hutang</option>
                {akuns.filter((a) => a.kategori === 'hutang').map((a) => (
                  <option key={a.id} value={a.id}>{a.kodeAkun} - {a.namaAkun}</option>
                ))}
              </select>
            </Field>
            <Field label="Akun beban bunga (COA)" optional>
              <select className="control" value={form.akunBebanBungaId} onChange={(e) => set('akunBebanBungaId', e.target.value)}>
                <option value="">Pilih akun beban</option>
                {akuns.filter((a) => a.kategori === 'beban').map((a) => (
                  <option key={a.id} value={a.id}>{a.kodeAkun} - {a.namaAkun}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Keterangan" optional>
            <textarea rows={2} className="control" value={form.keterangan} onChange={(e) => set('keterangan', e.target.value)} />
          </Field>
        </div>
      </Modal>

      <PinjamanBankDetailModal
        key={detailPinjaman?.id ?? 'none'}
        pinjaman={detailPinjaman}
        isOpen={detailPinjaman !== null}
        onClose={() => setDetailPinjaman(null)}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) removePinjaman(deleteTarget.id);
        }}
        title="Hapus pinjaman"
        message={`Hapus pinjaman "${deleteTarget?.namaBank ?? ''}"? Semua riwayat pembayarannya ikut terhapus.`}
        confirmLabel="Hapus pinjaman"
      />
    </>
  );
}
