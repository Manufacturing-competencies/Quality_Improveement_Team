/**
 * QIT BATCH 9 — POINT CHALLENGE DATA BRIDGE + MEDIA MANAGER
 * ---------------------------------------------------------
 * Fungsi:
 * 1) Dashboard Point Challenge (default /exec)
 * 2) API leaderboard JSONP (?action=leaderboard&callback=...)
 * 3) API popup media JSONP (?action=popup&callback=...)
 * 4) Admin upload poster/video (?mode=admin)
 *
 * Cara paling mudah:
 * - Tempelkan Code.gs ini pada Apps Script yang TERHUBUNG ke spreadsheet data Point Challenge.
 * - Jika script standalone, isi CONFIG.SPREADSHEET_ID.
 * - Deploy > Manage deployments > Edit > New version agar URL /exec lama tetap sama.
 */

const CONFIG = {
  // Kosongkan jika script ini container-bound ke spreadsheet Point Challenge.
  SPREADSHEET_ID: "",

  // Opsional. Kosong = auto-detect sheet + kolom berdasarkan header Tim/Team dan Poin/Point/Score.
  LEADERBOARD_SHEET_NAME: "",
  TEAM_HEADER: "",
  POINT_HEADER: "",

  // Folder media popup. Folder dibuat otomatis jika belum ada.
  POPUP_FOLDER_NAME: "QIT_BATCH9_POPUP_ACTIVE",

  // Maksimum default leaderboard.
  DEFAULT_LIMIT: 15
};

