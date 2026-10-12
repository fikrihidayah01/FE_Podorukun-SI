# Pengujian input Keuangan melalui frontend — 13 Oktober 2026

Pengujian memakai browser terhadap frontend lokal dan API nyata dengan PostgreSQL
khusus pengujian (`prsi_test_*` pada loopback). Tidak memakai API mock untuk
skenario di bawah dan tidak memasukkan transaksi ke produksi. Backend produksi
baru belum diaktifkan atas instruksi pemilik.

## Hasil yang diamati

| Alur | Hasil |
|---|---|
| Login dan navigasi delapan halaman utama Keuangan | Berhasil |
| Refresh sesi kedaluwarsa saat menyimpan template | Penyimpanan dilanjutkan otomatis |
| Pustaka pasal: tambah pasal | Tersimpan, HTTP 201 |
| COA: tambah akun hutang, beban, lahan, dan antarproyek | Tersimpan, HTTP 201 |
| COA: nomor rekening bank tujuan PR Track | Tersimpan dalam `noRekening`, HTTP 201 |
| Pemetaan sepuluh akun sistem | Seluruh penyimpanan HTTP 200 |
| Master PT: ubah alamat | Tersimpan, HTTP 200 |
| Template KPR: buat, nonaktifkan, aktifkan | Berhasil |
| Pinjaman satu transfer Rp1.000.000 | Tersimpan sebagai draft pencairan |
| Bukti pencairan dan posting | Upload 201, posting 200; saldo pokok Rp1.000.000 |
| Pembayaran tanpa rincian Rp110.000 | Tersimpan dan menunggu rincian |
| Isi pokok Rp100.000 + bunga Rp10.000, bukti, posting | Berhasil; sisa pokok Rp900.000 |
| Top-up Rp200.000, bukti, posting | Berhasil; sisa pokok Rp1.100.000 |
| SHM: duplikasi kavling | Ditolak 409, data lama dipertahankan |
| SHM: ubah menjadi agunan bank dan baca riwayat | Status dan riwayat tersimpan |
| SHM: filter proyek | Dokumen proyek lain tidak tampil |
| Kontrak Rp500.000 dan adendum menjadi Rp550.000 | Tersimpan dengan jurnal akrual |
| Termin Rp100.000, bukti, posting | Terbayar Rp100.000, sisa Rp450.000 |
| Pembatalan kontrak setelah termin diposting | HTTP 200, sisa hutang nol dan riwayat tetap ada |
| Detail kontrak | Satu permintaan selama observasi dua detik; tidak berulang |
| Mutasi lahan Rp300.000 dengan pihak baru | Tersimpan atomik dan muncul di saldo |
| Mutasi antarproyek Rp400.000, bukti, posting | Kedua sisi mirror tampil |
| Jurnal balik mutasi lahan Rp300.000 | HTTP 201; jurnal asal dikoreksi, jurnal balik tersimpan |
| Piutang: BAST dengan HPP Rp800 | Tersimpan dan berpindah ke filter sudah BAST |
| Pembayaran fixture PR Track: rekening tidak dikenal | Status gagal validasi, tanpa jurnal |
| Pembayaran fixture PR Track: bukti belum ada | Draft terbentuk dan alasan tampil |
| Lengkapi bukti pembayaran Track dan posting | Status dijurnal; dibayar Rp100 dan sisa Rp1.200 |
| Pindah alokasi Rp40 Oktober ke November | HTTP 200; alokasi menjadi Rp60/Rp40 dan riwayat tercatat |
| Cashback Rp50 dan admin KPR Rp25 | HTTP 201; bukti diunggah dan kedua jurnal diposting |
| Pembatalan penjualan KPR uji tanpa penerimaan | HTTP 200; status batal dan sisa nol |
| Legal: unduh PDF dan DOCX | File terunduh; XML DOCX valid dan memuat nomor/pembeli |
| Legal: unggah dan unduh scan | Scan tersimpan dan berhasil diunduh |
| Legal: status ditandatangani | Status tersimpan dan ditampilkan |
| Neraca saldo, buku besar, saldo kode pembantu | HTTP 200; transaksi posting muncul |
| Ekspor tabel antarproyek ke Excel dan PDF | Kedua file berhasil diunduh |
| Tutup buku Oktober 2026 untuk proyek uji | Frontend menampilkan periode terkunci |

## Perbaikan dari temuan browser

- Akun hutang dan beban bunga pinjaman kini wajib, dengan pilihan akun aktif tanpa anak.
- Pembayaran tanpa rincian tidak lagi mengirim pokok/bunga nol sebagai rincian lengkap.
- Detail kontrak tidak lagi memicu siklus permintaan tanpa henti.
- Akun kontrak dipilih berdasarkan kategori dan status, tanpa pencocokan kata pada nama.
- Kode pembantu kontraktor dikenali sesuai kategori backend.
- Mutasi baru membuat pihak dan jurnal dalam satu transaksi backend; tombol simpan
  menunggu hasil dan menampilkan kegagalan dalam formulir.
- Mutasi antarproyek tidak meminta pihak tambahan; keterangan unggah bukti diperbarui.
- Ekspor Word/PDF legal dan scan sekarang terhubung; jurnal balik tersedia dari UI.
- Penghapusan draft menunggu respons backend; status jurnal balik dikenali UI.
- Filter proyek SHM diterapkan menggunakan ID proyek.
- Nomor rekening kas/bank dikirim sesuai field backend untuk pemetaan pembayaran Track.

## Batas hasil

Hasil ini belum membuktikan seluruh fitur berhasil di produksi. Pengujian browser
belum mencakup pembayaran asli PR Track, worker sinkronisasi/outbox lintas sistem,
seluruh variasi pola pinjaman, atau pembatalan penjualan dengan pengembalian dana.
Pengujian pemrosesan pembayaran dan KPR memakai fixture database lokal, bukan
sinkronisasi jaringan ke PR Track. PDF/DOCX telah diuji unduh dan struktur dasar;
belum dilakukan pemeriksaan visual semua variasi template.

Verifikasi kode: enam tes frontend lulus, build TypeScript/Vite lulus, lint tanpa
error dengan warning yang masih ada, dan audit dependency produksi tanpa kerentanan.
