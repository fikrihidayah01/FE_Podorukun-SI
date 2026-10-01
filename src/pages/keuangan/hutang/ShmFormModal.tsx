import { useState, type FormEvent } from 'react';
import {
  useShmStore,
  type StatusShm,
  type StatusPbg,
  STATUS_SHM_LABELS,
  STATUS_PBG_LABELS,
  STATUS_SHM_OPTIONS,
  STATUS_PBG_OPTIONS,
} from '../../../store/shmStore';
import { usePinjamanBankStore } from '../../../store/pinjamanBankStore';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Notice from '../../../components/ui/Notice';
import { formatRupiah } from '../../../utils/format';

interface ShmFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShmFormModal({ isOpen, onClose }: ShmFormModalProps) {
  const { addShm, shms, getCustomStatuses, getCustomLokasis } = useShmStore();
  const pinjamans = usePinjamanBankStore((s) => s.pinjamans);

  const [nomorShm, setNomorShm] = useState('');
  const [kavling, setKavling] = useState('');
  const [status, setStatus] = useState<StatusShm>('di_notaris');
  const [statusKustom, setStatusKustom] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [pinjamanBankId, setPinjamanBankId] = useState('');
  const [namaBank, setNamaBank] = useState('');
  const [noPbg, setNoPbg] = useState('');
  const [statusPbg, setStatusPbg] = useState<StatusPbg>('belum_diajukan');
  const [statusPbgKustom, setStatusPbgKustom] = useState('');
  const [dupError, setDupError] = useState(false);

  const aktivPinjamans = pinjamans.filter((p) => p.status === 'aktif');
  const pbgKustomList = Array.from(
    new Set(shms.filter((s) => s.statusPbg === 'lainnya' && s.statusPbgKustom).map((s) => s.statusPbgKustom as string)),
  );

  const resetForm = () => {
    setNomorShm('');
    setKavling('');
    setStatus('di_notaris');
    setStatusKustom('');
    setLokasi('');
    setPinjamanBankId('');
    setNamaBank('');
    setNoPbg('');
    setStatusPbg('belum_diajukan');
    setStatusPbgKustom('');
    setDupError(false);
  };

  const isValid =
    nomorShm.trim() !== '' &&
    kavling.trim() !== '' &&
    lokasi.trim() !== '' &&
    (status !== 'dijaminkan' || pinjamanBankId !== '') &&
    (status !== 'lainnya' || statusKustom.trim() !== '') &&
    (statusPbg !== 'lainnya' || statusPbgKustom.trim() !== '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setDupError(false);
    const ok = addShm({
      nomorShm: nomorShm.trim(),
      kavling: kavling.trim(),
      status,
      statusKustom: status === 'lainnya' ? statusKustom.trim() : undefined,
      lokasi: lokasi.trim(),
      statusPbg,
      noPbg: noPbg.trim() || undefined,
      statusPbgKustom: statusPbg === 'lainnya' ? statusPbgKustom.trim() : undefined,
      ...(status === 'dijaminkan' ? { pinjamanBankId, namaBank } : {}),
    });
    if (!ok) {
      setDupError(true);
      return;
    }
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tambah dokumen legal"
      description="Satu baris per kavling: sertifikat (SHM) dan izin bangunan (PBG)"
      size="md"
      footer={
        <>
          <Button onClick={handleClose}>Batal</Button>
          <Button variant="primary" type="submit" form="shm-form" disabled={!isValid}>
            Simpan dokumen
          </Button>
        </>
      }
    >
      <form id="shm-form" onSubmit={handleSubmit} className="space-y-5">
        {dupError && <Notice tone="danger">No. SHM ini sudah terdaftar. Gunakan nomor lain.</Notice>}

        <fieldset className="space-y-4">
          <legend className="mb-3 text-sm font-semibold text-ink">Sertifikat (SHM)</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="No. SHM" required>
              <input
                className="control"
                value={nomorShm}
                onChange={(e) => {
                  setNomorShm(e.target.value);
                  setDupError(false);
                }}
                placeholder="Contoh: SHM-006/2026"
              />
            </Field>
            <Field label="Kavling" required>
              <input className="control" value={kavling} onChange={(e) => setKavling(e.target.value)} placeholder="Contoh: Kav C-10" />
            </Field>
          </div>
          <Field label="Status SHM" required>
            <select className="control" value={status} onChange={(e) => setStatus(e.target.value as StatusShm)}>
              {STATUS_SHM_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_SHM_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          {status === 'lainnya' && (
            <Field label="Keterangan status" required hint="Maksimal 40 karakter">
              <input
                className="control"
                list="shm-status-list"
                value={statusKustom}
                onChange={(e) => setStatusKustom(e.target.value.slice(0, 40))}
                placeholder="Contoh: Di BPN"
                maxLength={40}
              />
            </Field>
          )}
          <Field label="Lokasi dokumen" required>
            <input className="control" list="lokasi-list" value={lokasi} onChange={(e) => setLokasi(e.target.value)} placeholder="Contoh: Kantor Podorukun" />
          </Field>
          {status === 'dijaminkan' && (
            <Field label="Pinjaman bank terkait" required hint={namaBank ? `Bank: ${namaBank}` : undefined}>
              <select
                className="control"
                value={pinjamanBankId}
                onChange={(e) => {
                  setPinjamanBankId(e.target.value);
                  setNamaBank(pinjamans.find((p) => p.id === e.target.value)?.namaBank ?? '');
                }}
              >
                <option value="">Pilih pinjaman</option>
                {aktivPinjamans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaBank}, {formatRupiah(p.totalPencairan)}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </fieldset>

        <fieldset className="space-y-4 border-t border-line pt-5">
          <legend className="sr-only">Izin bangunan (PBG)</legend>
          <p className="text-sm font-semibold text-ink" aria-hidden>
            Izin bangunan (PBG)
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="No. PBG" optional>
              <input className="control" value={noPbg} onChange={(e) => setNoPbg(e.target.value)} placeholder="Contoh: PBG/26/001" />
            </Field>
            <Field label="Status PBG" required>
              <select className="control" value={statusPbg} onChange={(e) => setStatusPbg(e.target.value as StatusPbg)}>
                {STATUS_PBG_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_PBG_LABELS[s]}</option>
                ))}
              </select>
            </Field>
          </div>
          {statusPbg === 'lainnya' && (
            <Field label="Keterangan status PBG" required hint="Maksimal 40 karakter">
              <input
                className="control"
                list="pbg-status-list"
                value={statusPbgKustom}
                onChange={(e) => setStatusPbgKustom(e.target.value.slice(0, 40))}
                placeholder="Contoh: Revisi berkas"
                maxLength={40}
              />
            </Field>
          )}
        </fieldset>

        <datalist id="shm-status-list">
          {getCustomStatuses().map((cs) => (
            <option key={cs} value={cs} />
          ))}
        </datalist>
        <datalist id="lokasi-list">
          {getCustomLokasis().map((loc) => (
            <option key={loc} value={loc} />
          ))}
        </datalist>
        <datalist id="pbg-status-list">
          {pbgKustomList.map((cs) => (
            <option key={cs} value={cs} />
          ))}
        </datalist>
      </form>
    </Modal>
  );
}
