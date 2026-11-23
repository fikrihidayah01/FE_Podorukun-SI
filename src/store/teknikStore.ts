import { create } from 'zustand';

export type BidangTeknik = 'Rumah' | 'Infrastruktur' | 'Lain-lain';
export type JenisBerkas = 'Tagihan' | 'Adendum' | 'Retensi' | 'Pengajuan Dana';
export type StatusPengajuan = 'diajukan' | 'diperiksa' | 'disetujui' | 'revisi' | 'ditolak';

export interface GambarBukti {
  id: string;
  nama: string;
  keterangan: string;
  tanggal: string;
}

export interface RincianNominal {
  label: string;
  nominal: number;
}

export interface RiwayatBayarTeknik {
  id: string;
  ke: number;
  tanggal: string;
  bank: string;
  nominal: number;
}

export interface PengajuanTeknikItem {
  id: string;
  judul: string;
  subjudul: string;
  kategoriLabel: string; // e.g. "Tagihan · Rumah"
  spkNomor: string;
  progresInfo?: string;
  bidang: BidangTeknik;
  proyekId: string;
  proyekNama: string;
  jenis: JenisBerkas;
  status: StatusPengajuan;
  diajukan: number;
  rincianDiajukan: RincianNominal[];
  disetujui: number;
  alasanSelisih?: string;
  alasanTolakOrRevisi?: string;
  gambarBukti: GambarBukti[];
  kontraktorNama: string;
  rekeningBank?: string;
  nilaiKontrakSpk?: number;
  totalDibayar: number;
  tanggalPengajuan: string;
  tanggalDisetujui?: string;
  jatuhTempoInfo?: string;
  riwayatPembayaran: RiwayatBayarTeknik[];
}

interface TeknikState {
  items: PengajuanTeknikItem[];
  selectedPengajuanId: string;
  selectedPembayaranId: string;
  pembayaranSesiIni: number;
  jumlahPembayaranSesiIni: number;

  setSelectedPengajuanId: (id: string) => void;
  setSelectedPembayaranId: (id: string) => void;
  setujuiPengajuan: (id: string, nominalDisetujui: number, alasan?: string) => void;
  mintaRevisiPengajuan: (id: string, alasan: string) => void;
  tolakPengajuan: (id: string, alasan: string) => void;
  catatPembayaran: (id: string, nominal: number, bank: string, tanggal: string) => void;
}

