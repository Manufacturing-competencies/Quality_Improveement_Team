QIT BATCH 9 — UPDATE 28 SEPTEMBER 2026

FILE WEBSITE (GitHub Pages)
1. index.html -> replace index.html lama
2. style.css  -> replace style.css lama
3. script.js  -> replace script.js lama

PERUBAHAN UTAMA
- Current Mission -> Current Week otomatis (ISO week, W40 pada 28 Sep 2026)
- Rentang tanggal week otomatis Senin-Minggu
- Top 15 Point Challenge live leaderboard di atas Quick Access
- Quick Access Pembentukan Tim -> SharePoint baru
- Quick Access Point Challenge -> Apps Script URL baru
- All Missions: Pembentukan Tim disinkronkan ke SharePoint
- Dashboard Point -> Apps Script Point Challenge
- Best Risalah aktif -> Google Drive folder
- Informasi Terbaru card dihapus
- Welcome popup bisa mengambil foto/video aktif dari Google Drive
- Tombol Update Media membuka admin uploader Apps Script

APPS SCRIPT
1. Buka Apps Script yang menjadi sumber Dashboard Point Challenge.
2. Backup Code.gs lama jika masih diperlukan.
3. Tempel Code.gs dari paket ini.
4. Jika Apps Script terikat (container-bound) ke spreadsheet Point Challenge, CONFIG.SPREADSHEET_ID boleh kosong.
5. Jika standalone, isi CONFIG.SPREADSHEET_ID dengan ID spreadsheet data Point Challenge.
6. Jika auto-detect gagal, isi CONFIG.LEADERBOARD_SHEET_NAME, TEAM_HEADER, POINT_HEADER.
7. Deploy > Manage deployments > Edit > New version > Deploy.
   Gunakan deployment yang sama agar URL /exec lama tetap sama.

MEDIA POPUP
- Buka URL Apps Script: /exec?mode=admin
- Upload foto/video.
- Media lama otomatis dihapus (tanpa backup/histori).
- Folder QIT_BATCH9_POPUP_ACTIVE dibuat otomatis di Google Drive.
- Script mencoba mengatur file Anyone with link. Jika kebijakan Workspace melarangnya, media Drive dapat tetap meminta login akun perusahaan.

CATATAN
- Leaderboard website memanggil endpoint yang sama dengan tambahan ?action=leaderboard.
- Popup website memanggil endpoint yang sama dengan tambahan ?action=popup.
- Website auto-refresh leaderboard setiap 3 menit dan tersedia tombol Refresh manual.
