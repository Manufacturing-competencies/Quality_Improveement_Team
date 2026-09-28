/**
 * QIT BATCH 9 — ADD-ON UNTUK CODE.GS DASHBOARD YANG SUDAH ADA
 * ------------------------------------------------------------
 * JANGAN hapus getDashboardData() atau fungsi dashboard lama.
 * Append seluruh file ini DI BAWAH kode lama.
 *
 * Satu-satunya penyesuaian pada fungsi doGet lama adalah menambahkan
 * routing kecil yang ada di file DOGET_PATCH.txt.
 *
 * Fitur tambahan:
 * 1. API JSONP leaderboard untuk website GitHub Pages.
 * 2. Multi PNG popup dari Google Drive.
 * 3. Halaman admin upload banyak PNG langsung dari browser.
 * 4. Hapus PNG satu per satu dari halaman admin.
 */

const QIT_POPUP_FOLDER_NAME = 'QIT_BATCH9_POPUP_PNG';
const QIT_POPUP_FOLDER_PROPERTY = 'QIT_POPUP_FOLDER_ID';

function qitLeaderboardResponse_(e) {
  try {
    const p = (e && e.parameter) || {};
    const limit = Math.max(1, Math.min(50, Number(p.limit) || 15));
    const data = getDashboardData(); // memakai fungsi existing, tidak mengubah logika dashboard

    if (!data || data.error) {
      return qitJsonp_({ ok: false, message: data ? data.error : 'Data dashboard tidak tersedia.' }, p.callback);
    }

    const source = Array.isArray(data.top15) && data.top15.length
      ? data.top15
      : (Array.isArray(data.allTeamsRaw) ? data.allTeamsRaw : []);

    const rows = source
      .slice()
      .sort((a, b) => Number(b.totalPoin || 0) - Number(a.totalPoin || 0))
      .slice(0, limit)
      .map((team, idx) => ({
        rank: idx + 1,
        team: String(team.namaTim || '').trim(),
        points: Number(team.totalPoin || 0),
        lokasi: String(team.lokasi || '-'),
        stream: String(team.stream || '-')
      }));

    return qitJsonp_({
      ok: true,
      rows: rows,
      updatedAt: new Date().toISOString()
    }, p.callback);
  } catch (err) {
    return qitJsonp_({ ok: false, message: err.toString() }, e && e.parameter ? e.parameter.callback : '');
  }
}

function qitPopupListResponse_(e) {
  try {
    const p = (e && e.parameter) || {};
    const files = qitListPopupFiles_();
    return qitJsonp_({ ok: true, files: files, updatedAt: new Date().toISOString() }, p.callback);
  } catch (err) {
    return qitJsonp_({ ok: false, message: err.toString(), files: [] }, e && e.parameter ? e.parameter.callback : '');
  }
}