const INITIAL_ITEMS: PengajuanTeknikItem[] = [
  // Antrean pengajuan yang perlu diperiksa (Image 1)
  {
    id: 'pengajuan-1',
    judul: 'Termin II · C-31',
    subjudul: 'Atlantis Hills · Subkon Demo A · 1 Nov',
    kategoriLabel: 'Tagihan · Rumah',
    spkNomor: '014/SPK-UNIT/PRN-AH/V/2026',
    progresInfo: 'diajukan Uji Teknik · progres PR Track 70% (syarat 60%)',
    bidang: 'Rumah',
    proyekId: 'atlantis-hills',
    proyekNama: 'Atlantis Hills',
    jenis: 'Tagihan',
    status: 'diajukan',
    diajukan: 74200000,
    rincianDiajukan: [
      { label: 'Nominal Termin II (25%)', nominal: 74600000 },
      { label: 'Listrik dan air', nominal: -400000 },
    ],
    disetujui: 60000000,
    alasanSelisih: 'Opname lantai 2 belum lengkap: sisa dicairkan setelah foto plester diterima.',
    gambarBukti: [
      { id: 'g1', nama: 'opname-1.jpg', keterangan: 'Bata lantai 2 selesai · 1 Nov 2026', tanggal: '2026-11-01' },
      { id: 'g2', nama: 'opname-2.jpg', keterangan: 'Rangka hollow & atap · 1 Nov 2026', tanggal: '2026-11-01' },
      { id: 'g3', nama: 'opname-3.jpg', keterangan: 'Kondisi fasad depan · 1 Nov 2026', tanggal: '2026-11-01' },
    ],
    kontraktorNama: 'Subkon Demo A',
    rekeningBank: 'BCA 012 345 6789',
    nilaiKontrakSpk: 298400000,
    totalDibayar: 0,
    tanggalPengajuan: '2026-11-01',
    riwayatPembayaran: [],
  },
  {
    id: 'pengajuan-2',
    judul: 'Sisa Termin II · E-15',
    subjudul: 'Atlantis Icon · Subkon Demo C · 2 Nov',
    kategoriLabel: 'Tagihan · Rumah',
    spkNomor: '009/SPK-UNIT/PRN-AI/IV/2026',
    progresInfo: 'diajukan Uji Teknik · progres PR Track 55% (syarat 50%)',
    bidang: 'Rumah',
    proyekId: 'atlantis-icon',
    proyekNama: 'Atlantis Icon',
    jenis: 'Tagihan',
    status: 'diajukan',
    diajukan: 15740000,
    rincianDiajukan: [
      { label: 'Sisa Termin II', nominal: 15740000 },
    ],
    disetujui: 15740000,
    gambarBukti: [
      { id: 'g4', nama: 'opname-e15.jpg', keterangan: 'Pemasangan dinding bata · 2 Nov 2026', tanggal: '2026-11-02' },
    ],
    kontraktorNama: 'Subkon Demo C',
    rekeningBank: 'BRI 0341 01 002938 50 1',
    nilaiKontrakSpk: 260000000,
    totalDibayar: 0,
    tanggalPengajuan: '2026-11-02',
    riwayatPembayaran: [],
  },
  {
    id: 'pengajuan-3',
    judul: 'A-08 · pekerjaan tambah kurang',
    subjudul: 'Atlantis Hills · 30 Okt',
    kategoriLabel: 'Adendum · Rumah',
    spkNomor: '011/SPK-UNIT/PRN-AH/V/2026',
    progresInfo: 'Penambahan kanopi & meja dapur cor',
    bidang: 'Rumah',
    proyekId: 'atlantis-hills',
    proyekNama: 'Atlantis Hills',
    jenis: 'Adendum',
    status: 'diperiksa',
    diajukan: 1274500,
    rincianDiajukan: [
      { label: 'Adendum pekerjaan kanopi', nominal: 1274500 },
    ],
    disetujui: 1274500,
    gambarBukti: [
      { id: 'g5', nama: 'adendum-a08.jpg', keterangan: 'Rangka hollow kanopi selesai · 30 Okt 2026', tanggal: '2026-10-30' },
    ],
    kontraktorNama: 'Subkon Demo B',
    rekeningBank: 'BNI 128 993 4821',
    nilaiKontrakSpk: 280000000,
    totalDibayar: 0,
    tanggalPengajuan: '2026-10-30',
    riwayatPembayaran: [],
  },
  {
    id: 'pengajuan-4',
    judul: 'Retensi · H-02',
    subjudul: 'Atlantis Hills · Subkon Demo D · 31 Okt',
    kategoriLabel: 'Retensi · Rumah',
    spkNomor: '004/SPK-UNIT/PRN-AH/II/2026',
    progresInfo: 'Masa retensi 90 hari selesai tanpa komplain',
    bidang: 'Rumah',
    proyekId: 'atlantis-hills',
    proyekNama: 'Atlantis Hills',
    jenis: 'Retensi',
    status: 'diajukan',
    diajukan: 6700000,
    rincianDiajukan: [
      { label: 'Retensi 5% SPK', nominal: 6700000 },
    ],
    disetujui: 6700000,
    gambarBukti: [
      { id: 'g6', nama: 'retensi-h02.jpg', keterangan: 'Berita acara pemeriksaan fisik retensi · 31 Okt 2026', tanggal: '2026-10-31' },
    ],
    kontraktorNama: 'Subkon Demo D',
    rekeningBank: 'BCA 012 345 6789',
    nilaiKontrakSpk: 134000000,
    totalDibayar: 0,
    tanggalPengajuan: '2026-10-31',
    riwayatPembayaran: [],
  },
  {
    id: 'pengajuan-5',
    judul: 'Pengadaan material',
    subjudul: 'Atlantis Icon · 29 Okt',
    kategoriLabel: 'Pengajuan Dana · Infrastruktur',
    spkNomor: '002/SPK-INFRA/PRN-AI/X/2026',
    progresInfo: 'Pengadaan paving block K-300 untuk jalan utama blok B',
    bidang: 'Infrastruktur',
    proyekId: 'atlantis-icon',
    proyekNama: 'Atlantis Icon',
    jenis: 'Pengajuan Dana',
    status: 'diperiksa',
    diajukan: 12450000,
    rincianDiajukan: [
      { label: 'Paving block tebal 8cm (150 m2)', nominal: 12450000 },
    ],
    disetujui: 12450000,
    gambarBukti: [
      { id: 'g7', nama: 'material-paving.jpg', keterangan: 'Surat jalan & nota material · 29 Okt 2026', tanggal: '2026-10-29' },
    ],
    kontraktorNama: 'CV Mitra Bangunan',
    rekeningBank: 'Mandiri 142 00 998877 6',
    nilaiKontrakSpk: 150000000,
    totalDibayar: 0,
    tanggalPengajuan: '2026-10-29',
    riwayatPembayaran: [],
  },
  {
    id: 'pengajuan-6',
    judul: 'Upah harian kantor',
    subjudul: 'Kantor · 28 Okt',
    kategoriLabel: 'Pengajuan Dana · Lain-lain',
    spkNomor: 'UPAH-OPS/X/2026',
    progresInfo: 'Pekerjaan pengecatan dan talang air kantor pemasaran',
    bidang: 'Lain-lain',
    proyekId: 'kantor',
    proyekNama: 'Kantor',
    jenis: 'Pengajuan Dana',
    status: 'diajukan',
    diajukan: 3600000,
    rincianDiajukan: [
      { label: 'Upah 4 tukang (6 hari)', nominal: 3600000 },
    ],
    disetujui: 3600000,
    gambarBukti: [
      { id: 'g8', nama: 'absensi-tukang.jpg', keterangan: 'Absensi harian mandor & foto pengerjaan · 28 Okt 2026', tanggal: '2026-10-28' },
    ],
    kontraktorNama: 'Mandor Supriadi',
    rekeningBank: 'BCA 889 012 3456',
    nilaiKontrakSpk: 0,
    totalDibayar: 0,
    tanggalPengajuan: '2026-10-28',
    riwayatPembayaran: [],
  },

  // Berkas dalam revisi (Image 1 tile 4)
  {
    id: 'pengajuan-revisi-1',
    judul: 'Termin I · B-02',
    subjudul: 'Atlantis Hills · Subkon Demo E · 26 Okt',
    kategoriLabel: 'Tagihan · Rumah',
    spkNomor: '010/SPK-UNIT/PRN-AH/IV/2026',
    progresInfo: 'Pondasi sloof selesai 20%',
    bidang: 'Rumah',
    proyekId: 'atlantis-hills',
    proyekNama: 'Atlantis Hills',
    jenis: 'Tagihan',
    status: 'revisi',
    diajukan: 45000000,
    rincianDiajukan: [
      { label: 'Termin I Pondasi (20%)', nominal: 45000000 },
    ],
    disetujui: 0,
    alasanTolakOrRevisi: 'Foto pembesian sloof tidak terlihat jelas, mohon upload ulang dokumentasi opname.',
    gambarBukti: [
      { id: 'g9', nama: 'pondasi-b02.jpg', keterangan: 'Pengecoran sloof · 26 Okt 2026', tanggal: '2026-10-26' },
    ],
    kontraktorNama: 'Subkon Demo E',
    rekeningBank: 'BSI 712 345 6789',
    nilaiKontrakSpk: 225000000,
    totalDibayar: 0,
    tanggalPengajuan: '2026-10-26',
    riwayatPembayaran: [],
  },

  // Pengajuan yang sudah disetujui dan menunggu dibayar (Image 2)
  {
    id: 'bayar-1',
    judul: 'Tagihan Termin III · G-03',
    subjudul: 'Subkon Demo D · BCA 012 345 6789',
    kategoriLabel: 'Tagihan · Rumah',
    spkNomor: '007/SPK-UNIT/PRN-AH/III/2026',
    progresInfo: 'disetujui 22 Okt',
    bidang: 'Rumah',
    proyekId: 'atlantis-hills',
    proyekNama: 'Atlantis Hills',
    jenis: 'Tagihan',
    status: 'disetujui',
    diajukan: 67500000,
    rincianDiajukan: [
      { label: 'Termin III Atap & Plester', nominal: 67500000 },
    ],
    disetujui: 67500000,
    gambarBukti: [],
    kontraktorNama: 'Subkon Demo D',
    rekeningBank: 'BCA 012 345 6789',
    nilaiKontrakSpk: 270000000,
    totalDibayar: 45000000,
    tanggalPengajuan: '2026-10-20',
    tanggalDisetujui: '2026-10-22',
    jatuhTempoInfo: '1 cicilan · Termin III G-03, pembayaran ke-3',
    riwayatPembayaran: [
      { id: 'rw-1', ke: 1, tanggal: '2026-10-28', bank: 'Bank Operasional', nominal: 22500000 },
      { id: 'rw-2', ke: 2, tanggal: '2026-11-04', bank: 'Bank Operasional', nominal: 22500000 },
    ],
  },
  {
    id: 'bayar-2',
    judul: 'Tagihan Termin II · G-04',
    subjudul: 'Subkon Demo D · BCA 012 345 6789',
    kategoriLabel: 'Tagihan · Rumah',
    spkNomor: '008/SPK-UNIT/PRN-AH/III/2026',
    progresInfo: 'disetujui 3 Nov',
    bidang: 'Rumah',
    proyekId: 'atlantis-hills',
    proyekNama: 'Atlantis Hills',
    jenis: 'Tagihan',
    status: 'disetujui',
    diajukan: 67500000,
    rincianDiajukan: [
      { label: 'Termin II Dinding & Cor', nominal: 67500000 },
    ],
    disetujui: 67500000,
    gambarBukti: [],
    kontraktorNama: 'Subkon Demo D',
    rekeningBank: 'BCA 012 345 6789',
    nilaiKontrakSpk: 270000000,
    totalDibayar: 0,
    tanggalPengajuan: '2026-11-02',
    tanggalDisetujui: '2026-11-03',
    riwayatPembayaran: [],
  },
  {
    id: 'bayar-3',
    judul: 'Pengajuan Dana · upah harian',
    subjudul: 'Infrastruktur · Mandiri 142 00 1234567 8',
    kategoriLabel: 'Pengajuan Dana · Infrastruktur',
    spkNomor: 'UPAH-INFRA/XI/2026',
    progresInfo: 'disetujui 3 Nov',
    bidang: 'Infrastruktur',
    proyekId: 'atlantis-icon',
    proyekNama: 'Atlantis Icon',
    jenis: 'Pengajuan Dana',
    status: 'disetujui',
    diajukan: 3240000,
    rincianDiajukan: [
      { label: 'Upah tukang drainase & galian', nominal: 3240000 },
    ],
    disetujui: 3240000,
    gambarBukti: [],
    kontraktorNama: 'Mandor Lapangan',
    rekeningBank: 'Mandiri 142 00 1234567 8',
    nilaiKontrakSpk: 0,
    totalDibayar: 0,
    tanggalPengajuan: '2026-11-02',
    tanggalDisetujui: '2026-11-03',
    riwayatPembayaran: [],
  },
];

