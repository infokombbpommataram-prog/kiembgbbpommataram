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
    .addItem('1. Isi dummy (12 lokus)', 'isiDummy')
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
function doPost(e) {
  const b = JSON.parse(e.postData.contents);
  const R = r => ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
  if (b.fn === 'login') { const x = USERS[String(b.u).toLowerCase()]; return R(x && b.p === x.pass ? { ok: 1, role: x.role } : { ok: 0 }); }
  if (b.fn === 'read') return R(apiRead(b.sheet, b.q || ''));
  if (b.fn === 'add') return R(apiAdd(b.sheet, b.row));
  if (b.fn === 'del' && SHEET_ALLOW.includes(b.sheet)) { SpreadsheetApp.getActive().getSheetByName(b.sheet).deleteRow(+b.rowNum); return R({ ok: 1 }); }
  if (b.fn === 'upd' && SHEET_ALLOW.includes(b.sheet)) { apiUpd(b.sheet, +b.rowNum, b.row); return R({ ok: 1 }); }
  if (b.fn === 'ikk') { hitungIKK(); return R({ ok: 1 }); }
  if (b.fn === 'seed') { buatLaporan(); return R({ ok: 1 }); }
  if (b.fn === 'dummy') { isiDummy(); buatLaporan(); hitungIKK(); return R({ ok: 1 }); }
  return R({ ok: 0, err: 'fn?' });
}

// Isi 12 lokus dummy + kader + nilai + 3 monev. Idempotent (skip jika Lokus ada isi).
// ponytail: dummy statis; ganti generator acak saat butuh volume uji.
function isiDummy() {
  const ss = SpreadsheetApp.getActive();
  setupSheets();
  const lok = ss.getSheetByName(SHEETS.LOKUS);
  if (lok.getLastRow() > 1) return;
  const L = [
    ['SK-01', 'SDN 1 Gerung', 'intervensi', 'sekolah', 'Lombok Barat', 'Gerung', -8.732, 116.115, 'ada'],
    ['SK-02', 'SDN 2 Gerung', 'intervensi', 'sekolah', 'Lombok Barat', 'Gerung', -8.735, 116.118, 'ada'],
    ['SK-03', 'MI NW Kediri', 'intervensi', 'sekolah', 'Lombok Barat', 'Kediri', -8.68, 116.13, 'ada'],
    ['SK-04', 'SMPN 1 Narmada', 'kontrol', 'sekolah', 'Lombok Barat', 'Narmada', -8.62, 116.2, 'belum'],
    ['PS-01', 'Posyandu Mawar Gerung', 'intervensi', 'posyandu', 'Lombok Barat', 'Gerung', -8.733, 116.116, 'ada'],
    ['PS-02', 'Posyandu Melati Gerung', 'intervensi', 'posyandu', 'Lombok Barat', 'Gerung', -8.736, 116.119, 'ada'],
    ['PS-03', 'Posyandu Kenanga Kediri', 'intervensi', 'posyandu', 'Lombok Barat', 'Kediri', -8.681, 116.131, 'ada'],
    ['PS-04', 'Posyandu Anggrek Kediri', 'intervensi', 'posyandu', 'Lombok Barat', 'Kediri', -8.683, 116.133, 'ada'],
    ['PS-05', 'Posyandu Cempaka Narmada', 'intervensi', 'posyandu', 'Lombok Barat', 'Narmada', -8.621, 116.201, 'ada'],
    ['PS-06', 'Posyandu Dahlia Narmada', 'intervensi', 'posyandu', 'Lombok Barat', 'Narmada', -8.623, 116.203, 'ada'],
    ['PS-07', 'Posyandu Flamboyan Lembar', 'kontrol', 'posyandu', 'Lombok Barat', 'Lembar', -8.75, 116.07, 'belum'],
    ['PS-08', 'Posyandu Kamboja Sekotong', 'kontrol', 'posyandu', 'Lombok Barat', 'Sekotong', -8.78, 116.05, 'belum']
  ];
  lok.getRange(2, 1, L.length, L[0].length).setValues(L);
  const K = [
    ['Siti A', '+628111', 'SK-01,SK-02', 60, 85],
    ['Budi B', '+628222', 'SK-03', 55, 80],
    ['Rina C', '+628333', 'PS-01,PS-02,PS-03', 50, 78],
    ['Dewi D', '+628444', 'PS-04,PS-05,PS-06', 52, 75]
  ];
  ss.getSheetByName('Kader').getRange(2, 1, K.length, K[0].length).setValues(K);
  const N = [
    ['SK-01', 'intervensi', 55, 80, 100, '', ''],
    ['SK-02', 'intervensi', 60, 82, 100, '', ''],
    ['SK-03', 'intervensi', 50, 70, 100, '', ''],
    ['SK-04', 'kontrol', 58, 62, 100, '', ''],
    ['PS-01', 'intervensi', 48, 75, 20, '', ''],
    ['PS-02', 'intervensi', 52, 72, 20, '', ''],
    ['PS-03', 'intervensi', 45, 68, 20, '', ''],
    ['PS-04', 'intervensi', 55, 70, 20, '', ''],
    ['PS-05', 'intervensi', 50, 65, 20, '', ''],
    ['PS-06', 'intervensi', 47, 69, 20, '', ''],
    ['PS-07', 'kontrol', 51, 55, 20, '', ''],
    ['PS-08', 'kontrol', 49, 53, 20, '', '']
  ];
  ss.getSheetByName(SHEETS.NILAI).getRange(2, 1, N.length, N[0].length).setValues(N);
  const M = [
    ['2027-02-01', 'SK-01', 'Poster belum terpasang', 'Pasang sebelum B2', 'selesai'],
    ['2027-02-05', 'PS-01', 'Peserta sepi', 'Libatkan kader PKK', 'terbuka'],
    ['2027-02-10', 'PS-04', 'Jadwal bentrok posyandu', 'Geser ke Sabtu', 'terbuka']
  ];
  ss.getSheetByName(SHEETS.MONEV).getRange(2, 1, M.length, M[0].length).setValues(M);
}