function qitPopupAdminPage_() {
  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QIT Popup Manager</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:linear-gradient(145deg,#eef9ff,#f7f6ff);color:#123b63}.wrap{max-width:980px;margin:36px auto;padding:0 18px}.hero{background:linear-gradient(135deg,#087ed8,#19bad5 55%,#6673e7);color:#fff;border-radius:24px;padding:26px;box-shadow:0 18px 45px rgba(29,102,159,.18)}.hero h1{margin:0 0 7px}.hero p{margin:0;opacity:.9}.card{margin-top:18px;background:#fff;border:1px solid #d9edf8;border-radius:22px;padding:22px;box-shadow:0 16px 40px rgba(39,102,145,.10)}.drop{border:2px dashed #8ecff1;border-radius:18px;padding:28px;text-align:center;background:#f8fdff}.drop input{display:block;margin:14px auto}.btn{border:0;border-radius:12px;padding:11px 16px;font-weight:700;cursor:pointer}.primary{background:#087ed8;color:#fff}.danger{background:#fff0f0;color:#bd2d2d;border:1px solid #f2c9c9}.muted{color:#6d879e;font-size:13px}.status{margin-top:12px;font-weight:700}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:18px}.item{border:1px solid #d9edf8;border-radius:16px;padding:10px;background:#fbfeff}.item img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:11px;background:#eef5fa}.name{font-size:12px;font-weight:700;margin:8px 0;word-break:break-word}.row{display:flex;gap:8px;align-items:center;justify-content:space-between}.badge{font-size:11px;padding:5px 8px;border-radius:999px;background:#e9f8ff;color:#087ebd}.progress{height:7px;background:#eaf2f7;border-radius:999px;overflow:hidden;margin-top:12px}.bar{height:100%;width:0;background:linear-gradient(90deg,#087ed8,#27c5d7);transition:.25s}.hint{margin-top:10px;font-size:12px;color:#728ba0}.toprow{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
</style>
</head>
<body><div class="wrap">
<div class="hero"><h1>🖼️ QIT Popup Manager</h1><p>Upload beberapa file PNG. Website akan menampilkannya sebagai carousel sesuai urutan nama file.</p></div>
<div class="card">
  <div class="drop">
    <b>Pilih beberapa file PNG sekaligus</b>
    <input id="files" type="file" accept="image/png,.png" multiple>
    <button class="btn primary" id="upload">Upload PNG</button>
    <div class="progress"><div class="bar" id="bar"></div></div>
    <div class="status" id="status"></div>
    <div class="hint">Tips urutan: gunakan nama 01_Welcome.png, 02_Challenge.png, 03_Coaching.png, dst.</div>
  </div>
</div>
<div class="card"><div class="toprow"><div><h2 style="margin:0">Poster Aktif</h2><div class="muted">Semua PNG di bawah akan tampil di popup website.</div></div><button class="btn" onclick="loadFiles()">↻ Refresh</button></div><div class="grid" id="grid"></div></div>
</div>
<script>
const $=id=>document.getElementById(id);
function esc(s){return String(s||'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));}
function loadFiles(){ $('grid').innerHTML='<div class="muted">Memuat...</div>'; google.script.run.withSuccessHandler(files=>{ if(!files||!files.length){$('grid').innerHTML='<div class="muted">Belum ada PNG.</div>';return;} $('grid').innerHTML=files.map(f=>'<div class="item"><img src="'+f.imageUrl+'" alt=""><div class="name">'+esc(f.name)+'</div><div class="row"><span class="badge">PNG</span><button class="btn danger" onclick="delFile(\''+f.id+'\')">Hapus</button></div></div>').join(''); }).withFailureHandler(e=>{$('grid').innerHTML='<div class="muted">Gagal: '+esc(e.message||e)+'</div>';}).qitListPopupFilesForAdmin(); }
function delFile(id){ if(!confirm('Hapus poster ini dari popup?'))return; google.script.run.withSuccessHandler(()=>loadFiles()).withFailureHandler(e=>alert(e.message||e)).qitDeletePopupPng(id); }
$('upload').onclick=async()=>{ const fs=[...$('files').files]; if(!fs.length){$('status').textContent='Pilih PNG terlebih dahulu.';return;} const bad=fs.find(f=>f.type!=='image/png'&&!f.name.toLowerCase().endsWith('.png')); if(bad){$('status').textContent='Hanya file PNG yang diperbolehkan.';return;} $('upload').disabled=true;$('status').textContent='Menyiapkan file...';$('bar').style.width='15%'; try{ const payload=[]; for(let i=0;i<fs.length;i++){ const f=fs[i]; const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(f);}); payload.push({name:f.name,mimeType:'image/png',dataBase64:b64}); $('bar').style.width=(15+Math.round((i+1)/fs.length*45))+'%'; } $('status').textContent='Mengupload ke Google Drive...';$('bar').style.width='70%'; google.script.run.withSuccessHandler(r=>{$('bar').style.width='100%';$('status').textContent='✅ '+r.count+' file berhasil diupload.';$('files').value='';setTimeout(()=>{$('bar').style.width='0'},900);$('upload').disabled=false;loadFiles();}).withFailureHandler(e=>{$('status').textContent='❌ '+(e.message||e);$('bar').style.width='0';$('upload').disabled=false;}).qitUploadPopupPng(payload); }catch(e){$('status').textContent='❌ '+e;$('upload').disabled=false;$('bar').style.width='0';} };
loadFiles();
</script></body></html>`;
  return HtmlService.createHtmlOutput(html)
    .setTitle('QIT Popup Manager')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function qitUploadPopupPng(files) {
  if (!Array.isArray(files) || !files.length) throw new Error('Tidak ada file untuk diupload.');
  if (files.length > 20) throw new Error('Maksimal 20 PNG sekali upload.');

  const folder = qitGetPopupFolder_();
  const created = [];

  files.forEach(function(item) {
    const name = String(item.name || '').trim();
    if (!name.toLowerCase().endsWith('.png')) throw new Error('Hanya PNG: ' + name);
    const bytes = Utilities.base64Decode(String(item.dataBase64 || ''));
    if (bytes.length > 12 * 1024 * 1024) throw new Error('Ukuran file terlalu besar (maks 12 MB): ' + name);

    const blob = Utilities.newBlob(bytes, 'image/png', name);
    const file = folder.createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
    created.push(file.getId());
  });

  return { ok: true, count: created.length, ids: created };
}

function qitDeletePopupPng(fileId) {
  const folder = qitGetPopupFolder_();
  const id = String(fileId || '').trim();
  if (!id) throw new Error('File ID kosong.');

  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (f.getId() === id) {
      f.setTrashed(true);
      return { ok: true };
    }
  }
  throw new Error('File tidak ditemukan di folder popup.');
}

function qitListPopupFilesForAdmin() {
  return qitListPopupFiles_();
}

function qitListPopupFiles_() {
  const folder = qitGetPopupFolder_();
  const out = [];
  const it = folder.getFiles();

  while (it.hasNext()) {
    const f = it.next();
    const mime = String(f.getMimeType() || '').toLowerCase();
    const name = f.getName();
    if (mime !== 'image/png' && !name.toLowerCase().endsWith('.png')) continue;
    try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
    out.push({
      id: f.getId(),
      name: name,
      mimeType: 'image/png',
      updated: f.getLastUpdated().toISOString(),
      imageUrl: 'https://drive.google.com/uc?export=view&id=' + encodeURIComponent(f.getId())
    });
  }

  out.sort(function(a, b) {
    return a.name.localeCompare(b.name, 'id', { numeric: true, sensitivity: 'base' });
  });
  return out;
}

function qitGetPopupFolder_() {
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty(QIT_POPUP_FOLDER_PROPERTY);
  if (saved) {
    try { return DriveApp.getFolderById(saved); } catch (_) {}
  }

  const folders = DriveApp.getFoldersByName(QIT_POPUP_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(QIT_POPUP_FOLDER_NAME);
  props.setProperty(QIT_POPUP_FOLDER_PROPERTY, folder.getId());
  return folder;
}

function qitJsonp_(payload, callback) {
  const cb = String(callback || '').trim();
  if (cb && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
