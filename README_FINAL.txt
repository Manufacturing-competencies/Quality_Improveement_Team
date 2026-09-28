QIT BATCH 9 — FINAL UPDATE 28 SEPTEMBER 2026
============================================

A. REVISI YANG SUDAH MASUK
1. Current Mission menjadi Current Week otomatis.
   - Week mengikuti kalender ISO.
   - 28 Sep 2026 = Week 40.
   - Rentang Senin–Minggu otomatis berubah tiap minggu.

2. Leaderboard Point Challenge.
   - Posisi di atas "What do you need?".
   - Top 3 podium + Top 15 interactive horizontal bar chart.
   - Auto refresh 3 menit + tombol Refresh.
   - Data mengambil fungsi getDashboardData() yang SUDAH ADA di Apps Script.

3. Quick Access.
   - Pembentukan Tim -> SharePoint baru.
   - Point Challenge -> Dashboard Apps Script existing.

4. QIT Access Center / All Missions.
   - Dihapus TOTAL dari halaman.
   - Menu "All Missions" di navbar juga dihapus.

5. Gallery.
   - Dipoles dengan visual glossy, glow halus, hover premium, zoom/fullscreen tetap berjalan.

6. Video.
   - Background dibuat clean.
   - Efek bulat/particle pada area video dihilangkan.
   - Player diberi frame clean premium.

7. Welcome Popup.
   - Mendukung BANYAK file PNG.
   - Tampil sebagai carousel otomatis.
   - Next / Prev, dots indicator, swipe mobile, auto-slide.
   - Fallback tetap POPUP.png bila Google Drive belum tersambung.

8. Upload Popup langsung via website Apps Script.
   - Buka: URL /exec?mode=popup-admin
   - Bisa pilih banyak PNG sekaligus.
   - File otomatis masuk folder Google Drive: QIT_BATCH9_POPUP_PNG.
   - Bisa hapus poster satu per satu.
   - Urutan carousel mengikuti nama file.
   - Disarankan: 01_Welcome.png, 02_Challenge.png, dst.

B. FILE GITHUB YANG DIGANTI
- index.html
- script.js
- style.css

Jangan hapus file gambar, logo, MUSIC.mp3, dan aset existing lainnya.

C. APPS SCRIPT POINT CHALLENGE
Kode existing dashboard TIDAK diganti.

1. Buka DOGET_PATCH.txt.
2. Ganti HANYA fungsi doGet lama dengan versi patch tersebut.
   Default dashboard tetap sama seperti sebelumnya.
3. Paste seluruh isi Code_ADDON_QIT_BATCH9.gs di PALING BAWAH Code.gs existing.
4. Save.
5. Deploy > Manage deployments > Edit > New version > Deploy.
6. Pertahankan URL /exec lama yang sama.

D. CARA UPLOAD POPUP PNG
Setelah Apps Script selesai deploy:
1. Buka:
   https://script.google.com/macros/s/AKfycbwo939oiI2GpmQei7NkXwFlPnAs542vvsst1eb0f1l5H3zNolLMedZ4TLmy0tWlwuY/exec?mode=popup-admin
2. Pilih beberapa file PNG.
3. Klik Upload PNG.
4. Refresh website QIT.
5. Semua PNG akan tampil sebagai carousel.

Catatan:
- Google Workspace perusahaan dapat membatasi "Anyone with the link". Jika gambar Drive tidak muncul untuk visitor lain, cek kebijakan sharing folder/file.
- Maksimal upload per batch pada addon: 20 PNG; maksimum 12 MB/file.
