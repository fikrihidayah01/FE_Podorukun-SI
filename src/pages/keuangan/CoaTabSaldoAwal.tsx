import { useEffect, useMemo, useState } from 'react';
import { PiLockSimple, PiLockSimpleOpen, PiBuildings } from 'react-icons/pi';
import { useProyekStore } from '../../store/proyekStore';
import { useCoaStore, KATEGORI_AKUN_LABELS } from '../../store/coaStore';
import { useSaldoAwalStore } from '../../store/saldoAwalStore';
import Panel, { TableScroll } from '../../components/ui/Panel';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Money from '../../components/ui/Money';
import Notice from '../../components/ui/Notice';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatRupiah, formatTanggalPanjang } from '../../utils/format';

export default function CoaTabSaldoAwal() {
  const proyeks = useProyekStore((s) => s.items);
  const akuns = useCoaStore((s) => s.items);
  const { periodes, fetchSaldoAwal, updateSaldo, tutupBuku } = useSaldoAwalStore();

  const [selectedProyekId, setSelectedProyekId] = useState(proyeks[0]?.id || '');
  const [filterKategori, setFilterKategori] = useState('all');
  const [confirmTutup, setConfirmTutup] = useState(false);

  const periode = periodes[selectedProyekId] ?? null;

  // Periode saldo awal dibuat saat proyek pertama kali dibuka, di luar render
  useEffect(() => {
    if (selectedProyekId && !periode) fetchSaldoAwal(selectedProyekId);
  }, [selectedProyekId, periode, fetchSaldoAwal]);

  // Hanya akun daun yang aktif: saldo akun induk adalah jumlah anak-anaknya
  const leafAkuns = useMemo(() => {
    const parentIds = new Set(akuns.map((a) => a.akunIndukId).filter(Boolean));
    return akuns
      .filter((a) => a.status === 'aktif' && !parentIds.has(a.id))
      .filter((a) => filterKategori === 'all' || a.kategori === filterKategori)
      .sort((a, b) => a.kodeAkun.localeCompare(b.kodeAkun));
  }, [akuns, filterKategori]);

  const isTerbuka = periode?.status === 'terbuka';
  const getSaldo = (akunId: string) => periode?.saldo.find((x: any) => x.akunId === akunId) ?? { debit: 0, kredit: 0 };

  const totalDebit = leafAkuns.reduce((sum, a) => sum + getSaldo(a.id).debit, 0);
  const totalKredit = leafAkuns.reduce((sum, a) => sum + getSaldo(a.id).kredit, 0);
  const selisih = Math.abs(totalDebit - totalKredit);
  const isSeimbang = selisih === 0;

  const handleChange = (akunId: string, side: 'debit' | 'kredit', val: string) => {
    if (!periode) return;
    const num = Number(val);
    const existing = getSaldo(akunId);
    const value = Number.isNaN(num) ? 0 : num;
    updateSaldo(selectedProyekId, akunId, {
      debit: side === 'debit' ? value : existing.debit,
      kredit: side === 'kredit' ? value : existing.kredit
    });
  };

  if (!proyeks.length) {
    return (
      <Panel>
        <EmptyState icon={PiBuildings} title="Belum ada proyek" description="Saldo awal dicatat per proyek. Buat proyek terlebih dahulu." />
      </Panel>
    );
  }

  const selectedProyek = proyeks.find((p) => p.id === selectedProyekId);

  return (
    <>
      <Notice title="Diisi sekali saat migrasi atau awal pembukuan">
        Masukkan saldo awal neraca proyek, pastikan total debit dan kredit sama, lalu tutup buku. Setelah ditutup, nominal saldo awal
        tidak bisa diubah lagi.
      </Notice>

      <Panel
        title={
          <span className="flex flex-wrap items-center gap-2">
            Saldo awal {selectedProyek?.nama}
            <Badge tone={isTerbuka ? 'warning' : 'positive'}>
              {isTerbuka ? <PiLockSimpleOpen aria-hidden /> : <PiLockSimple aria-hidden />}
              {isTerbuka ? 'Belum ditutup' : 'Sudah ditutup'}
            </Badge>
          </span>
        }
        description={periode?.tanggalMulai ? `Per ${formatTanggalPanjang(periode.tanggalMulai)}` : undefined}
        flush
        actions={
          isTerbuka && (
            <Button variant="primary" icon={PiLockSimple} disabled={!isSeimbang} onClick={() => setConfirmTutup(true)}>
              Tutup buku saldo awal
            </Button>
          )
        }
      >
        <div className="grid grid-cols-1 gap-3 border-b border-line px-4 py-3.5 sm:grid-cols-2 sm:px-5 lg:max-w-2xl">
          <div>
            <label htmlFor="sa-proyek" className="field-label">Proyek</label>
            <select id="sa-proyek" className="control" value={selectedProyekId} onChange={(e) => setSelectedProyekId(e.target.value)}>
              {proyeks.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sa-kategori" className="field-label">Kategori akun</label>
            <select id="sa-kategori" className="control" value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
              <option value="all">Semua kategori</option>
              {Object.entries(KATEGORI_AKUN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {!isSeimbang && isTerbuka && (
          <div className="border-b border-line px-4 py-3 sm:px-5">
            <Notice tone="danger" title="Saldo belum seimbang">
              Selisih {formatRupiah(selisih)}. Tutup buku baru bisa dilakukan setelah debit dan kredit sama.
            </Notice>
          </div>
        )}

        <TableScroll label="Saldo awal per akun">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col" className="w-28">Kode</th>
                <th scope="col">Nama akun</th>
                <th scope="col" className="num w-48">Debit</th>
                <th scope="col" className="num w-48">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {leafAkuns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="!py-10 text-center text-ink-3">
                    Tidak ada akun aktif di kategori ini.
                  </td>
                </tr>
              ) : (
                leafAkuns.map((a) => {
                  const s = getSaldo(a.id);
                  return (
                    <tr key={a.id}>
                      <td className="tabular-nums">{a.kodeAkun}</td>
                      <td className="text-ink">{a.namaAkun}</td>
                      {(['debit', 'kredit'] as const).map((side) => (
                        <td key={side} className={isTerbuka ? '!py-2' : 'num'}>
                          {isTerbuka ? (
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              aria-label={`${side === 'debit' ? 'Debit' : 'Kredit'} ${a.kodeAkun} ${a.namaAkun}`}
                              className="control control-sm control-num"
                              value={s[side] || ''}
                              onChange={(e) => handleChange(a.id, side, e.target.value)}
                              placeholder="0"
                            />
                          ) : s[side] ? (
                            <Money value={s[side]} />
                          ) : (
                            <span className="text-ink-3">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  Total
                  {isSeimbang ? (
                    <Badge tone="positive" className="ml-2">Seimbang</Badge>
                  ) : (
                    <Badge tone="danger" className="ml-2">Selisih</Badge>
                  )}
                </td>
                <td className={`num ${isSeimbang ? '' : 'text-danger'}`}><Money value={totalDebit} /></td>
                <td className={`num ${isSeimbang ? '' : 'text-danger'}`}><Money value={totalKredit} /></td>
              </tr>
            </tfoot>
          </table>
        </TableScroll>
      </Panel>

      <ConfirmDialog
        isOpen={confirmTutup}
        onClose={() => setConfirmTutup(false)}
        onConfirm={() => periode && tutupBuku(periode.id)}
        title="Tutup buku saldo awal"
        message={`Tutup buku saldo awal ${selectedProyek?.nama ?? ''}? Setelah ditutup, nominalnya tidak bisa diubah lagi.`}
        confirmLabel="Tutup buku"
        isDestructive={false}
      />
    </>
  );
}
