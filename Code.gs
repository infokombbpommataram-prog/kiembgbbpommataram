/** Monev KIE MBG — GAS minimal. Sheet-only, tanpa server. */

const SHEETS = { CFG: 'Config', LOKUS: 'Lokus', LAPOR: 'Laporan', NILAI: 'Nilai', MONEV: 'Monev' };
// ponytail: ganti PropertiesService saat >20 user (kuota baca).
const USERS = { admin: { pass: 'ganti-ini', role: 'admin' }, verif: { pass: 'ganti-ini', role: 'verifikator' }, kader: { pass: 'ganti-ini', role: 'kader' } };

function doGet() { return ContentService.createTextOutput('API KIE MBG. Gunakan frontend Pages.').setMimeType(ContentService.MimeType.TEXT); }
function apiLogin(u, p) { const x = USERS[String(u).toLowerCase()]; return (x && p === x.pass) ? { ok: 1, role: x.role } : { ok: 0 }; }

// CRUD generik: sheet query read, append/update/delete by id kolom A.
function apiRead(sheet, q) {
  const v = SpreadsheetApp.getActive().getSheetByName(sheet).getDataRange().getValues();
  const h = v[0], out = [];
  for (let i = 1; i < v.length; i++) if (!q || v[i].join(' ').toLowerCase().includes(q.toLowerCase())) out.push([i + 1].concat(v[i]));
  return { head: ['_row'].concat(h), rows: out.slice(0, 500) };
}
function apiAdd(sheet, row) { SpreadsheetApp.getActive().getSheetByName(sheet).appendRow(row); return { ok: 1 }; }
function apiUpd(sheet, rowNum, row) { SpreadsheetApp.getActive().getSheetByName(sheet).getRange(rowNum, 1, 1, row.length).setValues([row]); return { ok: 1 }; }
function apiDel(sheet, rowNum) { SpreadsheetApp.getActive().getSheetByName(sheet).deleteRow(rowNum); return { ok: 1 }; }

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Monev')
    .addItem('0. Setup sheet + header', 'setupSheets')
    .addItem('Buat 102 baris laporan', 'buatLaporan')
    .addItem('Hitung N-Gain + IKK', 'hitungIKK')
    .addToUi();
}

// Buat 7 sheet + header + Config awal. Idempotent.
function setupSheets() {
  const ss = SpreadsheetApp.getActive();
  const H = {
    Config: ['kunci', 'nilai'],
    Lokus: ['kode', 'nama', 'kelompok', 'jenis', 'kab', 'kec', 'lat', 'lng', 'komitmen'],
    Kader: ['nama', 'hp', 'lokus_ampu', 'pre_tot', 'post_tot'],
    Laporan: ['id', 'kode_lokus', 'bulan', 'tgl_edukasi', 'peserta', 'link_foto', 'status', 'stempel'],
    Nilai: ['kode_lokus', 'kelompok', 'pre_mean', 'post_mean', 'n', 'g', 'meningkat'],
    Monev: ['tgl', 'kode_lokus', 'temuan', 'tindak_lanjut', 'status'],
    Dashboard: ['metrik', 'nilai']
  };
  Object.keys(H).forEach(n => {
    let sh = ss.getSheetByName(n) || ss.insertSheet(n);
    if (!sh.getRange('A1').getValue()) sh.getRange(1, 1, 1, H[n].length).setValues([H[n]]);
  });
  const c = ss.getSheetByName('Config');
  if (!c.getRange('A2').getValue()) c.getRange('A2:B4').setValues([['target_ikk', 34], ['ambang_g', 0.3], ['skor_maks', 100]]);
}

function cfg_() {
  const s = SpreadsheetApp.getActive().getSheetByName(SHEETS.CFG);
  const m = {};
  s.getRange('A2:B20').getValues().forEach(r => { if (r[0]) m[String(r[0]).trim()] = r[1]; });
  return { target: m.target_ikk || 34, ambang: m.ambang_g || 0.3, smaks: m.skor_maks || 100 };
}