function doGet(e) {
  e = e || { parameter: {} };
  const p = e.parameter || {};
  const action = String(p.action || "").toLowerCase();
  const mode = String(p.mode || "").toLowerCase();

  try {
    if (action === "leaderboard") {
      const limit = Math.max(1, Math.min(50, Number(p.limit) || CONFIG.DEFAULT_LIMIT));
      return outputPayload_({
        ok: true,
        ...getLeaderboardData_(limit)
      }, p.callback);
    }

    if (action === "popup") {
      return outputPayload_({
        ok: true,
        file: getPopupMedia_()
      }, p.callback);
    }

    if (mode === "admin") {
      return HtmlService.createHtmlOutput(getAdminHtml_())
        .setTitle("QIT Batch 9 • Media Admin")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    return HtmlService.createHtmlOutput(getDashboardHtml_())
      .setTitle("QIT Batch 9 • Point Challenge")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (err) {
    if (action) {
      return outputPayload_({
        ok: false,
        message: err && err.message ? err.message : String(err)
      }, p.callback);
    }

    return HtmlService.createHtmlOutput(
      `<pre style="font:14px monospace;padding:24px;color:#9d1b1b">ERROR\n${escapeHtml_(err && err.stack ? err.stack : String(err))}</pre>`
    );
  }
}

/* =========================
   LEADERBOARD
   ========================= */

function getLeaderboardData_(limit) {
  const ss = getSpreadsheet_();
  const source = detectLeaderboardSource_(ss);
  const values = source.sheet.getDataRange().getValues();

  const aggregate = new Map();

  for (let r = source.headerRow + 1; r < values.length; r++) {
    const teamRaw = values[r][source.teamCol];
    const pointRaw = values[r][source.pointCol];

    const team = String(teamRaw == null ? "" : teamRaw).trim();
    const points = parseNumber_(pointRaw);

    if (!team || !Number.isFinite(points)) continue;
    if (/^(total|grand total|goals?)$/i.test(team)) continue;

    const key = normalize_(team);
    const prev = aggregate.get(key) || { team, points: 0 };
    prev.points += points;
    aggregate.set(key, prev);
  }

  const rows = Array.from(aggregate.values())
    .sort((a, b) => b.points - a.points || a.team.localeCompare(b.team))
    .slice(0, limit)
    .map((x, i) => ({
      rank: i + 1,
      team: x.team,
      points: roundSmart_(x.points)
    }));

  if (!rows.length) {
    throw new Error(
      `Data tim/poin tidak ditemukan pada sheet "${source.sheet.getName()}". ` +
      `Pastikan ada header Tim/Team/Nama Tim dan Poin/Point/Score.`
    );
  }

  return {
    sourceSheet: source.sheet.getName(),
    teamColumn: source.teamCol + 1,
    pointColumn: source.pointCol + 1,
    updatedAt: new Date().toISOString(),
    rows
  };
}

function getSpreadsheet_() {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  throw new Error(
    "Spreadsheet sumber belum terhubung. Isi CONFIG.SPREADSHEET_ID dengan ID spreadsheet Point Challenge."
  );
}

function detectLeaderboardSource_(ss) {
  const sheets = CONFIG.LEADERBOARD_SHEET_NAME
    ? [ss.getSheetByName(CONFIG.LEADERBOARD_SHEET_NAME)].filter(Boolean)
    : ss.getSheets();

  if (!sheets.length) {
    throw new Error(`Sheet "${CONFIG.LEADERBOARD_SHEET_NAME}" tidak ditemukan.`);
  }

  let best = null;

  sheets.forEach(sheet => {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 2) return;

    const scanRows = Math.min(lastRow, 30);
    const scanCols = Math.min(lastCol, 60);
    const sample = sheet.getRange(1, 1, scanRows, scanCols).getDisplayValues();

    for (let r = 0; r < sample.length; r++) {
      let teamCol = -1;
      let pointCol = -1;

      for (let c = 0; c < sample[r].length; c++) {
        const h = normalize_(sample[r][c]);

        if (CONFIG.TEAM_HEADER) {
          if (h === normalize_(CONFIG.TEAM_HEADER)) teamCol = c;
        } else if (
          /^(nama )?(tim|team)$/.test(h) ||
          h.includes("nama tim") ||
          h.includes("nama team")
        ) {
          teamCol = c;
        }

        if (CONFIG.POINT_HEADER) {
          if (h === normalize_(CONFIG.POINT_HEADER)) pointCol = c;
        } else if (
          /^(total )?(poin|point|points|score)$/.test(h) ||
          h.includes("total poin") ||
          h.includes("total point") ||
          h.includes("jumlah poin") ||
          h.includes("jumlah point")
        ) {
          pointCol = c;
        }
      }

      if (teamCol < 0 || pointCol < 0) continue;

      const probeEnd = Math.min(lastRow, r + 1 + 500);
      const probe = sheet.getRange(r + 2, 1, Math.max(1, probeEnd - (r + 1)), Math.max(teamCol, pointCol) + 1).getValues();
      let valid = 0;

      probe.forEach(row => {
        const team = String(row[teamCol] == null ? "" : row[teamCol]).trim();
        const point = parseNumber_(row[pointCol]);
        if (team && Number.isFinite(point)) valid++;
      });

      const candidate = { sheet, headerRow: r, teamCol, pointCol, valid };

      if (!best || candidate.valid > best.valid) best = candidate;
    }
  });

  if (!best) {
    throw new Error(
      "Tidak menemukan pasangan kolom Team/Tim dan Point/Poin/Score. " +
      "Jika header unik, isi CONFIG.LEADERBOARD_SHEET_NAME, TEAM_HEADER, dan POINT_HEADER."
    );
  }

  return best;
}

function parseNumber_(value) {
  if (typeof value === "number") return value;
  if (value == null || value === "") return NaN;

  let s = String(value).trim();
  if (!s) return NaN;

  // 1.234,5 -> 1234.5 ; 1,234.5 -> 1234.5 ; "47 pts" -> 47
  s = s.replace(/[^\d,.\-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length <= 2) s = s.replace(",", ".");
    else s = s.replace(/,/g, "");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function roundSmart_(n) {
  return Math.abs(n - Math.round(n)) < 1e-9
    ? Math.round(n)
    : Math.round(n * 100) / 100;
}

/* =========================
   POPUP MEDIA — GOOGLE DRIVE
   ========================= */

function savePopupMedia(formObject) {
  if (!formObject || !formObject.media) {
    throw new Error("Pilih file foto atau video terlebih dahulu.");
  }

  const blob = formObject.media;
  const mime = String(blob.getContentType() || "").toLowerCase();

  if (!(mime.startsWith("image/") || mime.startsWith("video/"))) {
    throw new Error("Format tidak didukung. Gunakan file foto atau video.");
  }

  const folder = getOrCreatePopupFolder_();

  // TANPA BACKUP: hapus semua media lama.
  const oldFiles = folder.getFiles();
  while (oldFiles.hasNext()) {
    oldFiles.next().setTrashed(true);
  }

  const originalName = blob.getName() || (mime.startsWith("video/") ? "popup-video" : "popup-image");
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Jakarta", "yyyyMMdd-HHmmss");
  const file = folder.createFile(blob).setName(`${stamp}-${originalName}`);

  // Usahakan bisa ditampilkan dari GitHub Pages.
  let sharing = "private/domain";
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    sharing = "anyone-with-link";
  } catch (err) {
    // Kebijakan Google Workspace mungkin melarang public link.
  }

  PropertiesService.getScriptProperties().setProperty("ACTIVE_POPUP_FILE_ID", file.getId());

  return {
    ok: true,
    sharing,
    file: buildPopupFileMeta_(file)
  };
}

function getPopupMedia_() {
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty("ACTIVE_POPUP_FILE_ID");

  if (savedId) {
    try {
      const file = DriveApp.getFileById(savedId);
      if (!file.isTrashed()) return buildPopupFileMeta_(file);
    } catch (_) {}
  }

  const folder = getOrCreatePopupFolder_();
  const files = folder.getFiles();
  let latest = null;
  let latestTime = -1;

  while (files.hasNext()) {
    const file = files.next();
    if (file.isTrashed()) continue;
    const t = file.getLastUpdated().getTime();
    if (t > latestTime) {
      latestTime = t;
      latest = file;
    }
  }

  if (!latest) return null;

  props.setProperty("ACTIVE_POPUP_FILE_ID", latest.getId());
  return buildPopupFileMeta_(latest);
}

function buildPopupFileMeta_(file) {
  const id = file.getId();
  const mimeType = file.getMimeType();

  return {
    id,
    name: file.getName(),
    mimeType,
    updatedAt: file.getLastUpdated().toISOString(),
    imageUrl: `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`,
    previewUrl: `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`,
    viewUrl: `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`
  };
}

function getOrCreatePopupFolder_() {
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty("POPUP_FOLDER_ID");

  if (saved) {
    try {
      return DriveApp.getFolderById(saved);
    } catch (_) {}
  }

  const folders = DriveApp.getFoldersByName(CONFIG.POPUP_FOLDER_NAME);
  const folder = folders.hasNext()
    ? folders.next()
    : DriveApp.createFolder(CONFIG.POPUP_FOLDER_NAME);

  props.setProperty("POPUP_FOLDER_ID", folder.getId());
  return folder;
}

/* =========================
   OUTPUT / JSONP
   ========================= */

function outputPayload_(payload, callback) {
  const json = JSON.stringify(payload);
  const cb = sanitizeCallback_(callback);

  if (cb) {
    return ContentService
      .createTextOutput(`${cb}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeCallback_(callback) {
  const cb = String(callback || "").trim();
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(cb) ? cb : "";
}

function normalize_(s) {
  return String(s == null ? "" : s)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function escapeHtml_(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================
   ADMIN PAGE
   ========================= */

function getAdminHtml_() {
  let current = null;
  try { current = getPopupMedia_(); } catch (_) {}

  const currentJson = JSON.stringify(current || null).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QIT Media Admin</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:linear-gradient(135deg,#eefaff,#eef2ff);color:#143e69;min-height:100vh;display:grid;place-items:center;padding:24px}
.card{width:min(720px,100%);background:#fff;border:1px solid #d6ecf8;border-radius:26px;padding:28px;box-shadow:0 24px 70px rgba(26,103,164,.16)}
.badge{display:inline-flex;padding:7px 11px;border-radius:999px;background:#eafaff;color:#087ba8;font-weight:800;font-size:11px}
h1{margin:14px 0 8px;font-size:30px}p{color:#64829d;line-height:1.6}
.current{margin:22px 0;padding:18px;border-radius:18px;background:#f5fbff;border:1px solid #dceef8}
.preview{margin-top:12px;border-radius:16px;overflow:hidden;background:#0d2742;min-height:150px;display:grid;place-items:center}
.preview img{max-width:100%;max-height:380px;display:block}.preview iframe{width:100%;height:380px;border:0}
label{display:block;font-weight:800;margin:20px 0 9px}
input[type=file]{width:100%;padding:14px;border:1px dashed #8fcdea;border-radius:14px;background:#f8fdff}
button{width:100%;margin-top:16px;padding:14px 18px;border:0;border-radius:14px;background:linear-gradient(90deg,#089fdf,#6375ea);color:#fff;font-weight:900;cursor:pointer;box-shadow:0 12px 28px rgba(30,125,199,.2)}
button:disabled{opacity:.5;cursor:not-allowed}.note{font-size:12px;color:#7b92a7}.status{margin-top:16px;padding:12px 14px;border-radius:12px;background:#eef8ff;display:none}.status.ok{display:block;color:#087a58;background:#edfff8}.status.err{display:block;color:#a13c3c;background:#fff0f0}
</style>
</head>
<body>
<div class="card">
  <span class="badge">QIT BATCH 9 • MEDIA MANAGER</span>
  <h1>Update Welcome Popup</h1>
  <p>Upload satu foto atau video aktif. Media lama akan langsung dihapus, jadi folder ini tidak menyimpan backup/histori.</p>

  <div class="current">
    <b>Media aktif saat ini</b>
    <div class="preview" id="preview"><span>Belum ada media aktif</span></div>
    <p class="note" id="currentName"></p>
  </div>

  <form id="uploadForm">
    <label for="media">Pilih foto / video baru</label>
    <input id="media" name="media" type="file" accept="image/*,video/*" required>
    <button id="submitBtn" type="submit">Upload & Publish</button>
  </form>
  <div class="status" id="status"></div>
</div>

<script>
const CURRENT=${currentJson};
const preview=document.getElementById('preview');
const currentName=document.getElementById('currentName');

function renderCurrent(file){
  if(!file){preview.innerHTML='<span>Belum ada media aktif</span>';currentName.textContent='';return;}
  const mime=String(file.mimeType||'');
  if(mime.startsWith('video/')){
    preview.innerHTML='<iframe allow="autoplay; fullscreen" allowfullscreen src="'+file.previewUrl+'"></iframe>';
  }else{
    preview.innerHTML='<img src="'+file.imageUrl+'" alt="Popup aktif">';
  }
  currentName.textContent=file.name || '';
}
renderCurrent(CURRENT);

document.getElementById('uploadForm').addEventListener('submit',function(e){
  e.preventDefault();
  const btn=document.getElementById('submitBtn');
  const status=document.getElementById('status');
  btn.disabled=true;
  btn.textContent='Uploading...';
  status.className='status';
  status.style.display='none';

  google.script.run
    .withSuccessHandler(res=>{
      btn.disabled=false;
      btn.textContent='Upload & Publish';
      status.className='status ok';
      status.textContent='Berhasil. Media terbaru sudah aktif.';
      renderCurrent(res.file);
    })
    .withFailureHandler(err=>{
      btn.disabled=false;
      btn.textContent='Upload & Publish';
      status.className='status err';
      status.textContent=(err && err.message) ? err.message : String(err);
    })
    .savePopupMedia(this);
});
</script>
</body>
</html>`;
}

/* =========================
   DEFAULT POINT CHALLENGE DASHBOARD
   ========================= */

function getDashboardHtml_() {
  const data = getLeaderboardData_(CONFIG.DEFAULT_LIMIT);
  const json = JSON.stringify(data.rows).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QIT Batch 9 • Point Challenge</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"><\\/script>
<style>
*{box-sizing:border-box}body{margin:0;padding:18px;font-family:Arial,sans-serif;background:#f2f5f8;color:#153b62}
.shell{background:#fff;border-radius:20px;padding:26px;box-shadow:0 10px 34px rgba(27,87,134,.08);border:1px solid #e0edf5}
.head{display:flex;justify-content:space-between;gap:18px;align-items:center;flex-wrap:wrap}.live{padding:7px 10px;border-radius:999px;background:#edfff8;color:#087d5d;font-size:11px;font-weight:900}
h1{font-size:24px;margin:0 0 5px}.sub{color:#7891a7;font-size:13px}.podium{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:22px 0}.p{padding:18px;border-radius:18px;text-align:center;border:1px solid #d9eaf5;background:linear-gradient(145deg,#fff,#f2faff)}.p:first-child{background:linear-gradient(145deg,#fff8df,#ffe697)}.p b{display:block;font-size:13px}.p strong{display:block;margin-top:8px;font-size:28px;color:#0875bd}.chart{height:540px}
@media(max-width:700px){.podium{grid-template-columns:1fr}.chart{height:650px}}
</style>
</head>
<body>
<div class="shell">
  <div class="head">
    <div><h1>📊 Top 15 Tim Poin Tertinggi</h1><div class="sub">QIT Batch 9 • Point Challenge</div></div>
    <span class="live">● LIVE DATA</span>
  </div>
  <div class="podium" id="podium"></div>
  <div class="chart"><canvas id="chart"></canvas></div>
</div>
<script>
const rows=${json};
const podium=document.getElementById('podium');
podium.innerHTML=rows.slice(0,3).map((r,i)=>'<div class="p"><b>#'+(i+1)+' '+r.team+'</b><strong>'+r.points+'</strong><small> PTS</small></div>').join('');
new Chart(document.getElementById('chart'),{
 type:'bar',
 data:{labels:rows.map(x=>x.team),datasets:[{data:rows.map(x=>x.points),borderRadius:9,borderSkipped:false,backgroundColor:(c)=>c.dataIndex===0?'#ffb521':c.dataIndex===1?'#67aee6':c.dataIndex===2?'#c47d47':'#1976f3'}]},
 options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{displayColors:false,callbacks:{label:c=>' '+c.raw+' poin'}}},scales:{x:{beginAtZero:true},y:{grid:{display:false},ticks:{autoSkip:false}}}}
});
<\\/script>
</body>
</html>`;
}
