import { useEffect, useState } from 'react'
import FarmMap from './FarmMap'

const API = import.meta.env.VITE_GAS_URL || ''
const TABS = [
  { id: 'Lokus', label: '🌾 Lokus & Peta', icon: '🌾' },
  { id: 'Laporan', label: '📜 Catatan Edukasi', icon: '📜' },
  { id: 'Nilai', label: '⚖️ Timbangan Nilai', icon: '⚖️' },
  { id: 'Monev', label: '🔎 Patroli Monev', icon: '🔎' }
]

const FALLBACK_LOKUS = [
  { kode: 'SK-01', nama: 'SDN 1 Gerung', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.732, lng: 116.115, kader: 'Siti A', hp: '+628111', komitmen: 'ada' },
  { kode: 'SK-02', nama: 'SDN 2 Gerung', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.735, lng: 116.118, kader: 'Siti A', hp: '+628111', komitmen: 'ada' },
  { kode: 'SK-03', nama: 'MI NW Kediri', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Kediri', lat: -8.680, lng: 116.130, kader: 'Budi B', hp: '+628222', komitmen: 'ada' },
  { kode: 'SK-04', nama: 'SMPN 1 Narmada', kelompok: 'kontrol', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Narmada', lat: -8.620, lng: 116.200, kader: 'Budi B', hp: '+628222', komitmen: 'belum' },
  { kode: 'PS-01', nama: 'Posyandu Mawar Gerung', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.733, lng: 116.116, kader: 'Rina C', hp: '+628333', komitmen: 'ada' },
  { kode: 'PS-02', nama: 'Posyandu Melati Gerung', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.736, lng: 116.119, kader: 'Rina C', hp: '+628333', komitmen: 'ada' },
  { kode: 'PS-03', nama: 'Posyandu Kenanga Kediri', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Kediri', lat: -8.681, lng: 116.131, kader: 'Rina C', hp: '+628333', komitmen: 'ada' },
  { kode: 'PS-04', nama: 'Posyandu Anggrek Kediri', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Kediri', lat: -8.683, lng: 116.133, kader: 'Dewi D', hp: '+628444', komitmen: 'ada' },
  { kode: 'PS-05', nama: 'Posyandu Cempaka Narmada', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Narmada', lat: -8.621, lng: 116.201, kader: 'Dewi D', hp: '+628444', komitmen: 'ada' },
  { kode: 'PS-06', nama: 'Posyandu Dahlia Narmada', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Narmada', lat: -8.623, lng: 116.203, kader: 'Dewi D', hp: '+628444', komitmen: 'ada' },
  { kode: 'PS-07', nama: 'Posyandu Flamboyan Lembar', kelompok: 'kontrol', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Lembar', lat: -8.750, lng: 116.070, kader: 'Dewi D', hp: '+628444', komitmen: 'belum' },
  { kode: 'PS-08', nama: 'Posyandu Kamboja Sekotong', kelompok: 'kontrol', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Sekotong', lat: -8.780, lng: 116.050, kader: 'Dewi D', hp: '+628444', komitmen: 'belum' }
]

async function callApi(fn, body = {}) {
  if (!API) return { ok: 0, offline: true, error: 'VITE_GAS_URL belum disetel.' }
  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, ...body })
    })
    if (!r.ok) return { ok: 0, status: r.status, error: `HTTP ${r.status}` }
    return await r.json()
  } catch (err) {
    return { ok: 0, error: err.message }
  }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('Lokus')
  const [q, setQ] = useState('')
  const [head, setHead] = useState([])
  const [rows, setRows] = useState([])
  const [allLokus, setAllLokus] = useState(FALLBACK_LOKUS)
  const [loading, setLoading] = useState(false)
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  
  // Detail lokus: { info, laporan, nilai, monev }
  const [detail, setDetail] = useState(null)
  
  // Edit nilai modal: { rowNum, kode, kel, pre, post, n }
  const [editNilai, setEditNilai] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({})

  const totalLokus = allLokus.length
  const intervensiCount = allLokus.filter(x => String(x.kelompok || '').toLowerCase() === 'intervensi').length
  const kontrolCount = totalLokus - intervensiCount

  const parseLokus = rs => (rs || []).map(r => ({
    _row: r[0],
    kode: r[1],
    nama: r[2],
    kelompok: r[3],
    jenis: r[4],
    kab: r[5],
    kec: r[6],
    lat: parseFloat(r[7]),
    lng: parseFloat(r[8]),
    komitmen: r[9]
  }))

  const loadData = async () => {
    setLoading(true)
    const targetSheet = tab === 'Lokus' ? 'Lokus' : tab
    const res = await callApi('read', { sheet: targetSheet, q: tab === 'Lokus' ? '' : q })
    setLoading(false)

    if (res && res.head) {
      setHead(res.head)
      setRows(res.rows || [])
      if (tab === 'Lokus') {
        const pl = parseLokus(res.rows)
        if (pl.length) setAllLokus(pl)
      }
    } else {
      // Offline fallback mode
      if (tab === 'Lokus') {
        setHead(['_row', 'kode', 'nama', 'kelompok', 'jenis', 'kab', 'kec', 'lat', 'lng', 'komitmen'])
        const f = FALLBACK_LOKUS.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))
        setRows(f.map((x, i) => [i + 2, x.kode, x.nama, x.kelompok, x.jenis, x.kab, x.kec, x.lat, x.lng, x.komitmen]))
      } else if (tab === 'Laporan') {
        setHead(['_row', 'id', 'kode_lokus', 'bulan', 'tgl_edukasi', 'peserta', 'link_foto', 'status', 'stempel'])
        setRows([
          [2, 'SK-01-B1', 'SK-01', 1, '2027-02-10', 45, 'https://drive.google.com', 'disetujui', '2027-02-11'],
          [3, 'SK-01-B2', 'SK-01', 2, '2027-03-15', 48, '', 'belum', ''],
          [4, 'PS-01-B1', 'PS-01', 1, '2027-02-12', 25, 'https://drive.google.com', 'disetujui', '2027-02-12']
        ])
      } else if (tab === 'Nilai') {
        setHead(['_row', 'kode_lokus', 'kelompok', 'pre_mean', 'post_mean', 'n', 'g', 'meningkat'])
        setRows([
          [2, 'SK-01', 'intervensi', 55, 80, 100, 0.55, 'YA'],
          [3, 'SK-02', 'intervensi', 60, 82, 100, 0.55, 'YA'],
          [4, 'SK-04', 'kontrol', 58, 62, 100, 0.09, '']
        ])
      } else if (tab === 'Monev') {
        setHead(['_row', 'tgl', 'kode_lokus', 'temuan', 'tindak_lanjut', 'status'])
        setRows([
          [2, '2027-02-01', 'SK-01', 'Poster PMT belum terpasang', 'Pasang sebelum edukasi B2', 'selesai'],
          [3, '2027-02-05', 'PS-01', 'Kehadiran peserta posyandu minim', 'Libatkan kader PKK desa', 'terbuka']
        ])
      }
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
      refreshLokus()
    }
  }, [user, tab])

  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => loadData(), 350)
    return () => clearTimeout(t)
  }, [q])

  const refreshLokus = async () => {
    const res = await callApi('read', { sheet: 'Lokus', q: '' })
    if (res && res.rows && res.rows.length) {
      setAllLokus(parseLokus(res.rows))
    }
  }

  // Buka detail riwayat lokus
  const openDetail = async (kode) => {
    setLoading(true)
    const [lap, nil, mon] = await Promise.all([
      callApi('read', { sheet: 'Laporan', q: kode }),
      callApi('read', { sheet: 'Nilai', q: kode }),
      callApi('read', { sheet: 'Monev', q: kode })
    ])
    setLoading(false)
    const info = allLokus.find(x => x.kode === kode) || {}
    setDetail({
      info,
      laporan: lap.rows || [],
      nilai: (nil.rows || [])[0] || null,
      monev: mon.rows || []
    })
  }

  const handleLogin = async (overrideUser = null) => {
    if (overrideUser) {
      setUser(overrideUser)
      return
    }
    setLoading(true)
    const r = await callApi('login', { u, p })
    setLoading(false)
    if (r && r.ok) {
      setUser(r.role || 'admin')
    } else {
      alert('Username / password salah, atau backend belum terhubung.\nSilakan gunakan opsi masuk demo di bawah untuk menguji.')
    }
  }

  const handleDelete = async (rowNum) => {
    if (!confirm(`Hapus baris data ke-${rowNum} dari lembar ${tab}?`)) return
    setLoading(true)
    await callApi('del', { sheet: tab, rowNum })
    loadData()
  }

  const saveNilai = async (e) => {
    e.preventDefault()
    setLoading(true)
    const row = [editNilai.kode, editNilai.kel, +editNilai.pre, +editNilai.post, +editNilai.n, '', '']
    await callApi('upd', { sheet: 'Nilai', rowNum: editNilai.rowNum, row })
    await callApi('ikk')
    setEditNilai(null)
    loadData()
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    let rowValues = []
    if (tab === 'Lokus') {
      rowValues = [
        formData.kode || `LK-${Date.now().toString().slice(-4)}`,
        formData.nama || '',
        formData.kelompok || 'intervensi',
        formData.jenis || 'sekolah',
        formData.kab || 'Lombok Barat',
        formData.kec || 'Gerung',
        parseFloat(formData.lat) || -8.732,
        parseFloat(formData.lng) || 116.115,
        formData.komitmen || 'ada'
      ]
    } else if (tab === 'Laporan') {
      rowValues = [
        formData.id || `${formData.kode_lokus || 'LK'}-B${formData.bulan || 1}`,
        formData.kode_lokus || '',
        parseInt(formData.bulan) || 1,
        formData.tgl_edukasi || new Date().toISOString().slice(0, 10),
        parseInt(formData.peserta) || 0,
        formData.link_foto || '',
        formData.status || 'belum',
        ''
      ]
    } else if (tab === 'Monev') {
      rowValues = [
        formData.tgl || new Date().toISOString().slice(0, 10),
        formData.kode_lokus || '',
        formData.temuan || '',
        formData.tindak_lanjut || '',
        formData.status || 'terbuka'
      ]
    } else {
      rowValues = Object.values(formData)
    }

    setLoading(true)
    await callApi('add', { sheet: tab, row: rowValues })
    setShowAddModal(false)
    setFormData({})
    loadData()
  }

  // Clean White Loading Overlay (Bukan coklat, blur putih bersih)
  const Overlay = () => loading && (
    <div style={ovWrap}>
      <div style={ovBox}>
        <div style={{ width: 36, height: 36, border: '3.5px solid #E2E8F0', borderTopColor: '#2E7D32', borderRadius: '50%', margin: '0 auto 12px auto', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E293B', marginBottom: 4 }}>
          Memuat Data...
        </div>
        <div style={{ fontSize: 12, color: '#64748B' }}>
          Sinkronisasi dengan Google Spreadsheet
        </div>
      </div>
    </div>
  )

  // -------------------------------------------------------------------------
  // 1. TAMPILAN LOGIN
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div style={{ maxWidth: 460, margin: '8vh auto', padding: 20 }}>
        <Overlay />
        
        {/* Header Lembaga BPOM */}
        <div className="wood-board" style={{ padding: '24px 20px', textAlign: 'center', marginBottom: 16 }}>
          <img src="/bpom.png" alt="BPOM" style={{ height: 68, marginBottom: 12, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }} />
          <div style={{ fontSize: 11, color: '#FFE8A3', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
            Balai Besar POM di Mataram
          </div>
          <h2 style={{ fontSize: 17, margin: '6px 0 4px 0', color: '#FFFDF7', lineHeight: 1.4, fontFamily: 'var(--font-farm)' }}>
            Sistem Monitoring dan Evaluasi KIE MBG
          </h2>
          <p style={{ fontSize: 12, color: '#F5EBE6', margin: 0 }}>
            Penerima Manfaat Program Makan Bergizi Gratis • Kab. Lombok Barat
          </p>
        </div>

        {/* Card Form Login */}
        <div className="parchment-card" style={{ padding: 24 }}>
          <h3 style={{ color: '#5D4037', margin: '0 0 16px 0', fontSize: 15, fontFamily: 'var(--font-farm)' }}>
            🌾 Masuk ke Aplikasi
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lb}>Nama Petugas / User:</label>
              <input
                className="farm-input"
                style={{ width: '100%' }}
                placeholder="admin / verif / kader"
                value={u}
                onChange={e => setU(e.target.value)}
              />
            </div>

            <div>
              <label style={lb}>Kata Sandi:</label>
              <input
                type="password"
                className="farm-input"
                style={{ width: '100%' }}
                placeholder="Masukkan password..."
                value={p}
                onChange={e => setP(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={() => handleLogin()}
              className="btn-harvest btn-green"
              style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 4 }}
            >
              Masuk ke Sistem
            </button>
          </div>

          {/* Quick Demo Access */}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px dashed #EADCC2', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 8 }}>
              Pilihan Masuk Cepat (Demo):
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => handleLogin('admin')} className="btn-harvest btn-wood" style={{ fontSize: 11, padding: '4px 10px' }}>
                Admin
              </button>
              <button onClick={() => handleLogin('verifikator')} className="btn-harvest btn-cream" style={{ fontSize: 11, padding: '4px 10px' }}>
                Verifikator
              </button>
              <button onClick={() => handleLogin('kader')} className="btn-harvest btn-cream" style={{ fontSize: 11, padding: '4px 10px' }}>
                Kader
              </button>
            </div>
          </div>

        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // 2. DASHBOARD UTAMA
  // -------------------------------------------------------------------------
  return (
    <div>
      <Overlay />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

      {/* Top Banner BPOM */}
      <div className="wood-board" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/bpom.png" alt="BPOM" style={{ height: 46, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#FFE8A3', color: '#5D4037', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                  Wilayah: Kab. Lombok Barat (NTB)
                </span>
                <span style={{ fontSize: 11, color: '#FFE8A3' }}>Balai Besar POM di Mataram</span>
              </div>
              <h1 style={{ fontSize: 17, margin: '2px 0 0 0', color: '#FFFDF7', lineHeight: 1.3, fontFamily: 'var(--font-farm)' }}>
                Sistem Monitoring & Evaluasi KIE MBG
              </h1>
            </div>
          </div>

          {/* User profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#4E342E', padding: '6px 14px', borderRadius: 12, border: '1px solid #7F4F24' }}>
              <div style={{ fontSize: 9, color: '#FFE8A3', textTransform: 'uppercase', fontWeight: 700 }}>Pengguna</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#FFFDF7' }}>{String(user).toUpperCase()}</div>
            </div>
            <button
              onClick={() => setUser(null)}
              className="btn-harvest btn-danger"
              style={{ padding: '6px 12px', fontSize: 11 }}
            >
              Keluar 🚪
            </button>
          </div>

        </div>
      </div>

      {/* KPI Overview Cards (Lengkap & Proporsional) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 16 }}>
        
        <div className="parchment-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8C6239', textTransform: 'uppercase' }}>Lokus Dipantau</span>
            <span style={{ fontSize: 18 }}>📍</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037', marginTop: 4 }}>{totalLokus} Lokus</div>
          <div style={{ fontSize: 11, color: '#2E7D32', fontWeight: 700, marginTop: 2 }}>
            🌱 {intervensiCount} Intervensi • 🏫 {kontrolCount} Kontrol
          </div>
        </div>

        <div className="parchment-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8C6239', textTransform: 'uppercase' }}>Capaian IKK</span>
            <span style={{ fontSize: 18 }}>🎯</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037', marginTop: 4 }}>28 / 34</div>
          <div style={{ fontSize: 11, color: '#F57F17', fontWeight: 700, marginTop: 2 }}>
            Target Minimal: 34 Lokus
          </div>
        </div>

        <div className="parchment-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8C6239', textTransform: 'uppercase' }}>Rerata N-Gain (g)</span>
            <span style={{ fontSize: 18 }}>📈</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037', marginTop: 4 }}>0.48 g</div>
          <div style={{ fontSize: 11, color: '#2E7D32', fontWeight: 700, marginTop: 2 }}>
            Kategori Efektif (ambang &ge; 0.3)
          </div>
        </div>

        <div className="parchment-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8C6239', textTransform: 'uppercase' }}>Laporan Masuk</span>
            <span style={{ fontSize: 18 }}>📋</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037', marginTop: 4 }}>102 Baris</div>
          <div style={{ fontSize: 11, color: '#8C6239', marginTop: 2 }}>
            Target Edukasi Bulan 1 - 3
          </div>
        </div>

      </div>

      {/* Tabs & Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setDetail(null) }}
              className={`farm-tab ${tab === t.id ? 'farm-tab-active' : 'farm-tab-inactive'}`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Global Actions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setLoading(true); callApi('ikk').then(() => { setLoading(false); loadData(); alert('Perhitungan N-Gain dan IKK berhasil diperbarui!') }) }}
            className="btn-harvest btn-green"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            ✨ Hitung IKK
          </button>
          <button
            onClick={() => { setLoading(true); callApi('seed').then(() => { setLoading(false); loadData(); alert('102 baris laporan berhasil di-generate!') }) }}
            className="btn-harvest btn-gold"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            🌱 Seed 102
          </button>
          <button
            onClick={() => { if (confirm('Isi 12 lokus dummy Lombok Barat?')) { setLoading(true); callApi('dummy').then(() => { setLoading(false); loadData(); alert('12 Lokus berhasil diatur!') }) } }}
            className="btn-harvest btn-wood"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            🎲 Dummy 12
          </button>
        </div>

      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: LOKUS + PETA GIS                                              */}
      {/* --------------------------------------------------------------------- */}
      {tab === 'Lokus' && !detail && (
        <div>
          {/* Peta OpenStreetMap Lombok Barat */}
          <FarmMap
            lokusList={allLokus.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))}
            onPick={openDetail}
          />

          {/* Tabel Lokus */}
          <div className="parchment-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
                <span style={{ fontSize: 15 }}>🔎</span>
                <input
                  className="farm-input"
                  style={{ width: '100%' }}
                  placeholder="Cari nama lokus, kode, atau kecamatan..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                />
              </div>
              <button
                onClick={() => { setFormData({}); setShowAddModal(true) }}
                className="btn-harvest btn-wood"
              >
                + Tambah Lokus Baru
              </button>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #EADCC2' }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama Lokus</th>
                    <th>Kelompok</th>
                    <th>Jenis</th>
                    <th>Wilayah</th>
                    <th>Koordinat</th>
                    <th>Komitmen</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {allLokus
                    .filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))
                    .map(x => {
                      const isIntervensi = String(x.kelompok || '').toLowerCase() === 'intervensi'
                      const isLengkap = String(x.komitmen || '').toLowerCase() === 'ada'
                      return (
                        <tr key={x.kode}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#5D4037' }}>{x.kode}</td>
                          <td>
                            <strong>{x.nama}</strong>
                          </td>
                          <td>
                            <span className={`farm-badge ${isIntervensi ? 'badge-green' : 'badge-wood'}`}>
                              {isIntervensi ? '🌱 Intervensi' : '🏫 Kontrol'}
                            </span>
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>{x.jenis}</td>
                          <td>{x.kec}, {x.kab}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>
                            {x.lat ? `${parseFloat(x.lat).toFixed(3)}, ${parseFloat(x.lng).toFixed(3)}` : '-'}
                          </td>
                          <td>
                            <span className={`farm-badge ${isLengkap ? 'badge-green' : 'badge-gold'}`}>
                              {isLengkap ? '✓ Lengkap' : '⏳ Pending'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => openDetail(x.kode)}
                              className="btn-harvest btn-cream"
                              style={{ padding: '3px 8px', fontSize: 11, marginRight: 4 }}
                            >
                              Detail Riwayat
                            </button>
                            {user !== 'kader' && (
                              <button
                                onClick={() => handleDelete(x._row)}
                                className="btn-harvest btn-danger"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                Hapus
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 10, fontSize: 11, color: '#8C6239' }}>
              Menampilkan {allLokus.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).length} lokus terdata di Kabupaten Lombok Barat.
            </div>
          </div>
        </div>
      )}

      {/* DETAIL LOKUS VIEW */}
      {tab === 'Lokus' && detail && (
        <div className="parchment-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #EADCC2' }}>
            <div>
              <button
                onClick={() => setDetail(null)}
                className="btn-harvest btn-cream"
                style={{ padding: '4px 10px', fontSize: 11, marginBottom: 8 }}
              >
                ‹ Kembali ke Daftar Lokus
              </button>
              <h3 style={{ margin: 0, color: '#5D4037', fontSize: 18, fontFamily: 'var(--font-farm)' }}>
                {detail.info.nama} ({detail.info.kode})
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#8C6239' }}>
                Jenis: <strong style={{ textTransform: 'capitalize' }}>{detail.info.jenis}</strong> • Kelompok: <strong>{detail.info.kelompok}</strong> • Wilayah: <strong>Kec. {detail.info.kec}, {detail.info.kab}</strong> • Komitmen: <strong>{detail.info.komitmen}</strong>
              </p>
            </div>
            {detail.info.lat && detail.info.lng && (
              <a
                href={`https://www.google.com/maps?q=${detail.info.lat},${detail.info.lng}`}
                target="_blank"
                rel="noreferrer"
                className="btn-harvest btn-green"
                style={{ padding: '6px 12px', fontSize: 11 }}
              >
                Buka di Maps ↗
              </a>
            )}
          </div>

          {/* Section Nilai */}
          <h4 style={h4}>📊 Rekap Nilai Pengetahuan & N-Gain</h4>
          {detail.nilai ? (
            <div style={{ background: '#FFFDF9', border: '1px solid #E6D5B8', borderRadius: 10, padding: 12, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8C6239' }}>Rerata Pre-Test:</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#5D4037' }}>{detail.nilai[3]}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8C6239' }}>Rerata Post-Test:</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#2E7D32' }}>{detail.nilai[4]}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8C6239' }}>Peserta (n):</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#5D4037' }}>{detail.nilai[5]} orang</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8C6239' }}>N-Gain (g):</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0284C7' }}>{detail.nilai[6] || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8C6239' }}>Status Peningkatan:</div>
                <span className={`farm-badge ${detail.nilai[7] === 'YA' ? 'badge-green' : 'badge-wood'}`} style={{ marginTop: 2 }}>
                  {detail.nilai[7] === 'YA' ? '✓ Meningkat Signifikan' : 'Belum Mencapai Ambang'}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#8C6239' }}>Belum ada data nilai tersimpan untuk lokus ini.</p>
          )}

          {/* Section Laporan */}
          <h4 style={h4}>📜 Riwayat Pelaksanaan Edukasi (Bulan 1 - 3)</h4>
          {(detail.laporan || []).length === 0 ? (
            <p style={{ fontSize: 12, color: '#8C6239' }}>Belum ada catatan edukasi.</p>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #EADCC2' }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Bulan</th>
                    <th>Tgl Edukasi</th>
                    <th>Jumlah Peserta</th>
                    <th>Status Laporan</th>
                    <th>Bukti Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.laporan.map(r => (
                    <tr key={r[0]}>
                      <td>Bulan {r[3]}</td>
                      <td>{r[4] || '-'}</td>
                      <td>{r[5] ? `${r[5]} peserta` : '-'}</td>
                      <td>
                        <span className={`farm-badge ${r[7] === 'disetujui' ? 'badge-green' : 'badge-gold'}`}>
                          {r[7] === 'disetujui' ? '✓ Disetujui' : '⏳ ' + (r[7] || 'Belum')}
                        </span>
                      </td>
                      <td>
                        {r[6] ? (
                          <a href={r[6]} target="_blank" rel="noreferrer" className="btn-harvest btn-cream" style={{ padding: '2px 8px', fontSize: 11 }}>
                            📷 Buka Foto
                          </a>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section Monev */}
          <h4 style={h4}>🔎 Catatan Monev & Tindak Lanjut</h4>
          {(detail.monev || []).length === 0 ? (
            <p style={{ fontSize: 12, color: '#8C6239' }}>Tidak ada temuan kendala lapangan untuk lokus ini.</p>
          ) : (
            detail.monev.map(r => (
              <div key={r[0]} style={{ background: '#FFFDF9', border: '1px solid #E6D5B8', borderRadius: 8, padding: 10, marginBottom: 6, fontSize: 12 }}>
                <div><strong>Tanggal:</strong> {r[1]} • <strong>Status:</strong> <span className={`farm-badge ${r[5] === 'selesai' ? 'badge-green' : 'badge-gold'}`}>{r[5]}</span></div>
                <div style={{ marginTop: 2 }}><strong>Temuan:</strong> {r[3]}</div>
                <div style={{ marginTop: 2, color: '#2E7D32' }}><strong>Rencana Tindak Lanjut:</strong> {r[4]}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2, 3, 4: LAPORAN / NILAI / MONEV TABLE                           */}
      {/* --------------------------------------------------------------------- */}
      {tab !== 'Lokus' && (
        <div className="parchment-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
              <span style={{ fontSize: 15 }}>🔎</span>
              <input
                className="farm-input"
                style={{ width: '100%' }}
                placeholder={`Cari data ${tab}...`}
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <button
              onClick={() => { setFormData({}); setShowAddModal(true) }}
              className="btn-harvest btn-wood"
            >
              + Tambah {tab} Baru
            </button>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #EADCC2' }}>
            <table className="farm-table">
              <thead>
                <tr>
                  {head.map(h => (
                    <th key={h}>{h === '_row' ? '#' : h.replace('_', ' ')}</th>
                  ))}
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={head.length + 1} style={{ textAlign: 'center', padding: 24, color: '#8C6239' }}>
                      Belum ada data untuk kriteria ini.
                    </td>
                  </tr>
                ) : (
                  rows.map(r => (
                    <tr key={r[0]}>
                      {r.slice(1).map((c, i) => {
                        const col = head[i + 1] || ''
                        if (col === 'status' || col === 'komitmen') {
                          const isOk = ['disetujui', 'selesai', 'ada', 'lengkap'].includes(String(c).toLowerCase())
                          return (
                            <td key={i}>
                              <span className={`farm-badge ${isOk ? 'badge-green' : 'badge-gold'}`}>
                                {isOk ? '✓ ' + c : '⏳ ' + c}
                              </span>
                            </td>
                          )
                        }
                        if (col === 'link_foto' && c) {
                          return (
                            <td key={i}>
                              <a href={c} target="_blank" rel="noreferrer" className="btn-harvest btn-cream" style={{ padding: '2px 8px', fontSize: 11 }}>
                                📷 Foto ↗
                              </a>
                            </td>
                          )
                        }
                        return <td key={i} style={{ fontFamily: ['kode_lokus', 'id', 'tgl', 'g'].includes(col) ? 'monospace' : 'inherit' }}>{String(c)}</td>
                      })}

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {tab === 'Nilai' && (
                          <button
                            onClick={() => setEditNilai({ rowNum: r[0], kode: r[1], kel: r[2], pre: r[3], post: r[4], n: r[5] })}
                            className="btn-harvest btn-cream"
                            style={{ padding: '3px 8px', fontSize: 11, marginRight: 4 }}
                          >
                            Edit Nilai
                          </button>
                        )}
                        {user !== 'kader' && (
                          <button
                            onClick={() => handleDelete(r[0])}
                            className="btn-harvest btn-danger"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: '#8C6239' }}>
            Menampilkan {rows.length} catatan pada lembar {tab}.
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: EDIT NILAI (Clean White Overlay)                              */}
      {/* --------------------------------------------------------------------- */}
      {editNilai && (
        <div style={ovWrap} onClick={() => setEditNilai(null)}>
          <div className="parchment-card" style={{ maxWidth: 420, width: '100%', padding: 22 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#5D4037', margin: '0 0 14px 0', fontFamily: 'var(--font-farm)', fontSize: 16 }}>
              Edit Nilai Edukasi Lokus: {editNilai.kode}
            </h3>
            <form onSubmit={saveNilai} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={lb}>Nilai Pre-Test Mean (Rerata):</label>
                <input
                  type="number"
                  step="any"
                  className="farm-input"
                  style={{ width: '100%' }}
                  value={editNilai.pre}
                  onChange={e => setEditNilai({ ...editNilai, pre: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={lb}>Nilai Post-Test Mean (Rerata):</label>
                <input
                  type="number"
                  step="any"
                  className="farm-input"
                  style={{ width: '100%' }}
                  value={editNilai.post}
                  onChange={e => setEditNilai({ ...editNilai, post: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={lb}>Jumlah Responden (n):</label>
                <input
                  type="number"
                  className="farm-input"
                  style={{ width: '100%' }}
                  value={editNilai.n}
                  onChange={e => setEditNilai({ ...editNilai, n: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setEditNilai(null)} className="btn-harvest btn-cream">
                  Batal
                </button>
                <button type="submit" className="btn-harvest btn-green">
                  Simpan & Hitung N-Gain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: TAMBAH DATA (Clean White Overlay)                             */}
      {/* --------------------------------------------------------------------- */}
      {showAddModal && (
        <div style={ovWrap} onClick={() => setShowAddModal(false)}>
          <div className="parchment-card" style={{ maxWidth: 460, width: '100%', padding: 22 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#5D4037', margin: '0 0 14px 0', fontFamily: 'var(--font-farm)', fontSize: 16 }}>
              + Tambah Catatan {tab}
            </h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tab === 'Lokus' && (
                <>
                  <div>
                    <label style={lb}>Kode Lokus:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="SK-05 / PS-09" value={formData.kode || ''} onChange={e => setFormData({ ...formData, kode: e.target.value })} required />
                  </div>
                  <div>
                    <label style={lb}>Nama Sekolah / Posyandu:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="Nama Lokus..." value={formData.nama || ''} onChange={e => setFormData({ ...formData, nama: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={lb}>Kelompok:</label>
                      <select className="farm-input" style={{ width: '100%' }} value={formData.kelompok || 'intervensi'} onChange={e => setFormData({ ...formData, kelompok: e.target.value })}>
                        <option value="intervensi">Intervensi MBG</option>
                        <option value="kontrol">Kontrol</option>
                      </select>
                    </div>
                    <div>
                      <label style={lb}>Jenis:</label>
                      <select className="farm-input" style={{ width: '100%' }} value={formData.jenis || 'sekolah'} onChange={e => setFormData({ ...formData, jenis: e.target.value })}>
                        <option value="sekolah">Sekolah</option>
                        <option value="posyandu">Posyandu</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={lb}>Latitude (lat):</label>
                      <input type="number" step="any" className="farm-input" style={{ width: '100%' }} placeholder="-8.732" value={formData.lat || ''} onChange={e => setFormData({ ...formData, lat: e.target.value })} />
                    </div>
                    <div>
                      <label style={lb}>Longitude (lng):</label>
                      <input type="number" step="any" className="farm-input" style={{ width: '100%' }} placeholder="116.115" value={formData.lng || ''} onChange={e => setFormData({ ...formData, lng: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {tab === 'Laporan' && (
                <>
                  <div>
                    <label style={lb}>Kode Lokus:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="Contoh: SK-01" value={formData.kode_lokus || ''} onChange={e => setFormData({ ...formData, kode_lokus: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={lb}>Bulan Edukasi (1-3):</label>
                      <input type="number" min="1" max="3" className="farm-input" style={{ width: '100%' }} value={formData.bulan || 1} onChange={e => setFormData({ ...formData, bulan: e.target.value })} />
                    </div>
                    <div>
                      <label style={lb}>Jumlah Peserta:</label>
                      <input type="number" className="farm-input" style={{ width: '100%' }} placeholder="45" value={formData.peserta || ''} onChange={e => setFormData({ ...formData, peserta: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label style={lb}>Link Bukti Foto Google Drive:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="https://drive.google.com/..." value={formData.link_foto || ''} onChange={e => setFormData({ ...formData, link_foto: e.target.value })} />
                  </div>
                </>
              )}

              {tab === 'Monev' && (
                <>
                  <div>
                    <label style={lb}>Kode Lokus:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="SK-01 / PS-01" value={formData.kode_lokus || ''} onChange={e => setFormData({ ...formData, kode_lokus: e.target.value })} required />
                  </div>
                  <div>
                    <label style={lb}>Temuan Lapangan:</label>
                    <textarea className="farm-input" style={{ width: '100%', height: 64 }} placeholder="Uraian temuan kendala..." value={formData.temuan || ''} onChange={e => setFormData({ ...formData, temuan: e.target.value })} required />
                  </div>
                  <div>
                    <label style={lb}>Rencana Tindak Lanjut:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="Solusi tindak lanjut..." value={formData.tindak_lanjut || ''} onChange={e => setFormData({ ...formData, tindak_lanjut: e.target.value })} />
                  </div>
                </>
              )}

              {tab === 'Nilai' && (
                <div>
                  <label style={lb}>Baris Nilai (format: kode, kelompok, pre, post, n):</label>
                  <input className="farm-input" style={{ width: '100%' }} placeholder="SK-05, intervensi, 55, 80, 100" value={formData.raw || ''} onChange={e => setFormData({ ...formData, raw: e.target.value })} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-harvest btn-cream">
                  Batal
                </button>
                <button type="submit" className="btn-harvest btn-green">
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

const lb = { display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 3 }
const h4 = { color: '#5D4037', margin: '14px 0 8px 0', fontSize: 13, fontWeight: 800 }

// Clean White Overlay & Card (Bukan coklat!)
const ovWrap = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20
}

const ovBox = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  padding: '24px 36px',
  textAlign: 'center',
  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.12)'
}