// Buat baris Laporan: tiap lokus intervensi x bulan 1-3. Idempotent.
function buatLaporan() {
  const ss = SpreadsheetApp.getActive();
  const lokus = ss.getSheetByName(SHEETS.LOKUS).getDataRange().getValues();
  const lap = ss.getSheetByName(SHEETS.LAPOR);
  const ada = new Set(lap.getDataRange().getValues().slice(1).map(r => r[0]));
  const out = [];
  for (let i = 1; i < lokus.length; i++) {
    if (String(lokus[i][2]).toLowerCase() !== 'intervensi') continue; // C=kelompok
    for (let b = 1; b <= 3; b++) {
      const id = lokus[i][0] + '-B' + b;
      if (!ada.has(id)) out.push([id, lokus[i][0], b, '', '', '', 'belum', '']);
    }
  }
  if (out.length) lap.getRange(lap.getLastRow() + 1, 1, out.length, out[0].length).setValues(out);
}

// g = (post-pre)/(smaks-pre). pre==smaks -> null (keluar dari rerata).
function gain_(pre, post, smaks) {
  if (pre == null || post == null || pre >= smaks) return null;
  return (post - pre) / (smaks - pre);
}

function hitungIKK() {
  const c = cfg_();
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEETS.NILAI);
  const v = sh.getDataRange().getValues(); // kode|kel|pre|post|n|g|meningkat?
  let naik = 0;
  for (let i = 1; i < v.length; i++) {
    const g = gain_(+v[i][2], +v[i][3], c.smaks);
    const ok = g != null && g >= c.ambang && String(v[i][1]).toLowerCase() === 'intervensi';
    sh.getRange(i + 1, 6, 1, 2).setValues([[g == null ? '' : g, ok ? 'YA' : '']]);
    if (ok) naik++;
  }
  ss.getSheetByName(SHEETS.CFG).getRange('B10').setValue(naik + ' / ' + c.target);
}

// Kunci baris disetujui + stempel edit. Kolom status = G (7).
function onEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== SHEETS.LAPOR) return;
  if (e.range.getColumn() === 7 && String(e.value).toLowerCase() === 'disetujui')
    sh.getRange(e.range.getRow(), 8).setValue(new Date()); // H=stempel
}

// Satu cek runnable. Jalankan manual sekali.
function testNGain() {
  console.assert(gain_(50, 80, 100) === 0.6, 'g dasar');
  console.assert(gain_(100, 100, 100) === null, 'pre=maks null');
  console.assert(gain_(40, 30, 100) < 0, 'g negatif boleh');
}

// ---- JSON API untuk frontend Cloudflare Pages (Deploy as Web App, akses Anyone) ----
// ponytail: tanpa token per-user; tambah SECRET cek di api() saat butuh tulis publik.
const SHEET_ALLOW = ['Lokus', 'Kader', 'Laporan', 'Nilai', 'Monev'];
function doGet() { return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('Monev KIE MBG'); }
function doPost(e) {
  const b = JSON.parse(e.postData.contents);
  const R = r => ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
  if (b.fn === 'login') { const x = USERS[String(b.u).toLowerCase()]; return R(x && b.p === x.pass ? { ok: 1, role: x.role } : { ok: 0 }); }
  if (b.fn === 'read') return R(apiRead(b.sheet, b.q || ''));
  if (b.fn === 'add') return R(apiAdd(b.sheet, b.row));
  if (b.fn === 'del' && SHEET_ALLOW.includes(b.sheet)) { SpreadsheetApp.getActive().getSheetByName(b.sheet).deleteRow(+b.rowNum); return R({ ok: 1 }); }
  if (b.fn === 'ikk') { hitungIKK(); return R({ ok: 1 }); }
  if (b.fn === 'seed') { buatLaporan(); return R({ ok: 1 }); }
  return R({ ok: 0, err: 'fn?' });
}
