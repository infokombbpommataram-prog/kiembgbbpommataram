import { useEffect, useState } from 'react'
import FarmMap from './FarmMap'

const API = import.meta.env.VITE_GAS_URL || ''
const TABS = [
  { id: 'Lokus', label: '🌾 Daftar Lokus', icon: '🌾' },
  { id: 'Peta', label: '🗺️ Peta Lembah GIS', icon: '🗺️' },
  { id: 'Laporan', label: '📜 Catatan Edukasi', icon: '📜' },
  { id: 'Nilai', label: '⚖️ Timbangan Nilai', icon: '⚖️' },
  { id: 'Monev', label: '🔎 Patroli Monev', icon: '🔎' }
]

// Fallback dummy data if GAS API fails (403 or offline)
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
  if (!API) {
    return { ok: 0, offline: true, error: 'VITE_GAS_URL belum disetel.' }
  }
  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, ...body })
    })
    if (!r.ok) {
      return { ok: 0, status: r.status, error: `HTTP ${r.status}` }
    }
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
  const [apiError, setApiError] = useState(null)

  // Login credentials state
  const [u, setU] = useState('')
  const [p, setP] = useState('')

  // Add Item Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({})

  // Stats calculation
  const totalLokus = allLokus.length
  const intervensiCount = allLokus.filter(x => String(x.kelompok || x.kel).toLowerCase() === 'intervensi').length
  const kontrolCount = totalLokus - intervensiCount

  const loadData = async () => {
    if (tab === 'Peta') {
      // Load Lokus data specifically for the map
      setLoading(true)
      const res = await callApi('read', { sheet: 'Lokus', q: '' })
      setLoading(false)
      if (res && res.rows && res.rows.length) {
        // Map rows to structured objects
        const parsed = res.rows.map(r => ({
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
        setAllLokus(parsed)
      }
      return
    }

    setLoading(true)
    const res = await callApi('read', { sheet: tab, q })
    setLoading(false)

    if (res && res.head) {
      setHead(res.head)
      setRows(res.rows || [])
      setApiError(null)

      if (tab === 'Lokus') {
        const parsed = (res.rows || []).map(r => ({
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
        if (parsed.length) setAllLokus(parsed)
      }
    } else {
      // Fallback mode if offline / 403
      if (res.error) setApiError(res.error)
      if (tab === 'Lokus') {
        setHead(['_row', 'kode', 'nama', 'kelompok', 'jenis', 'kab', 'kec', 'lat', 'lng', 'komitmen'])
        const filtered = FALLBACK_LOKUS.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))
        setRows(filtered.map((x, i) => [i + 2, x.kode, x.nama, x.kelompok, x.jenis, x.kab, x.kec, x.lat, x.lng, x.komitmen]))
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
          [3, '2027-02-05', 'PS-01', 'Kehadiran ibu balita minim', 'Gandeng kader PKK desa', 'terbuka']
        ])
      }
    }
  }

  useEffect(() => {
    if (user) loadData()
  }, [user, tab])

  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => loadData(), 350)
    return () => clearTimeout(t)
  }, [q])

  // Handle Login
  const handleLogin = async (overrideUser = null) => {
    const username = overrideUser || u
    const password = overrideUser ? 'demo' : p

    if (overrideUser) {
      setUser(overrideUser)
      return
    }

    setLoading(true)
    const r = await callApi('login', { u: username, p: password })
    setLoading(false)

    if (r && r.ok) {
      setUser(r.role || 'admin')
    } else {
      if (r.error && (r.error.includes('403') || r.status === 403)) {
        alert("Peringatan 403: Akses Google Apps Script diblokir.\nPastikan di Apps Script: 'Deploy > Manage Deployments > Who has access: Anyone'.\n\nUntuk saat ini, Anda bisa masuk menggunakan tombol Demo di bawah!")
      } else {
        alert("Password atau username salah, atau backend belum terhubung.\nGunakan tombol 'Masuk Cepat Demo' di bawah untuk menguji frontend!")
      }
    }
  }

  // Handle Delete Row
  const handleDelete = async (rowNum) => {
    if (!confirm(`Cabut baris ke-${rowNum} dari catatan ${tab}?`)) return
    setLoading(true)
    await callApi('del', { sheet: tab, rowNum })
    loadData()
  }

  // Handle Add Submit
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

  // -------------------------------------------------------------
  // LOGIN SCREEN (Harvest Moon Gate / Welcome to Farm)
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div style={{ maxWidth: 440, margin: '8vh auto', padding: 20 }}>
        <div className="wood-board" style={{ padding: '24px 20px', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏡</div>
          <div style={{ fontSize: 11, color: '#FFE8A3', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            Desa Sehat • Lembah Lombok Barat
          </div>
          <h2 style={{ fontFamily: 'var(--font-farm)', fontSize: 24, margin: '4px 0 8px 0', color: '#FFFDF7' }}>
            Kebun Sehat Monev KIE MBG
          </h2>
          <p style={{ fontSize: 12, color: '#F5EBE6', margin: 0 }}>
            Sistem Informasi Monitoring & Evaluasi Makan Bergizi Gratis
          </p>
        </div>

        <div className="parchment-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-farm)', color: '#5D4037', margin: '0 0 16px 0', fontSize: 16 }}>
            🌾 Masuk ke Lumbung Data
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8C6239', marginBottom: 4 }}>
                Nama Petugas / Mandor:
              </label>
              <input
                className="farm-input"
                style={{ width: '100%' }}
                placeholder="admin / verif / kader"
                value={u}
                onChange={e => setU(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8C6239', marginBottom: 4 }}>
                Kunci Rahasia (Password):
              </label>
              <input
                type="password"
                className="farm-input"
                style={{ width: '100%' }}
                placeholder="Masukkan kata sandi..."
                value={p}
                onChange={e => setP(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={() => handleLogin()}
              className="btn-harvest btn-green"
              style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 4 }}
              disabled={loading}
            >
              {loading ? '⏳ Membuka Gerbang...' : '🌻 Masuk ke Kebun'}
            </button>
          </div>

          {/* Quick Demo Access Bar */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px dashed #EADCC2', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 8 }}>
              ⚡ Masuk Cepat Sebagai Demo (Tanpa Password):
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => handleLogin('admin')} className="btn-harvest btn-wood" style={{ fontSize: 11, padding: '4px 10px' }}>
                👨‍🌾 Admin
              </button>
              <button onClick={() => handleLogin('verifikator')} className="btn-harvest btn-cream" style={{ fontSize: 11, padding: '4px 10px' }}>
                📋 Verifikator
              </button>
              <button onClick={() => handleLogin('kader')} className="btn-harvest btn-cream" style={{ fontSize: 11, padding: '4px 10px' }}>
                👩‍⚕️ Kader Desa
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // MAIN DASHBOARD (Harvest Moon Farm Atmosphere)
  // -------------------------------------------------------------
  return (
    <div>
      
      {/* 1. TOP WOODEN SIGNBOARD BANNER */}
      <div className="wood-board" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 54,
              height: 54,
              background: '#FFE494',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
              border: '2px solid #D7B152'
            }}>
              🏡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#FFE8A3', color: '#5D4037', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                  ☀️ Cuaca: Cerah • Musim Panen Gizi
                </span>
                <span style={{ fontSize: 11, color: '#FFE8A3' }}>Lombok Barat (NTB)</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-farm)', fontSize: 22, margin: '2px 0 0 0', color: '#FFFDF7' }}>
                Kebun Sehat Monev KIE MBG
              </h1>
            </div>
          </div>

          {/* User profile & Stamina Meter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            
            {/* Stamina Hearts */}
            <div style={{ background: 'rgba(88, 47, 14, 0.8)', padding: '6px 12px', borderRadius: 12, border: '1px solid #A06030' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#FFE494', textTransform: 'uppercase' }}>
                Stamina IKK (Target 34)
              </div>
              <div style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>❤️❤️❤️❤️🤍</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#FFF8E7' }}>28 Lolos</span>
              </div>
            </div>

            {/* Logout pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#4E342E', padding: '6px 12px', borderRadius: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#FFFDF7' }}>
                  {user.toUpperCase()}
                </div>
                <div style={{ fontSize: 9, color: '#FFE8A3' }}>Petugas Monev</div>
              </div>
              <button
                onClick={() => setUser(null)}
                className="btn-harvest btn-danger"
                style={{ padding: '4px 8px', fontSize: 10 }}
                title="Keluar dari Kebun"
              >
                Keluar 🚪
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS (Harvest Silo & Barn Style) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        
        <div className="parchment-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8C6239', textTransform: 'uppercase' }}>Lahan Lokus</span>
            <span style={{ fontSize: 20 }}>🌻</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037', marginTop: 4 }}>{totalLokus} Lokus</div>
          <div style={{ fontSize: 11, color: '#2E7D32', fontWeight: 700, marginTop: 2 }}>
            🌱 {intervensiCount} Intervensi • 🏡 {kontrolCount} Kontrol
          </div>
        </div>

        <div className="parchment-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8C6239', textTransform: 'uppercase' }}>Capaian Target IKK</span>
            <span style={{ fontSize: 20 }}>🎯</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037', marginTop: 4 }}>28 / 34</div>
          <div style={{ fontSize: 11, color: '#F57F17', fontWeight: 700, marginTop: 2 }}>
            Sisa 6 lokus capai target
          </div>
        </div>

        <div className="parchment-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8C6239', textTransform: 'uppercase' }}>Rerata Kesuburan (g)</span>
            <span style={{ fontSize: 20 }}>🍎</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037', marginTop: 4 }}>0.48 g</div>
          <div style={{ fontSize: 11, color: '#2E7D32', fontWeight: 700, marginTop: 2 }}>
            Kategori Efektif (g &ge; 0.3)
          </div>
        </div>

        <div className="parchment-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8C6239', textTransform: 'uppercase' }}>Keranjang Catatan</span>
            <span style={{ fontSize: 20 }}>🧺</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037', marginTop: 4 }}>102 Baris</div>
          <div style={{ fontSize: 11, color: '#8C6239', marginTop: 2 }}>
            Bulan 1 - Bulan 3 Terjadwal
          </div>
        </div>

      </div>

      {/* 3. TABS NAVIGATION & FARM TOOLBAR */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        
        {/* Farm Belt Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`farm-tab ${tab === t.id ? 'farm-tab-active' : 'farm-tab-inactive'}`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Action Triggers */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setLoading(true); callApi('ikk').then(() => { setLoading(false); loadData(); alert('Perhitungan N-Gain dan IKK selesai dihitung!') }) }}
            className="btn-harvest btn-green"
            disabled={loading}
          >
            ✨ Hitung IKK
          </button>
          <button
            onClick={() => { setLoading(true); callApi('seed').then(() => { setLoading(false); loadData(); alert('102 baris laporan berhasil di-generate!') }) }}
            className="btn-harvest btn-gold"
            disabled={loading}
          >
            🌱 Seed 102
          </button>
          <button
            onClick={() => { if (confirm('Isi 12 lokus dummy Lombok Barat?')) { setLoading(true); callApi('dummy').then(() => { setLoading(false); loadData(); alert('12 Lokus Lombok Barat siap!') }) } }}
            className="btn-harvest btn-wood"
            disabled={loading}
          >
            🎲 Dummy 12
          </button>
        </div>

      </div>

      {/* 4. CONTENT AREA: MAP OR DATA TABLE */}
      {tab === 'Peta' ? (
        <FarmMap lokusList={allLokus} />
      ) : (
        <div className="parchment-card" style={{ padding: 18 }}>
          
          {/* Search Bar & Add Button */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
              <span style={{ fontSize: 16 }}>🔎</span>
              <input
                className="farm-input"
                style={{ width: '100%' }}
                placeholder={`Cari data ${tab} (nama lokus, kode, kader, dll)...`}
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>

            <button
              onClick={() => { setFormData({}); setShowAddModal(true) }}
              className="btn-harvest btn-wood"
              style={{ padding: '9px 16px' }}
            >
              <span>+</span> Buka Catatan {tab} Baru
            </button>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '2px solid #EADCC2' }}>
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
                      {loading ? '⏳ Sedang memuat data dari lumbung...' : 'Belum ada data catatan untuk kriteria ini.'}
                    </td>
                  </tr>
                ) : (
                  rows.map(r => (
                    <tr key={r[0]}>
                      {r.map((cell, idx) => {
                        const colName = head[idx] || ''
                        
                        // Formatter for status
                        if (colName === 'kelompok') {
                          const isIntervensi = String(cell).toLowerCase() === 'intervensi'
                          return (
                            <td key={idx}>
                              <span className={`farm-badge ${isIntervensi ? 'badge-green' : 'badge-wood'}`}>
                                {isIntervensi ? '🌱 Intervensi' : '🏡 Kontrol'}
                              </span>
                            </td>
                          )
                        }

                        if (colName === 'status' || colName === 'komitmen') {
                          const isOk = ['ada', 'disetujui', 'selesai', 'lengkap'].includes(String(cell).toLowerCase())
                          return (
                            <td key={idx}>
                              <span className={`farm-badge ${isOk ? 'badge-green' : 'badge-gold'}`}>
                                {isOk ? '✓ ' + cell : '⏳ ' + cell}
                              </span>
                            </td>
                          )
                        }

                        if (colName === 'link_foto' && cell) {
                          return (
                            <td key={idx}>
                              <a
                                href={cell}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-harvest btn-cream"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                📷 Bukti Foto ↗
                              </a>
                            </td>
                          )
                        }

                        return (
                          <td key={idx} style={{ fontFamily: ['_row', 'kode', 'lat', 'lng', 'tgl'].includes(colName) ? 'monospace' : 'inherit' }}>
                            {cell}
                          </td>
                        )
                      })}

                      {/* Action column */}
                      <td style={{ textAlign: 'right' }}>
                        {user !== 'kader' && (
                          <button
                            onClick={() => handleDelete(r[0])}
                            className="btn-harvest btn-danger"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            title="Cabut baris ini"
                          >
                            Cabut ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#8C6239' }}>
            <span>Menampilkan <strong>{rows.length}</strong> catatan di lembar {tab}</span>
            <span>{loading ? '⏳ Menghubungkan...' : '🟢 Siap'}</span>
          </div>

        </div>
      )}

      {/* 5. ADD ITEM MODAL DIALOG (Harvest Moon Parchment Style) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="parchment-card" style={{ maxWidth: 480, width: '100%', padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '2px solid #EADCC2', paddingBottom: 10 }}>
              <h3 style={{ fontFamily: 'var(--font-farm)', color: '#5D4037', margin: 0, fontSize: 16 }}>
                🌾 Tambah Data ke Lembar {tab}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', color: '#8C6239' }}>✕</button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tab === 'Lokus' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Kode Lokus:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="Contoh: SK-05 atau PS-09" value={formData.kode || ''} onChange={e => setFormData({ ...formData, kode: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Nama Sekolah / Posyandu:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="Nama Lokus..." value={formData.nama || ''} onChange={e => setFormData({ ...formData, nama: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Kelompok:</label>
                      <select className="farm-input" style={{ width: '100%' }} value={formData.kelompok || 'intervensi'} onChange={e => setFormData({ ...formData, kelompok: e.target.value })}>
                        <option value="intervensi">Intervensi MBG</option>
                        <option value="kontrol">Kontrol</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Jenis Lokus:</label>
                      <select className="farm-input" style={{ width: '100%' }} value={formData.jenis || 'sekolah'} onChange={e => setFormData({ ...formData, jenis: e.target.value })}>
                        <option value="sekolah">Sekolah</option>
                        <option value="posyandu">Posyandu</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Latitude (Lat):</label>
                      <input type="number" step="any" className="farm-input" style={{ width: '100%' }} placeholder="-8.732" value={formData.lat || ''} onChange={e => setFormData({ ...formData, lat: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Longitude (Lng):</label>
                      <input type="number" step="any" className="farm-input" style={{ width: '100%' }} placeholder="116.115" value={formData.lng || ''} onChange={e => setFormData({ ...formData, lng: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {tab === 'Laporan' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Kode Lokus:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="Contoh: SK-01" value={formData.kode_lokus || ''} onChange={e => setFormData({ ...formData, kode_lokus: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Bulan Edukasi (1-3):</label>
                      <input type="number" min="1" max="3" className="farm-input" style={{ width: '100%' }} value={formData.bulan || 1} onChange={e => setFormData({ ...formData, bulan: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Jumlah Peserta:</label>
                      <input type="number" className="farm-input" style={{ width: '100%' }} placeholder="Jumlah siswa/ibu" value={formData.peserta || ''} onChange={e => setFormData({ ...formData, peserta: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Link Foto Drive:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="https://drive.google.com/..." value={formData.link_foto || ''} onChange={e => setFormData({ ...formData, link_foto: e.target.value })} />
                  </div>
                </>
              )}

              {tab === 'Monev' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Kode Lokus:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="SK-01 / PS-01" value={formData.kode_lokus || ''} onChange={e => setFormData({ ...formData, kode_lokus: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Temuan Lapangan:</label>
                    <textarea className="farm-input" style={{ width: '100%', height: 60 }} placeholder="Uraian temuan..." value={formData.temuan || ''} onChange={e => setFormData({ ...formData, temuan: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Rencana Tindak Lanjut:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="Solusi tindak lanjut..." value={formData.tindak_lanjut || ''} onChange={e => setFormData({ ...formData, tindak_lanjut: e.target.value })} />
                  </div>
                </>
              )}

              {tab === 'Nilai' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 2 }}>Data Baris Nilai (Koma dipisah):</label>
                  <input className="farm-input" style={{ width: '100%' }} placeholder="kode, kelompok, pre_mean, post_mean, n" value={formData.raw || ''} onChange={e => setFormData({ ...formData, raw: e.target.value })} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-harvest btn-cream">
                  Batal
                </button>
                <button type="submit" className="btn-harvest btn-green">
                  🌱 Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
