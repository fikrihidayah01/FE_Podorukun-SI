import { useState, useEffect, type FormEvent } from 'react';
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
import { useProyekStore, type KavlingUnit } from '../../../store/proyekStore';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Notice from '../../../components/ui/Notice';
import { formatRupiah } from '../../../utils/format';

interface ShmFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProyekId?: string;
}

export default function ShmFormModal({ isOpen, onClose, defaultProyekId }: ShmFormModalProps) {
  const { addShm, shms, getCustomStatuses, getCustomLokasis } = useShmStore();
  const pinjamans = usePinjamanBankStore((s) => s.pinjamans);
  const proyeks = useProyekStore((s) => s.items);
  const fetchKavling = useProyekStore((s) => s.fetchKavling);

  const [proyekId, setProyekId] = useState(defaultProyekId || '');
  const [kavlingList, setKavlingList] = useState<KavlingUnit[]>([]);
  const [unitId, setUnitId] = useState('');
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
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (defaultProyekId) setProyekId(defaultProyekId);
    else if (proyeks.length > 0 && !proyekId) setProyekId(proyeks[0].id);
  }, [defaultProyekId, proyeks, proyekId]);

  useEffect(() => {
    if (proyekId) {
      fetchKavling(proyekId).then((units) => {
        setKavlingList(units);
        if (units.length > 0 && !unitId) {
          setUnitId(units[0].id);
          setKavling(units[0].nomor);
        }
      });
    }
  }, [proyekId, fetchKavling, unitId]);

  const aktivPinjamans = pinjamans.filter((p) => p.status === 'aktif');
  const pbgKustomList = Array.from(
    new Set(shms.filter((s) => s.statusPbg === 'lainnya' && s.statusPbgKustom).map((s) => s.statusPbgKustom as string)),
  );

  const resetForm = () => {
    setNomorShm('');
    setUnitId('');
    setKavling('');
    setStatus('di_notaris');
    setStatusKustom('');
    setLokasi('');
    setPinjamanBankId('');
    setNamaBank('');
    setNoPbg('');
    setStatusPbg('belum_diajukan');
    setStatusPbgKustom('');
    setErrorMessage('');
  };

  const handleKavlingChange = (selectedId: string) => {
    setUnitId(selectedId);
    const found = kavlingList.find((k) => k.id === selectedId);
    if (found) setKavling(found.nomor);
  };

  const isValid =
    nomorShm.trim() !== '' &&
    unitId !== '' &&
    lokasi.trim() !== '' &&
    (status !== 'dijaminkan' || pinjamanBankId !== '') &&
    (status !== 'lainnya' || statusKustom.trim() !== '') &&
    (statusPbg !== 'lainnya' || statusPbgKustom.trim() !== '');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setErrorMessage('');
    setIsLoading(true);

    try {
      await addShm({
        nomorShm: nomorShm.trim(),
        unitId,
        kavling: kavling.trim(),
        status,
        statusKustom: status === 'lainnya' ? statusKustom.trim() : undefined,
        lokasi: lokasi.trim(),
        statusPbg,
        noPbg: noPbg.trim() || undefined,
        statusPbgKustom: statusPbg === 'lainnya' ? statusPbgKustom.trim() : undefined,
        ...(status === 'dijaminkan' ? { pinjamanBankId, namaBank } : {}),
      });

      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan SHM');
    } finally {
      setIsLoading(false);
    }
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
          <Button variant="primary" type="submit" form="shm-form" disabled={!isValid || isLoading}>
            {isLoading ? 'Menyimpan...' : 'Simpan dokumen'}
          </Button>
        </>
      }
    >
      <form id="shm-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && <Notice tone="danger">{errorMessage}</Notice>}

        <fieldset className="space-y-4">
          <legend className="mb-3 text-sm font-semibold text-ink">Sertifikat (SHM)</legend>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Proyek" required>
              <select
                className="control"
                value={proyekId}
                onChange={(e) => {
                  setProyekId(e.target.value);
                  setUnitId('');
                  setKavling('');
                }}
              >
                <option value="">Pilih proyek</option>
                {proyeks.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </Field>

            <Field label="Kavling (Unit PR Track)" required>
              {kavlingList.length > 0 ? (
                <select
                  className="control"
                  value={unitId}
                  onChange={(e) => handleKavlingChange(e.target.value)}
                >
                  <option value="">Pilih kavling</option>
                  {kavlingList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nomor} {k.tipe ? `(Tipe ${k.tipe})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="control"
                  value={kavling}
                  onChange={(e) => {
                    setKavling(e.target.value);
                    if (!unitId) setUnitId(e.target.value);
                  }}
                  placeholder="Contoh: Kav A-01"
                />
              )}
            </Field>
          </div>

          <Field label="No. SHM" required>
            <input
              className="control"
              value={nomorShm}
              onChange={(e) => {
                setNomorShm(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Contoh: SHM-006/2026"
            />
          </Field>

          <Field label="Status SHM" required>
            <select className="control" value={status} onChange={(e) => setStatus(e.target.value as StatusShm)}>
              {STATUS_SHM_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_SHM_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          {status === 'lainnya' && (
            <div>
              <Field label="Keterangan status" required hint="Maksimal 40 karakter">
                <input
                  className="control"
                  value={statusKustom}
                  onChange={(e) => setStatusKustom(e.target.value)}
                  placeholder="Contoh: Di BPN, Menunggu pemecahan"
                  maxLength={40}
                  list="shm-status-kustom-list"
                />
              </Field>
              <datalist id="shm-status-kustom-list">
                {getCustomStatuses().map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          )}

          <div>
            <Field label="Lokasi dokumen" required hint="Posisi fisik sertifikat saat ini">
              <input
                className="control"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Contoh: Kantor Podorukun, Notaris Ulfa"
                list="shm-lokasi-list"
              />
            </Field>
            <datalist id="shm-lokasi-list">
              {getCustomLokasis().map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>

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

        <fieldset className="space-y-4">
          <legend className="mb-3 text-sm font-semibold text-ink">Izin Bangunan (PBG)</legend>
          <Field label="Status permohonan PBG" required>
            <select className="control" value={statusPbg} onChange={(e) => setStatusPbg(e.target.value as StatusPbg)}>
              {STATUS_PBG_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_PBG_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          {statusPbg === 'lainnya' && (
            <div>
              <Field label="Keterangan status PBG" required hint="Maksimal 40 karakter">
                <input
                  className="control"
                  value={statusPbgKustom}
                  onChange={(e) => setStatusPbgKustom(e.target.value)}
                  placeholder="Contoh: Revisi gambar, Menunggu retribusi"
                  maxLength={40}
                  list="pbg-kustom-list"
                />
              </Field>
              <datalist id="pbg-kustom-list">
                {pbgKustomList.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          )}
          <Field label="No. PBG" optional hint="Kosongkan bila belum terbit">
            <input
              className="control"
              value={noPbg}
              onChange={(e) => setNoPbg(e.target.value)}
              placeholder="Contoh: PBG/26/089"
            />
          </Field>
        </fieldset>
      </form>
    </Modal>
  );
}
