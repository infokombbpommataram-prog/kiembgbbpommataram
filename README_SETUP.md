# Monev KIE MBG — versi Sheet saja

## 7 sheet
- `Config`: A:B kunci-nilai. Wajib: `target_ikk=34`, `ambang_g=0.3`, `skor_maks=100`. Hasil IKK tulis di B10.
- `Lokus`: kode | nama | kelompok (intervensi/kontrol) | jenis (sekolah/posyandu) | kab | kec | lat | lng | komitmen
- `Kader`: nama | HP (+62) | lokus_ampu (kode, koma) | pre_tot | post_tot
- `Laporan`: id | kode_lokus | bulan (1-3) | tgl_edukasi | peserta | link_foto | status (belum/draft/menunggu/disetujui) | stempel
- `Nilai`: kode_lokus | kelompok | pre_mean | post_mean | n | g (auto) | meningkat (auto)
- `Monev`: tgl | kode_lokus | temuan | tindak_lanjut | status (terbuka/selesai)
- `Dashboard`: rumus saja, tanpa kode.

## Rumus Dashboard (contoh)
- Laporan disetujui: `=COUNTIFS(Laporan!G:G,"disetujui")`
- Kepatuhan: `=COUNTIFS(Laporan!G:G,"disetujui")/102`
- Link WA kader (misal HP di B2): `="https://wa.me/"&B2&"?text="&ENCODEURL("Ingatkan laporan "&A2)`
- Peta: Insert > Map dari kolom lat/lng di `Lokus` (cukup, tanpa MapLibre).

## Setup (3 menit, tanpa isi header manual)
1. Buat Spreadsheet kosong. Extensions > Apps Script, tambah `Code.gs` + `Index.html`, tempel isi, reload.
2. Menu Monev > **0. Setup sheet + header** → 7 sheet + header + Config awal terisi otomatis.
3. Ganti 3 password `ganti-ini` di `USERS`. Deploy > Web app > Execute as Me, akses Anyone.

## Disederhanakan dari spek 381 baris
- Entri per responden dibuang, pakai rekap mean per lokus. Uji Wilcoxon/DiD dibuang.
- Foto: link Drive saja, tanpa cek GPS/duplikat/hash.
- Peran: 1 file, proteksi sheet per peran. Tanpa login/RLS/audit.
- Kontrol: baris di `Lokus` + `Nilai` saja, tanpa modul enumerator.
