import { useState, type FormEvent } from 'react';
import { PiPlus, PiClockCounterClockwise, PiPencilSimple, PiTrash, PiFileText } from 'react-icons/pi';
import {
  useShmStore,
  type Shm,
  type StatusShm,
  type StatusPbg,
  STATUS_SHM_LABELS,
  STATUS_SHM_TONE,
  STATUS_PBG_LABELS,
  STATUS_PBG_TONE,
  STATUS_SHM_OPTIONS,
  STATUS_PBG_OPTIONS,
} from '../../../store/shmStore';
import { usePinjamanBankStore } from '../../../store/pinjamanBankStore';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ExportButton from '../../../components/ui/ExportButton';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import Button, { IconButton } from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Field from '../../../components/ui/Field';
import EmptyState from '../../../components/ui/EmptyState';
import { buildFilename } from '../../../utils/exportUtils';
import { formatRupiah } from '../../../utils/format';
import ShmFormModal from './ShmFormModal';
import ShmRiwayatModal from './ShmRiwayatModal';

interface AgunanShmTabProps {
  selectedProyekId?: string;
  selectedBulan?: string;
}

const shmLabel =(s: Pick<Shm, 'status' | 'statusKustom'>) =>
  s.status === 'lainnya' && s.statusKustom ? s.statusKustom : STATUS_SHM_LABELS[s.status];
const pbgLabel = (s: Shm) => (s.statusPbg === 'lainnya' && s.statusPbgKustom ? s.statusPbgKustom : STATUS_PBG_LABELS[s.statusPbg]);

