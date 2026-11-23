import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiImage, PiArrowRight, PiWarning } from 'react-icons/pi';
import PageHeader, { PageBody } from '../../../components/ui/PageHeader';
import Panel, { TableScroll } from '../../../components/ui/Panel';
import Button from '../../../components/ui/Button';
import Badge, { type Tone } from '../../../components/ui/Badge';
import { StatGrid } from '../../../components/ui/StatTile';
import TabBar from '../../../components/ui/TabBar';
import { formatRupiah } from '../../../utils/format';
import { showToast } from '../../../store/toastStore';
import {
  useTeknikStore,
  type StatusPengajuan,
  type PengajuanTeknikItem,
} from '../../../store/teknikStore';

const STATUS_TONE_MAP: Record<StatusPengajuan, Tone> = {
  diajukan: 'brand',
  diperiksa: 'neutral',
  disetujui: 'positive',
  revisi: 'warning',
  ditolak: 'danger',
};

const STATUS_LABEL_MAP: Record<StatusPengajuan, string> = {
  diajukan: 'Diajukan',
  diperiksa: 'Diperiksa',
  disetujui: 'Disetujui',
  revisi: 'Revisi',
  ditolak: 'Ditolak',
};

export default function PengajuanTeknikPage() {
  const navigate = useNavigate();
  const {
    items,
    selectedPengajuanId,
    setSelectedPengajuanId,
    setujuiPengajuan,
    mintaRevisiPengajuan,
    tolakPengajuan,
  } = useTeknikStore();

  const [filterBidang, setFilterBidang] = useState<string>('Semua bidang');
  const [filterProyek, setFilterProyek] = useState<string>('Semua proyek');
  const [filterJenis, setFilterJenis] = useState<string>('Semua jenis');
  const [filterStatus, setFilterStatus] = useState<string>('Perlu diperiksa');

  // Selected item
  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedPengajuanId) || items[0];
  }, [items, selectedPengajuanId]);

  // Image tab in detail panel
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Editable fields in review panel
  const [nominalDisetujuiInput, setNominalDisetujuiInput] = useState<string>(
    selectedItem ? String(selectedItem.disetujui) : '60000000'
  );
  const [alasanSelisihInput, setAlasanSelisihInput] = useState<string>(
    selectedItem ? selectedItem.alasanSelisih || '' : ''
  );

  // Sync state when selectedItem changes
  const handleSelectPengajuan = (item: PengajuanTeknikItem) => {
    setSelectedPengajuanId(item.id);
    setNominalDisetujuiInput(String(item.disetujui));
    setAlasanSelisihInput(item.alasanSelisih || '');
    setActiveImageIndex(0);
  };

  // Filtered list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterBidang !== 'Semua bidang' && item.bidang !== filterBidang) return false;
      if (filterProyek !== 'Semua proyek' && item.proyekNama !== filterProyek) return false;
      if (filterJenis !== 'Semua jenis' && item.jenis !== filterJenis) return false;

      if (filterStatus === 'Perlu diperiksa') {
        return item.status === 'diajukan' || item.status === 'diperiksa';
      }
      if (filterStatus !== 'Semua status') {
        return item.status.toLowerCase() === filterStatus.toLowerCase();
      }
      return true;
    });
  }, [items, filterBidang, filterProyek, filterJenis, filterStatus]);

  // Stat calculations
  const perluDiperiksaItems = items.filter((i) => i.status === 'diajukan' || i.status === 'diperiksa');
  const totalDiajukanPerluDiperiksa = perluDiperiksaItems.reduce((acc, i) => acc + i.diajukan, 0);

  const disetujuiItems = items.filter((i) => i.status === 'disetujui');
  const totalDisetujuiBelumDibayar = disetujuiItems.reduce(
    (acc, i) => acc + Math.max(0, i.disetujui - i.totalDibayar),
    0
  );

  const revisiItems = items.filter((i) => i.status === 'revisi');

  // Difference calculation
  const nominalDisetujuiNum = Number(nominalDisetujuiInput) || 0;
  const selisih = selectedItem ? selectedItem.diajukan - nominalDisetujuiNum : 0;

  const handleSetujui = () => {
    if (!selectedItem) return;
    if (selisih > 0 && !alasanSelisihInput.trim()) {
      showToast.error('Wajib mengisi alasan selisih sebelum menyetujui');
      return;
    }
    setujuiPengajuan(selectedItem.id, nominalDisetujuiNum, alasanSelisihInput);
    showToast.success(
      selisih > 0
        ? `Pengajuan ${selectedItem.judul} disetujui sebagian (${formatRupiah(nominalDisetujuiNum)})`
        : `Pengajuan ${selectedItem.judul} disetujui penuh (${formatRupiah(nominalDisetujuiNum)})`
    );
  };

  const handleMintaRevisi = () => {
    if (!selectedItem) return;
    if (!alasanSelisihInput.trim()) {
      showToast.error('Mohon isi catatan atau alasan revisi');
      return;
    }
    mintaRevisiPengajuan(selectedItem.id, alasanSelisihInput);
    showToast.success(`Pengajuan ${selectedItem.judul} dikembalikan untuk revisi`);
  };

  const handleTolak = () => {
    if (!selectedItem) return;
    if (!alasanSelisihInput.trim()) {
      showToast.error('Mohon isi alasan penolakan');
      return;
    }
    tolakPengajuan(selectedItem.id, alasanSelisihInput);
    showToast.error(`Pengajuan ${selectedItem.judul} ditolak`);
  };

  const tabs = (
    <TabBar
      tabs={[
        { key: 'pengajuan', label: 'Pengajuan Teknik' },
        { key: 'pembayaran', label: 'Pembayaran Teknik' },
      ]}
      activeTab="pengajuan"
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
            <span>Pengajuan Teknik</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Periode terbuka
            </span>
          </div>
        }
        description="Satu antrean untuk Adendum, Tagihan, Retensi, dan Pengajuan Dana dari bidang Rumah, Infrastruktur, dan Lain-lain."
        tabs={tabs}
      />

      <PageBody>
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 bg-surface p-4 rounded-xl border border-line shadow-xs">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
            Bidang
            <select
              className="control w-40 text-sm"
              value={filterBidang}
              onChange={(e) => setFilterBidang(e.target.value)}
            >
              <option value="Semua bidang">Semua bidang</option>
              <option value="Rumah">Rumah</option>
              <option value="Infrastruktur">Infrastruktur</option>
              <option value="Lain-lain">Lain-lain</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
            Proyek
            <select
              className="control w-44 text-sm"
              value={filterProyek}
              onChange={(e) => setFilterProyek(e.target.value)}
            >
              <option value="Semua proyek">Semua proyek</option>
              <option value="Atlantis Hills">Atlantis Hills</option>
              <option value="Atlantis Icon">Atlantis Icon</option>
              <option value="Kantor">Kantor</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
            Jenis berkas
            <select
              className="control w-44 text-sm"
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
            >
              <option value="Semua jenis">Semua jenis</option>
              <option value="Tagihan">Tagihan</option>
              <option value="Adendum">Adendum</option>
              <option value="Retensi">Retensi</option>
              <option value="Pengajuan Dana">Pengajuan Dana</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
            Status
            <select
              className="control w-44 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Perlu diperiksa">Perlu diperiksa</option>
              <option value="Semua status">Semua status</option>
              <option value="Diajukan">Diajukan</option>
              <option value="Diperiksa">Diperiksa</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Revisi">Revisi</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </label>
        </div>

        {/* 4 Stat Tiles with top accent line */}
        <StatGrid>
          <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-sm border-t-4 border-t-[#cf1b1a]">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide">Perlu diperiksa</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
              {perluDiperiksaItems.length} berkas
            </p>
            <p className="mt-1 text-xs text-ink-3">
              Rp{(totalDiajukanPerluDiperiksa / 1_000_000).toFixed(2).replace('.', ',')} Jt diajukan
            </p>
          </div>

          <div
            onClick={() => navigate('/keuangan/teknik/pembayaran')}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-sm border-t-4 border-t-[#cf1b1a] hover:border-ink/30 transition-colors"
          >
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide">Disetujui, belum dibayar</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
              Rp{(totalDisetujuiBelumDibayar / 1_000_000).toFixed(1).replace('.', ',')} Jt
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#cf1b1a] group-hover:underline">
              <span>Catat pembayaran</span>
              <PiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-sm border-t-4 border-t-[#cf1b1a]">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide">Dibayar bulan ini</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink">Rp0</p>
            <p className="mt-1 text-xs text-ink-3">November 2026</p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-sm border-t-4 border-t-[#cf1b1a]">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide">Dikembalikan untuk revisi</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
              {revisiItems.length} berkas
            </p>
            <p className="mt-1 text-xs text-ink-3">Menunggu Teknik</p>
          </div>
        </StatGrid>

        {/* Two-Column Review Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Antrean Berkas */}
          <div className="lg:col-span-7">
            <Panel
              title="Antrean"
              description="Pilih berkas untuk diperiksa."
              flush
            >
              <TableScroll label="Daftar antrean berkas pengajuan teknik">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs font-semibold text-ink-3 uppercase tracking-wide">
                      <th className="px-4 py-3 sm:px-5">Berkas</th>
                      <th className="px-4 py-3">Bidang</th>
                      <th className="px-4 py-3 text-right">Diajukan</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-sm text-ink-3">
                          Tidak ada berkas yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isSelected = selectedItem?.id === item.id;
                        return (
                          <tr
                            key={item.id}
                            onClick={() => handleSelectPengajuan(item)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-red-50/60 font-medium'
                                : 'hover:bg-neutral-soft/50'
                            }`}
                          >
                            <td className="px-4 py-3 sm:px-5">
                              <p className={`font-semibold ${isSelected ? 'text-[#cf1b1a]' : 'text-ink'}`}>
                                {item.judul}
                              </p>
                              <p className="text-xs text-ink-3 mt-0.5">{item.subjudul}</p>
                            </td>
                            <td className="px-4 py-3 text-ink-2 whitespace-nowrap">{item.bidang}</td>
                            <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">
                              {formatRupiah(item.diajukan)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge tone={STATUS_TONE_MAP[item.status]}>
                                {STATUS_LABEL_MAP[item.status]}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </TableScroll>
            </Panel>
          </div>

          {/* Right Column: Review & Approval Panel */}
          {selectedItem && (
            <div className="lg:col-span-5 rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-sm border-t-4 border-t-[#cf1b1a] space-y-5">
              {/* Header Details */}
              <div>
                <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                  {selectedItem.kategoriLabel}
                </p>
                <h2 className="mt-1 text-xl font-bold text-ink tracking-tight">
                  {selectedItem.judul}
                </h2>
                <p className="mt-1 text-xs text-ink-3 leading-relaxed">
                  {selectedItem.spkNomor}
                  {selectedItem.progresInfo && ` · ${selectedItem.progresInfo}`}
                </p>
              </div>

              {/* Rincian Diajukan */}
              <div className="rounded-xl border border-line/80 bg-canvas/60 p-4 space-y-2 text-sm">
                {selectedItem.rincianDiajukan.map((r, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-ink-2">{r.label}</span>
                    <span className="tabular-nums font-medium text-ink">
                      {r.nominal < 0 ? `-Rp${Math.abs(r.nominal).toLocaleString('id-ID')}` : formatRupiah(r.nominal)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-line pt-2 flex justify-between items-center font-bold text-sm">
                  <span className="text-ink">Nominal diajukan</span>
                  <span className="tabular-nums text-ink">{formatRupiah(selectedItem.diajukan)}</span>
                </div>
              </div>

              {/* Bukti Pendukung */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-ink uppercase tracking-wide">Bukti pendukung</span>
                  <span className="text-xs text-ink-3">
                    {selectedItem.gambarBukti.length} gambar
                  </span>
                </div>

                {selectedItem.gambarBukti.length > 0 ? (
                  <>
                    {/* Active Image Preview Box */}
                    <div className="relative rounded-xl border border-line bg-canvas flex flex-col items-center justify-center p-6 text-center min-h-[140px]">
                      <div className="h-10 w-10 rounded-full bg-neutral-soft flex items-center justify-center text-ink-3 mb-2">
                        <PiImage className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-xs text-ink">
                        {selectedItem.gambarBukti[activeImageIndex]?.nama || 'opname.jpg'}
                      </p>
                      <p className="text-[11px] text-ink-3 mt-0.5">
                        {selectedItem.gambarBukti[activeImageIndex]?.keterangan || 'Dokumentasi lapangan'}
                      </p>
                    </div>

                    {/* Image Selector Thumbnails */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedItem.gambarBukti.map((gb, idx) => {
                        const isActive = idx === activeImageIndex;
                        return (
                          <button
                            key={gb.id}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`flex-1 min-w-[80px] rounded-lg border px-2 py-1.5 text-center text-xs font-medium transition-colors cursor-pointer ${
                              isActive
                                ? 'border-[#cf1b1a] bg-red-50 text-[#cf1b1a] font-semibold'
                                : 'border-line bg-surface text-ink-2 hover:bg-neutral-soft'
                            }`}
                          >
                            <p className="truncate">{gb.nama}</p>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-ink-3">
                    Tidak ada gambar bukti yang dilampirkan.
                  </div>
                )}

                <p className="text-[11px] text-ink-3 leading-relaxed">
                  Gambar diunggah Teknik saat mengajukan. Pengajuan tanpa gambar bukti tidak bisa dikirim ke Keuangan.
                </p>
              </div>

              {/* Form Input Nominal Disetujui */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink uppercase tracking-wide">
                  Nominal disetujui
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-3">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={nominalDisetujuiInput}
                    onChange={(e) => setNominalDisetujuiInput(e.target.value)}
                    className="w-full rounded-xl border border-line bg-canvas/30 py-2.5 pl-11 pr-3 text-base font-bold text-ink tabular-nums focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>
              </div>

              {/* Selisih Notice */}
              {selisih > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-amber-900 space-y-1">
                  <p className="text-xs font-bold flex items-center gap-1.5 text-amber-950">
                    <PiWarning className="h-4 w-4 text-amber-700" />
                    <span>Selisih {formatRupiah(selisih)}</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-900/90">
                    Selisih tetap menjadi sisa Termin II. Teknik bisa mengajukan tagihan susulan, atau Keuangan menutupnya sebagai potongan dengan alasan.
                  </p>
                </div>
              )}

              {/* Alasan Selisih Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-ink uppercase tracking-wide">Alasan selisih</span>
                  <span className="text-[11px] font-semibold text-[#cf1b1a]">
                    {selisih > 0 ? 'wajib, terlihat oleh Teknik' : 'opsional'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={alasanSelisihInput}
                  onChange={(e) => setAlasanSelisihInput(e.target.value)}
                  placeholder="Tuliskan catatan atau alasan penyesuaian..."
                  className="w-full rounded-xl border border-line bg-canvas/30 p-3 text-xs sm:text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink placeholder:text-ink-3"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={handleTolak}
                  className="flex-1 text-xs font-semibold hover:border-red-300 hover:text-red-700"
                >
                  Tolak
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleMintaRevisi}
                  className="flex-1 text-xs font-semibold"
                >
                  Minta revisi
                </Button>
                <button
                  type="button"
                  onClick={handleSetujui}
                  className="flex-1 min-w-[140px] rounded-xl bg-[#cf1b1a] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#b01716] active:scale-95 transition-all cursor-pointer"
                >
                  {selisih > 0 ? 'Setujui sebagian' : 'Setujui penuh'}
                </button>
              </div>

              {/* Legal / Director Signature Footnote */}
              <p className="text-[11px] text-ink-3 leading-relaxed border-t border-line pt-3">
                Persetujuan Direktur tetap manual lewat tanda tangan di PDF. PDF pengajuan mencantumkan nominal diajukan dan disetujui berdampingan.
              </p>
            </div>
          )}
        </div>
      </PageBody>
    </>
  );
}
