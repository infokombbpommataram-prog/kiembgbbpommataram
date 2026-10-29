# KIE MBG — frontend Cloudflare Pages + backend GAS

## Arsitektur
- Frontend: `frontend/` (Vite React, tanpa router/chart — tabel + tombol saja).
- Backend: `Code.gs` di Sheet [KIE_MBG](https://docs.google.com/spreadsheets/d/11hKtEOOuM9dDcYyoU0WMoNy4WsAnt2GPuAmRkQVJtKc/edit) (doPost JSON: login/read/add/del/ikk/seed).
- Foto: link Drive di kolom `link_foto` → folder [Drive](https://drive.google.com/drive/folders/1iwQrhho-ohI9V6FPkN3SwtGlmE-vSdAX).
- `Index.html` = versi lama di dalam GAS; Pages = versi baru. Pilih satu.

## Push + Deploy
1. `git init && git add . && git commit -m init && gh repo create kie-mbg --public --source=. --push`
2. Isi `frontend/.env.production` dengan URL Web App GAS (`Deploy > New deployment > Web App > Anyone`).
3. Cloudflare Pages > Connect git > repo kie-mbg > Build: `npm run build`, Output: `frontend/dist`. Atau root `npm run build` + `wrangler.json`.
4. Env var Pages: `VITE_GAS_URL` = URL Web App GAS.

## GAS wajib
- Tempel `Code.gs` terbaru (ada `doPost`). Deploy ulang tiap edit.
- Menu Monev > 0. Setup sheet + header > Seed 102.