export default function AgunanShmTab({ selectedProyekId, selectedBulan }: AgunanShmTabProps) {
  const { shms, removeShm, updateStatus, getCustomStatuses, getCustomLokasis } = useShmStore();
  const pinjamans = usePinjamanBankStore((s) => s.pinjamans);

  const [filterStatusShm, setFilterStatusShm] = useState<StatusShm | 'semua'>('semua');
  const [filterStatusPbg, setFilterStatusPbg] = useState<StatusPbg | 'semua'>('semua');
  const [formOpen, setFormOpen] = useState(false);
  const [riwayatShm, setRiwayatShm] = useState<Shm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shm | null>(null);

  const [ubahTarget, setUbahTarget] = useState<Shm | null>(null);
  const [ubahStatus, setUbahStatus] = useState<StatusShm>('di_kantor');
  const [ubahStatusKustom, setUbahStatusKustom] = useState('');
  const [ubahLokasi, setUbahLokasi] = useState('');
  const [ubahKeterangan, setUbahKeterangan] = useState('');
  const [ubahPinjamanId, setUbahPinjamanId] = useState('');
  const [ubahNamaBank, setUbahNamaBank] = useState('');

  const aktivPinjamans = pinjamans.filter((p) => p.status === 'aktif');
  const customStatuses = getCustomStatuses();

  const filtered = shms.filter((s) => {
    if (filterStatusShm !== 'semua' && s.status !== filterStatusShm) return false;
    if (filterStatusPbg !== 'semua' && s.statusPbg !== filterStatusPbg) return false;
    return true;
  });

  const openUbahStatus = (shm: Shm) => {
    setUbahTarget(shm);
    setUbahStatus(shm.status);
    setUbahStatusKustom(shm.statusKustom ?? '');
    setUbahLokasi(shm.lokasi);
    setUbahKeterangan('');
    setUbahPinjamanId(shm.pinjamanBankId ?? '');
    setUbahNamaBank(shm.namaBank ?? '');
  };

  const closeUbahStatus = () => setUbahTarget(null);

  const handlePinjamanChange = (id: string) => {
    setUbahPinjamanId(id);
    setUbahNamaBank(pinjamans.find((p) => p.id === id)?.namaBank ?? '');
  };

  const ubahIsValid =
    ubahLokasi.trim() !== '' &&
    (ubahStatus !== 'dijaminkan' || ubahPinjamanId !== '') &&
    (ubahStatus !== 'lainnya' || ubahStatusKustom.trim() !== '');

  const handleUbahSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!ubahTarget || !ubahIsValid) return;
    updateStatus(
      ubahTarget.id,
      ubahStatus,
      ubahLokasi.trim(),
      ubahKeterangan.trim() || undefined,
      ubahStatus === 'dijaminkan' ? ubahPinjamanId : undefined,
      ubahStatus === 'dijaminkan' ? ubahNamaBank : undefined,
      ubahStatus === 'lainnya' ? ubahStatusKustom.trim() : undefined,
    );
    closeUbahStatus();
  };

  return (
    <Panel
      title="Dokumen legal per kavling"
      description={`SHM dan PBG, ${filtered.length} dokumen`}
      flush
      actions={
        <>
          <ExportButton
            getColumns={() => [
              { header: 'No. SHM', key: 'nomorShm', width: 20 },
              { header: 'Kavling', key: 'kavling', width: 16 },
              { header: 'Status SHM', key: 'statusShm', width: 18 },
              { header: 'Lokasi', key: 'lokasi', width: 22 },
              { header: 'No. PBG', key: 'noPbg', width: 18 },
              { header: 'Status PBG', key: 'statusPbg', width: 18 },
              { header: 'Pinjaman Terkait', key: 'namaBank', width: 20 },
            ]}
            getData={() =>
              filtered.map((s) => ({
                nomorShm: s.nomorShm,
                kavling: s.kavling,
                statusShm: shmLabel(s),
                lokasi: s.lokasi,
                noPbg: s.noPbg || '-',
                statusPbg: pbgLabel(s),
                namaBank: s.namaBank || '-',
              }))
            }
            opts={{
              namaLaporan: 'Laporan Dokumen Legal (SHM & PBG)',
              proyek: selectedProyekId,
              periode: selectedBulan,
              filenameBase: buildFilename('Dokumen_Legal', selectedProyekId, selectedBulan),
            }}
          />
          <Button variant="primary" icon={PiPlus} onClick={() => setFormOpen(true)}>
            Tambah dokumen
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 border-b border-line px-4 py-3.5 sm:grid-cols-2 sm:px-5 lg:max-w-2xl">
        <div>
          <label htmlFor="f-status-shm" className="field-label">Status SHM</label>
          <select
            id="f-status-shm"
            className="control"
            value={filterStatusShm}
            onChange={(e) => setFilterStatusShm(e.target.value as StatusShm | 'semua')}
          >
            <option value="semua">Semua status</option>
            {STATUS_SHM_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_SHM_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status-pbg" className="field-label">Status PBG</label>
          <select
            id="f-status-pbg"
            className="control"
            value={filterStatusPbg}
            onChange={(e) => setFilterStatusPbg(e.target.value as StatusPbg | 'semua')}
          >
            <option value="semua">Semua status</option>
            {STATUS_PBG_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_PBG_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          compact
          icon={PiFileText}
          title={shms.length === 0 ? 'Belum ada dokumen legal' : 'Tidak ada dokumen dengan status ini'}
          description={
            shms.length === 0
              ? 'Tambahkan SHM dan PBG per kavling untuk melacak lokasi dan status jaminannya.'
              : 'Ubah filter status SHM atau PBG untuk melihat dokumen lain.'
          }
        />
      ) : (
        <TableScroll label="Dokumen legal">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">SHM / kavling</th>
                <th scope="col">Status SHM</th>
                <th scope="col">Lokasi</th>
                <th scope="col">No. PBG</th>
                <th scope="col">Status PBG</th>
                <th scope="col"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((shm) => (
                <tr key={shm.id}>
                  <td>
                    <p className="font-semibold text-ink">{shm.nomorShm}</p>
                    <p className="mt-0.5 text-xs text-ink-3">{shm.kavling}</p>
                  </td>
                  <td>
                    <Badge tone={STATUS_SHM_TONE[shm.status]}>{shmLabel(shm)}</Badge>
                    {shm.status === 'dijaminkan' && shm.namaBank && <p className="mt-1 text-xs text-ink-3">{shm.namaBank}</p>}
                  </td>
                  <td>{shm.lokasi === 'lainnya' && shm.lokasiKustom ? shm.lokasiKustom : shm.lokasi}</td>
                  <td className="tabular-nums">{shm.noPbg?.trim() ? shm.noPbg : <span className="text-ink-3">-</span>}</td>
                  <td>
                    <Badge tone={STATUS_PBG_TONE[shm.statusPbg]}>{pbgLabel(shm)}</Badge>
                  </td>
                  <td className="!pr-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" icon={PiPencilSimple} onClick={() => openUbahStatus(shm)}>
                        Ubah status
                      </Button>
                      <IconButton icon={PiClockCounterClockwise} label={`Riwayat ${shm.nomorShm}`} onClick={() => setRiwayatShm(shm)} />
                      <IconButton icon={PiTrash} tone="danger" label={`Hapus ${shm.nomorShm}`} onClick={() => setDeleteTarget(shm)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}

      <ShmFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} />
      <ShmRiwayatModal shm={riwayatShm} isOpen={riwayatShm !== null} onClose={() => setRiwayatShm(null)} />

      <Modal
        isOpen={ubahTarget !== null}
        onClose={closeUbahStatus}
        title="Ubah status SHM"
        description={ubahTarget ? `${ubahTarget.nomorShm}, ${ubahTarget.kavling}` : undefined}
        size="sm"
        footer={
          <>
            <Button onClick={closeUbahStatus}>Batal</Button>
            <Button variant="primary" type="submit" form="ubah-status-form" disabled={!ubahIsValid}>
              Simpan status
            </Button>
          </>
        }
      >
        <form id="ubah-status-form" onSubmit={handleUbahSubmit} className="space-y-4">
          <Field label="Status baru" required>
            <select className="control" value={ubahStatus} onChange={(e) => setUbahStatus(e.target.value as StatusShm)}>
              {STATUS_SHM_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_SHM_LABELS[s]}</option>
              ))}
            </select>
          </Field>

          {ubahStatus === 'lainnya' && (
            <Field label="Keterangan status" required hint="Maksimal 40 karakter">
              <input
                className="control"
                list="ubah-shm-status-list"
                value={ubahStatusKustom}
                onChange={(e) => setUbahStatusKustom(e.target.value.slice(0, 40))}
                placeholder="Contoh: Di BPN"
                maxLength={40}
              />
            </Field>
          )}
          <datalist id="ubah-shm-status-list">
            {customStatuses.map((cs) => (
              <option key={cs} value={cs} />
            ))}
          </datalist>

          <Field label="Lokasi baru" required>
            <input
              className="control"
              list="ubah-lokasi-list"
              value={ubahLokasi}
              onChange={(e) => setUbahLokasi(e.target.value)}
              placeholder="Contoh: Bank Mandiri"
            />
          </Field>
          <datalist id="ubah-lokasi-list">
            {getCustomLokasis().map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>

          <Field label="Keterangan" optional>
            <textarea rows={2} className="control" value={ubahKeterangan} onChange={(e) => setUbahKeterangan(e.target.value)} />
          </Field>

          {ubahStatus === 'dijaminkan' && (
            <Field label="Pinjaman bank" required hint={ubahNamaBank ? `Bank: ${ubahNamaBank}` : undefined}>
              <select className="control" value={ubahPinjamanId} onChange={(e) => handlePinjamanChange(e.target.value)}>
                <option value="">Pilih pinjaman</option>
                {aktivPinjamans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaBank}, {formatRupiah(p.totalPencairan)}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) removeShm(deleteTarget.id);
        }}
        title="Hapus dokumen legal"
        message={`Hapus SHM "${deleteTarget?.nomorShm ?? ''}"? Riwayat statusnya ikut terhapus.`}
        confirmLabel="Hapus dokumen"
      />
    </Panel>
  );
}
