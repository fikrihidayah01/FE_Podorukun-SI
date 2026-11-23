import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiFileText, PiCheckCircle, PiHourglassMedium } from 'react-icons/pi';
import PageHeader, { PageBody } from '../../../components/ui/PageHeader';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import TabBar from '../../../components/ui/TabBar';
import { StatGrid, StatTile } from '../../../components/ui/StatTile';
import { formatRupiah, hariIni } from '../../../utils/format';
import { showToast } from '../../../store/toastStore';
import { useTeknikStore, type PengajuanTeknikItem } from '../../../store/teknikStore';

export default function PembayaranTeknikPage() {
  const navigate = useNavigate();
  const {
    items,
    selectedPembayaranId,
    setSelectedPembayaranId,
    catatPembayaran,
    pembayaranSesiIni,
    jumlahPembayaranSesiIni,
  } = useTeknikStore();

  // Hanya item yang sudah disetujui yang dapat dibayar
  const disetujuiItems = useMemo(() => {
    return items.filter((item) => item.status === 'disetujui');
  }, [items]);

  const selectedItem = useMemo(() => {
    return disetujuiItems.find((i) => i.id === selectedPembayaranId) || disetujuiItems[0];
  }, [disetujuiItems, selectedPembayaranId]);

  // Form states for payment
  const sisaBelumDibayar = selectedItem
    ? Math.max(0, selectedItem.disetujui - selectedItem.totalDibayar)
    : 0;

  const [nominalBayarInput, setNominalBayarInput] = useState<string>(
    sisaBelumDibayar > 0 ? String(sisaBelumDibayar) : '22500000'
  );
  const [selectedBank, setSelectedBank] = useState<string>('Bank Operasional');
  const [tanggalBayar, setTanggalBayar] = useState<string>(hariIni());

  // Handle select payment item
  const handleSelectItem = (item: PengajuanTeknikItem) => {
    setSelectedPembayaranId(item.id);
    const sisa = Math.max(0, item.disetujui - item.totalDibayar);
    setNominalBayarInput(String(sisa > 0 ? sisa : item.disetujui));
  };

  const nominalBayarNum = Number(nominalBayarInput) || 0;

  // Stat calculations
  const totalBelumDibayar = disetujuiItems.reduce(
    (acc, i) => acc + Math.max(0, i.disetujui - i.totalDibayar),
    0
  );

  const handleCatatPembayaran = () => {
    if (!selectedItem) return;
    if (nominalBayarNum <= 0) {
      showToast.error('Nominal pembayaran harus lebih dari Rp0');
      return;
    }
    if (nominalBayarNum > sisaBelumDibayar) {
      showToast.error(`Nominal pembayaran melebihi sisa belum dibayar (${formatRupiah(sisaBelumDibayar)})`);
      return;
    }

    catatPembayaran(selectedItem.id, nominalBayarNum, selectedBank, tanggalBayar);
    showToast.success(`Pembayaran ${formatRupiah(nominalBayarNum)} berhasil dicatat ke jurnal`);

    // Reset input to remaining
    const newSisa = sisaBelumDibayar - nominalBayarNum;
    setNominalBayarInput(String(newSisa > 0 ? newSisa : 0));
  };

  const tabs = (
    <TabBar
      tabs={[
        { key: 'pengajuan', label: 'Pengajuan Teknik' },
        { key: 'pembayaran', label: 'Pembayaran Teknik' },
      ]}
      activeTab="pembayaran"
      onTabChange={(key) => navigate(`/keuangan/teknik/${key}`)}
      idPrefix="teknik"
      label="Menu teknik"
    />
  );

  return (
    <>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>Pembayaran Teknik</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Periode terbuka
            </span>
          </div>
        }
        description="Pengajuan yang sudah disetujui dan menunggu dibayar. Setiap pembayaran membuat jurnalnya sendiri."
        tabs={tabs}
      />

      <PageBody>
        {/* 3 Stat Tiles */}
        <StatGrid columns={3}>
          <StatTile
            label="Belum dibayar"
            value={formatRupiah(totalBelumDibayar)}
            hint={`${disetujuiItems.filter((i) => i.disetujui > i.totalDibayar).length} pengajuan`}
            icon={PiFileText}
            fullValue={formatRupiah(totalBelumDibayar)}
          />
          <StatTile
            label="Dicatat di sesi ini"
            value={formatRupiah(pembayaranSesiIni)}
            hint={`${jumlahPembayaranSesiIni} pembayaran`}
            icon={PiCheckCircle}
            fullValue={formatRupiah(pembayaranSesiIni)}
          />
          <StatTile
            label="Jatuh tempo minggu ini"
            value="1 cicilan"
            hint="Termin III G-03, pembayaran ke-3"
            icon={PiHourglassMedium}
          />
        </StatGrid>

        {/* Two-Column Payment Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Disetujui, Menunggu Dibayar Table */}
          <div className="lg:col-span-7">
            <Panel
              title="Disetujui, menunggu dibayar"
              description="Pilih pengajuan untuk mencatat pembayarannya."
              flush
            >
              <TableScroll label="Daftar pengajuan teknik yang disetujui dan menunggu dibayar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs font-semibold text-ink-3 uppercase tracking-wide">
                      <th className="px-4 py-3 sm:px-5 text-left">Pengajuan</th>
                      <th className="px-4 py-3 text-left">Nilai kontrak</th>
                      <th className="px-4 py-3 text-left">Disetujui</th>
                      <th className="px-4 py-3 text-left">Dibayar</th>
                      <th className="px-4 py-3 text-left">Sisa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {disetujuiItems.map((item) => {
                      const sisa = Math.max(0, item.disetujui - item.totalDibayar);
                      const isSelected = selectedItem?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-red-50/60 font-medium'
                              : 'hover:bg-neutral-soft/50'
                          }`}
                        >
                          <td className="px-4 py-3 sm:px-5 text-left">
                            <p className={`font-semibold ${isSelected ? 'text-[#cf1b1a]' : 'text-ink'}`}>
                              {item.judul}
                            </p>
                            <p className="text-xs text-ink-3 mt-0.5">
                              {item.kontraktorNama} · {item.progresInfo || 'Disetujui'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-left tabular-nums text-ink-2">
                            {item.nilaiKontrakSpk ? formatRupiah(item.nilaiKontrakSpk) : '-'}
                          </td>
                          <td className="px-4 py-3 text-left tabular-nums text-ink">
                            {formatRupiah(item.disetujui)}
                          </td>
                          <td className="px-4 py-3 text-left tabular-nums text-ink-2">
                            {formatRupiah(item.totalDibayar)}
                          </td>
                          <td className="px-4 py-3 text-left tabular-nums font-bold text-ink">
                            {formatRupiah(sisa)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableScroll>
            </Panel>
          </div>

          {/* Right Column: Payment Form & Journal Preview */}
          {selectedItem && (
            <div className="lg:col-span-5 rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-sm border-t-4 border-t-[#cf1b1a] space-y-5">
              {/* Header Info */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink tracking-tight">
                    {selectedItem.judul}
                  </h2>
                  <p className="text-xs text-ink-3 mt-0.5">
                    {selectedItem.subjudul}
                  </p>
                </div>
                {selectedItem.nilaiKontrakSpk ? (
                  <div className="text-right whitespace-nowrap">
                    <p className="text-[11px] text-ink-3">Total nilai kontrak SPK</p>
                    <p className="text-xs font-bold text-ink">
                      {formatRupiah(selectedItem.nilaiKontrakSpk)}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Big Sisa Summary Box */}
              <div className="rounded-xl border border-line bg-canvas/60 p-4 flex justify-between items-center">
                <span className="text-xs font-semibold text-ink-2">Sisa belum dibayar</span>
                <span className="text-xl font-bold text-ink tabular-nums">
                  {formatRupiah(sisaBelumDibayar)}
                </span>
              </div>

              {/* Form Input Nominal Dibayar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink uppercase tracking-wide">
                  Nominal dibayar
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-3">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={nominalBayarInput}
                    onChange={(e) => setNominalBayarInput(e.target.value)}
                    className="w-full rounded-xl border border-line bg-canvas/30 py-2.5 pl-11 pr-3 text-base font-bold text-ink tabular-nums focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                {/* Quick Fill Pills */}
                <div className="flex gap-2">
                  {selectedItem.disetujui > 0 && (
                    <button
                      type="button"
                      onClick={() => setNominalBayarInput(String(Math.round(selectedItem.disetujui / 3)))}
                      className="rounded-lg border border-line bg-canvas/80 px-2.5 py-1 text-xs font-medium text-ink-2 hover:bg-neutral-soft cursor-pointer transition-colors"
                    >
                      1/3 termin · {formatRupiah(Math.round(selectedItem.disetujui / 3))}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setNominalBayarInput(String(sisaBelumDibayar))}
                    className="rounded-lg border border-line bg-canvas/80 px-2.5 py-1 text-xs font-medium text-ink-2 hover:bg-neutral-soft cursor-pointer transition-colors"
                  >
                    Semua sisa
                  </button>
                </div>
              </div>

              {/* 2-Column Selects: Dibayar dari & Tanggal bayar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wide mb-1">
                    Dibayar dari
                  </label>
                  <select
                    className="control w-full text-xs sm:text-sm"
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                  >
                    <option value="Bank Operasional">Bank Operasional</option>
                    <option value="Bank Mandiri 142">Bank Mandiri (142-00-112233-4)</option>
                    <option value="Bank BCA 012">Bank BCA (012-345-6789)</option>
                    <option value="Kas Kecil Proyek">Kas Kecil Proyek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wide mb-1">
                    Tanggal bayar
                  </label>
                  <input
                    type="date"
                    value={tanggalBayar}
                    onChange={(e) => setTanggalBayar(e.target.value)}
                    className="control w-full text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Pratinjau Jurnal Box */}
              <div className="rounded-xl border border-red-100 bg-[#fffbfc] p-3.5 space-y-2">
                <p className="text-xs font-bold text-ink uppercase tracking-wide">
                  Pratinjau jurnal
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-ink-2">
                      {selectedItem.jenis === 'Pengajuan Dana' ? 'Biaya Operasional / Infrastruktur' : 'Hutang Kontraktor'}
                    </span>
                    <span className="tabular-nums font-semibold text-ink">
                      {formatRupiah(nominalBayarNum)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-ink-3">
                    <span className="pl-4">{selectedBank}</span>
                    <span className="tabular-nums font-semibold text-ink">
                      {formatRupiah(nominalBayarNum)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={nominalBayarNum <= 0 || sisaBelumDibayar <= 0}
                onClick={handleCatatPembayaran}
                className="w-full rounded-xl bg-[#cf1b1a] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#b01716] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Catat pembayaran {formatRupiah(nominalBayarNum)}
              </button>

              {/* Riwayat Pembayaran */}
              {selectedItem.riwayatPembayaran && selectedItem.riwayatPembayaran.length > 0 && (
                <div className="border-t border-line pt-4 space-y-2">
                  <p className="text-xs font-bold text-ink uppercase tracking-wide">
                    Riwayat pembayaran
                  </p>
                  <div className="space-y-1.5">
                    {selectedItem.riwayatPembayaran.map((rw) => (
                      <div
                        key={rw.id}
                        className="flex justify-between items-center rounded-lg bg-canvas/40 px-3 py-2 text-xs"
                      >
                        <span className="text-ink-2">
                          Ke-{rw.ke} · {rw.tanggal} · {rw.bank}
                        </span>
                        <span className="font-semibold text-ink tabular-nums">
                          {formatRupiah(rw.nominal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </PageBody>
    </>
  );
}