export const useTeknikStore = create<TeknikState>((set) => ({
  items: INITIAL_ITEMS,
  selectedPengajuanId: 'pengajuan-1',
  selectedPembayaranId: 'bayar-1',
  pembayaranSesiIni: 0,
  jumlahPembayaranSesiIni: 0,

  setSelectedPengajuanId: (id) => set({ selectedPengajuanId: id }),
  setSelectedPembayaranId: (id) => set({ selectedPembayaranId: id }),

  setujuiPengajuan: (id, nominalDisetujui, alasan) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          status: 'disetujui' as StatusPengajuan,
          disetujui: nominalDisetujui,
          alasanSelisih: alasan,
          tanggalDisetujui: new Date().toISOString().split('T')[0],
        };
      }),
    }));
  },

  mintaRevisiPengajuan: (id, alasan) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          status: 'revisi' as StatusPengajuan,
          alasanTolakOrRevisi: alasan,
        };
      }),
    }));
  },

  tolakPengajuan: (id, alasan) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          status: 'ditolak' as StatusPengajuan,
          alasanTolakOrRevisi: alasan,
        };
      }),
    }));
  },

  catatPembayaran: (id, nominal, bank, tanggal) => {
    set((state) => ({
      pembayaranSesiIni: state.pembayaranSesiIni + nominal,
      jumlahPembayaranSesiIni: state.jumlahPembayaranSesiIni + 1,
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        const newRiwayat: RiwayatBayarTeknik = {
          id: `rw-${Date.now()}`,
          ke: (item.riwayatPembayaran?.length ?? 0) + 1,
          tanggal,
          bank,
          nominal,
        };
        const newTotalDibayar = item.totalDibayar + nominal;
        return {
          ...item,
          totalDibayar: newTotalDibayar,
          riwayatPembayaran: [...item.riwayatPembayaran, newRiwayat],
        };
      }),
    }));
  },
}));
