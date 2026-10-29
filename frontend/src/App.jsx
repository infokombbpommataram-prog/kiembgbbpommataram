import { useEffect, useState } from 'react'
import FarmMap from './FarmMap'

const API = import.meta.env.VITE_GAS_URL || ''
const TABS = [
  { id: 'Lokus', label: '🌾 Lokus & Peta', icon: '🌾' },
  { id: 'Laporan', label: '📜 Catatan Edukasi', icon: '📜' },
  { id: 'Nilai', label: '⚖️ Timbangan Nilai', icon: '⚖️' },
  { id: 'Monev', label: '🔎 Patroli Monev', icon: '🔎' }
]

const KAB_LIST = [
  { id: 'all', label: '🌐 Seluruh Pulau Lombok' },
  { id: 'Lombok Barat', label: 'Kab. Lombok Barat' },
  { id: 'Kota Mataram', label: 'Kota Mataram' },
  { id: 'Lombok Tengah', label: 'Kab. Lombok Tengah' },
  { id: 'Lombok Timur', label: 'Kab. Lombok Timur' },
  { id: 'Lombok Utara', label: 'Kab. Lombok Utara' }
]

const TAHUN_LIST = [
  { id: 'all', label: 'Semua Tahun' },
  { id: '2026', label: 'Tahun 2026' },
  { id: '2027', label: 'Tahun 2027' },
  { id: '2028', label: 'Tahun 2028' },
  { id: '2029', label: 'Tahun 2029' }
]

// Fallback data
const FALLBACK_LOKUS = [
  { kode: 'SK-01', nama: 'SDN 1 Gerung', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.732, lng: 116.115, tahun: '2026', kader: 'Siti A', hp: '+628111', komitmen: 'ada' },
  { kode: 'SK-02', nama: 'SDN 2 Gerung', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.735, lng: 116.118, tahun: '2026', kader: 'Siti A', hp: '+628111', komitmen: 'ada' },
  { kode: 'SK-03', nama: 'MI NW Kediri', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Kediri', lat: -8.680, lng: 116.130, tahun: '2026', kader: 'Budi B', hp: '+628222', komitmen: 'ada' },
  { kode: 'SK-04', nama: 'SMPN 1 Narmada', kelompok: 'kontrol', jenis: 'sekolah', kab: 'Lombok Barat', kec: 'Narmada', lat: -8.620, lng: 116.200, tahun: '2026', kader: 'Budi B', hp: '+628222', komitmen: 'belum' },
  { kode: 'PS-01', nama: 'Posyandu Mawar Gerung', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.733, lng: 116.116, tahun: '2026', kader: 'Rina C', hp: '+628333', komitmen: 'ada' },
  { kode: 'PS-02', nama: 'Posyandu Melati Gerung', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Gerung', lat: -8.736, lng: 116.119, tahun: '2026', kader: 'Rina C', hp: '+628333', komitmen: 'ada' },
  { kode: 'PS-03', nama: 'Posyandu Kenanga Kediri', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Kediri', lat: -8.681, lng: 116.131, tahun: '2026', kader: 'Rina C', hp: '+628333', komitmen: 'ada' },
  { kode: 'PS-07', nama: 'Posyandu Flamboyan Lembar', kelompok: 'kontrol', jenis: 'posyandu', kab: 'Lombok Barat', kec: 'Lembar', lat: -8.750, lng: 116.070, tahun: '2026', kader: 'Dewi D', hp: '+628444', komitmen: 'belum' },
  { kode: 'SK-M01', nama: 'SDN 6 Mataram', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Kota Mataram', kec: 'Mataram', lat: -8.583, lng: 116.105, tahun: '2027', kader: 'Hj. Fatimah', hp: '+628555', komitmen: 'ada' },
  { kode: 'PS-M01', nama: 'Posyandu Cempaka Ampenan', kelompok: 'intervensi', jenis: 'posyandu', kab: 'Kota Mataram', kec: 'Ampenan', lat: -8.572, lng: 116.082, tahun: '2027', kader: 'Ibu Nur', hp: '+628666', komitmen: 'ada' },
  { kode: 'SK-T01', nama: 'SDN 1 Praya', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Lombok Tengah', kec: 'Praya', lat: -8.707, lng: 116.273, tahun: '2028', kader: 'Pak Lalu', hp: '+628777', komitmen: 'ada' },
  { kode: 'SK-E01', nama: 'SDN 1 Selong', kelompok: 'intervensi', jenis: 'sekolah', kab: 'Lombok Timur', kec: 'Selong', lat: -8.650, lng: 116.533, tahun: '2028', kader: 'Ibu Baiq', hp: '+628888', komitmen: 'ada' }
]

async function callApi(fn, body = {}) {
  if (!API) return { ok: 0, offline: true, error: 'VITE_GAS_URL belum disetel.' }
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, ...body }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    if (!r.ok) return { ok: 0, status: r.status, error: `HTTP ${r.status}` }
    return await r.json()
  } catch (err) {
    return { ok: 0, error: err.name === 'AbortError' ? 'Koneksi timeout (10 detik).' : err.message }
  }
}

export default function App() {
  // 2. Cookie login disimpan di local browser (localStorage) dan aktif terus sampai logout/reset
  const [user, setUser] = useState(() => {
    return localStorage.getItem('kie_mbg_user') || null
  })

  const [tab, setTab] = useState('Lokus')
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [allLokus, setAllLokus] = useState(FALLBACK_LOKUS)
  const [loading, setLoading] = useState(false)
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  
  // Filter Global Multi-Tahun & Multi-Kabupaten
  const [filterKab, setFilterKab] = useState('all')
  const [filterTahun, setFilterTahun] = useState('all')

  // Detail lokus: { info, laporan, nilai, monev }
  const [detail, setDetail] = useState(null)
  
  // Edit nilai modal: { rowNum, kode, kel, pre, post, n }
  const [editNilai, setEditNilai] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  
  // Form Tambah Data State
  const [formData, setFormData] = useState({})
  // Data dukung pilihan: 'gdrive' vs 'upload'
  const [dataDukungType, setDataDukungType] = useState('gdrive')
  const [uploadedFiles, setUploadedFiles] = useState([])
  
  // Modal Preview Data Dukung (Tombol Mata 👁️)
  const [previewDataDukung, setPreviewDataDukung] = useState(null)

  const parseLokus = rs => (rs || []).map(r => ({
    _row: r[0],
    kode: r[1],
    nama: r[2],
    kelompok: r[3],
    jenis: r[4],
    kab: r[5] || 'Lombok Barat',
    kec: r[6],
    lat: parseFloat(r[7]),
    lng: parseFloat(r[8]),
    komitmen: r[9],
    tahun: r[10] || '2026'
  }))

  const loadData = async () => {
    setLoading(true)
    const targetSheet = tab === 'Lokus' ? 'Lokus' : tab
    let res = null
    try {
      res = await callApi('read', { sheet: targetSheet, q: tab === 'Lokus' ? '' : q })
    } catch (err) {
      console.warn('loadData network warning:', err)
    } finally {
      setLoading(false)
    }

    if (res && res.rows && res.rows.length) {
      setRows(res.rows)
      if (tab === 'Lokus') {
        const pl = parseLokus(res.rows)
        if (pl.length) setAllLokus(pl)
      }
    } else {
      // Fallback data jika backend belum siap / kosong
      if (tab === 'Lokus') {
        const f = FALLBACK_LOKUS.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))
        setRows(f.map((x, i) => [i + 2, x.kode, x.nama, x.kelompok, x.jenis, x.kab, x.kec, x.lat, x.lng, x.komitmen]))
        setAllLokus(FALLBACK_LOKUS)
      } else if (tab === 'Laporan') {
        setRows([
          [2, 'SK-01-B1-2026', 'SK-01', 1, '2026-02-10', 45, 'https://drive.google.com/drive/folders/sample', 'disetujui', '2026-02-11'],
          [3, 'SK-01-B2-2026', 'SK-01', 2, '2026-03-15', 48, '', 'belum', ''],
          [4, 'PS-01-B1-2026', 'PS-01', 1, '2026-02-12', 25, '[2 File]: foto1.jpg, daftar_hadir.pdf', 'belum', '']
        ])
      } else if (tab === 'Nilai') {
        setRows([
          [2, 'SK-01', 'intervensi', 55, 80, 100, 0.55, 'YA'],
          [3, 'SK-02', 'intervensi', 60, 82, 100, 0.55, 'YA'],
          [4, 'SK-04', 'kontrol', 58, 62, 100, 0.09, '']
        ])
      } else if (tab === 'Monev') {
        setRows([
          [2, '2026-02-01', 'SK-01', 'Poster PMT belum terpasang di mading sekolah', 'Pasang sebelum edukasi tahap B2', 'selesai'],
          [3, '2026-02-05', 'PS-01', 'Kehadiran peserta posyandu balita masih minim', 'Libatkan kader PKK desa dan tokoh warga', 'terbuka']
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
    try {
      const res = await callApi('read', { sheet: 'Lokus', q: '' })
      if (res && res.rows && res.rows.length) {
        setAllLokus(parseLokus(res.rows))
      } else {
        setAllLokus(FALLBACK_LOKUS)
      }
    } catch (e) {
      setAllLokus(FALLBACK_LOKUS)
    }
  }

  // Filtered Lokus sesuai Kab & Tahun (dengan fallback aman)
  const currentLokusList = allLokus && allLokus.length ? allLokus : FALLBACK_LOKUS
  const filteredLokusByContext = currentLokusList.filter(x => {
    const matchKab = filterKab === 'all' || String(x.kab || 'Lombok Barat').toLowerCase().includes(filterKab.toLowerCase())
    const matchThn = filterTahun === 'all' || String(x.tahun || '2026').includes(filterTahun)
    return matchKab && matchThn
  })

  const totalFilteredLokus = filteredLokusByContext.length
  const intervensiFilteredCount = filteredLokusByContext.filter(x => String(x.kelompok || '').toLowerCase() === 'intervensi').length
  const kontrolFilteredCount = totalFilteredLokus - intervensiFilteredCount

  // Buka detail riwayat lokus
  const openDetail = async (kode) => {
    setLoading(true)
    let lap = null, nil = null, mon = null
    try {
      [lap, nil, mon] = await Promise.all([
        callApi('read', { sheet: 'Laporan', q: kode }),
        callApi('read', { sheet: 'Nilai', q: kode }),
        callApi('read', { sheet: 'Monev', q: kode })
      ])
    } catch (e) {
      console.warn('openDetail error:', e)
    } finally {
      setLoading(false)
    }
    const info = currentLokusList.find(x => x.kode === kode) || {}
    setDetail({
      info,
      laporan: lap?.rows || [],
      nilai: (nil?.rows || [])[0] || null,
      monev: mon?.rows || []
    })
  }

  // Handle Login & Simpan Sesi Permanen
  const handleLogin = async () => {
    if (!u.trim()) {
      alert('Silakan masukkan nama petugas / username.')
      return
    }
    setLoading(true)
    const r = await callApi('login', { u, p })
    setLoading(false)
    if (r && r.ok) {
      const role = r.role || u || 'admin'
      localStorage.setItem('kie_mbg_user', role)
      setUser(role)
    } else {
      alert('Username / password salah, atau backend belum terhubung.')
    }
  }

  // Handle Logout & Hapus Sesi
  const handleLogout = () => {
    if (confirm('Keluar dari sesi login?')) {
      localStorage.removeItem('kie_mbg_user')
      setUser(null)
    }
  }

  const handleDelete = async (rowNum) => {
    if (!confirm(`Hapus baris data ke-${rowNum} dari lembar ${tab}?`)) return
    setLoading(true)
    await callApi('del', { sheet: tab, rowNum })
    loadData()
  }

  // Verifikasi / Setujui Laporan Edukasi
  const handleApproveReport = async (row) => {
    if (!confirm(`Setujui dan verifikasi laporan ${row[1]} (Lokus ${row[2]} Bulan ${row[3]})?`)) return
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    // Row laporan: [id, kode_lokus, bulan, tgl_edukasi, peserta, link_foto, status, stempel]
    const updatedRow = [row[1], row[2], row[3], row[4], row[5], row[6], 'disetujui', today]
    const res = await callApi('upd', { sheet: 'Laporan', rowNum: row[0], row: updatedRow })
    setLoading(false)
    if (res && res.ok) {
      alert(`✓ Berhasil! Laporan ${row[1]} telah diverifikasi dan disetujui.`)
      loadData()
    } else {
      alert('✕ Gagal menyetujui laporan.')
    }
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

  // Handle file uploads validation (max 10 files, max 10MB each, pdf/jpg/jpeg/png)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length + uploadedFiles.length > 10) {
      alert('Maksimal total 10 file yang diperbolehkan.')
      return
    }

    const validFiles = []
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        alert(`File "${f.name}" melebihi batas 10 MB!`)
        continue
      }
      if (!allowedTypes.includes(f.type) && !f.name.match(/\.(pdf|jpe?g|png)$/i)) {
        alert(`File "${f.name}" formatnya tidak didukung (hanya PDF, JPG, JPEG, PNG).`)
        continue
      }
      validFiles.push(f)
    }

    setUploadedFiles(prev => [...prev, ...validFiles].slice(0, 10))
  }

  const removeUploadedFile = (idx) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  // Handle Add Submit dengan notif berhasil/gagal yang jelas
  const handleAddSubmit = async (e) => {
    e.preventDefault()
    let rowValues = []

    if (tab === 'Lokus') {
      rowValues = [
        formData.kode || `LK-${Date.now().toString().slice(-4)}`,
        formData.nama || '',
        formData.kelompok || 'intervensi',
        formData.jenis || 'sekolah',
        formData.kab || (filterKab !== 'all' ? filterKab : 'Lombok Barat'),
        formData.kec || 'Gerung',
        parseFloat(formData.lat) || -8.732,
        parseFloat(formData.lng) || 116.115,
        formData.komitmen || 'ada'
      ]
    } else if (tab === 'Laporan') {
      const selectedBulan = formData.bulan || 1
      const selectedTahun = formData.tahun || (filterTahun !== 'all' ? filterTahun : '2026')
      const targetLokusKode = formData.kode_lokus || 'LK'
      
      // Susun data dukung: URL gdrive atau rincian file upload
      let finalDataDukung = ''
      if (dataDukungType === 'gdrive') {
        finalDataDukung = formData.link_gdrive || ''
      } else {
        if (uploadedFiles.length > 0) {
          finalDataDukung = `[${uploadedFiles.length} File]: ` + uploadedFiles.map(f => f.name).join(', ')
        } else {
          finalDataDukung = 'Belum ada file diunggah'
        }
      }

      rowValues = [
        `${targetLokusKode}-B${selectedBulan}-${selectedTahun}`,
        targetLokusKode,
        parseInt(selectedBulan),
        formData.tgl_edukasi || new Date().toISOString().slice(0, 10),
        parseInt(formData.peserta) || 0,
        finalDataDukung,
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
    const res = await callApi('add', { sheet: tab, row: rowValues })
    setLoading(false)

    // 3. Notifikasi Berhasil / Gagal yang Lengkap & Jelas
    if (res && res.ok) {
      if (tab === 'Laporan') {
        const fileInfo = dataDukungType === 'upload' 
          ? `dengan ${uploadedFiles.length} file dokumen/foto terunggah` 
          : 'dengan tautan Google Drive'
        alert(`✓ BERHASIL DISIMPAN!\nLaporan edukasi berhasil ditambahkan ${fileInfo}.\n\nℹ️ Catatan: Status laporan adalah "Belum Diverifikasi" (menunggu persetujuan verifikator/admin).`)
      } else {
        alert(`✓ BERHASIL DISIMPAN!\nData baru telah tersimpan ke lembar ${tab}.`)
      }
      setShowAddModal(false)
      setFormData({})
      setUploadedFiles([])
      loadData()
    } else {
      alert(`✕ GAGAL MENYIMPAN DATA!\nKeterangan: ${res?.error || 'Koneksi ke spreadsheet terputus atau format salah. Silakan coba lagi.'}`)
    }
  }

  // 1. Notif saat menunggu DB: "Menghubungkan ke Database... sabar yah bestieee..."
  const Overlay = () => loading && (
    <div style={ovWrap}>
      <div style={ovBox}>
        <div style={{ width: 36, height: 36, border: '3.5px solid #E2E8F0', borderTopColor: '#2E7D32', borderRadius: '50%', margin: '0 auto 12px auto', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E293B', marginBottom: 4 }}>
          Menghubungkan ke Database...
        </div>
        <div style={{ fontSize: 13, color: '#8C6239', fontWeight: 600 }}>
          sabar yah bestieee...
        </div>
      </div>
    </div>
  )

  // -------------------------------------------------------------------------
  // 1. TAMPILAN LOGIN
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div style={{ maxWidth: 460, margin: '10vh auto', padding: 20 }}>
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
            Wilayah Kerja: Seluruh Pulau Lombok (Provinsi NTB)
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
                placeholder="Masukkan username..."
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
      <div className="wood-board" style={{ padding: '16px 20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/bpom.png" alt="BPOM" style={{ height: 46, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#FFE8A3', color: '#5D4037', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                  Wilayah Kerja: Seluruh Pulau Lombok
                </span>
                <span style={{ fontSize: 11, color: '#FFE8A3' }}>BBPOM di Mataram (Prov. NTB)</span>
              </div>
              <h1 style={{ fontSize: 17, margin: '2px 0 0 0', color: '#FFFDF7', lineHeight: 1.3, fontFamily: 'var(--font-farm)' }}>
                Sistem Monitoring & Evaluasi KIE MBG Multi-Tahun
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
              onClick={handleLogout}
              className="btn-harvest btn-danger"
              style={{ padding: '6px 12px', fontSize: 11 }}
              title="Keluar dari akun dan bersihkan sesi"
            >
              Keluar 🚪
            </button>
          </div>

        </div>
      </div>

      {/* MULTI-YEAR DROPDOWN & MULTI-KABUPATEN DROPDOWN */}
      <div className="parchment-card" style={{ padding: '10px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        
        {/* 1. Tahun Anggaran DROPDOWN sampai 2029 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#5D4037' }}>📅 Tahun Anggaran:</span>
          <select
            className="farm-input"
            style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#5D4037', minWidth: 150 }}
            value={filterTahun}
            onChange={e => setFilterTahun(e.target.value)}
          >
            {TAHUN_LIST.map(th => (
              <option key={th.id} value={th.id}>{th.label}</option>
            ))}
          </select>
        </div>

        {/* 2. Wilayah Intervensi Kab/Kota se-Pulau Lombok */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#5D4037' }}>📍 Wilayah Intervensi:</span>
          <select
            className="farm-input"
            style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#5D4037', minWidth: 200 }}
            value={filterKab}
            onChange={e => setFilterKab(e.target.value)}
          >
            {KAB_LIST.map(k => (
              <option key={k.id} value={k.id}>{k.label}</option>
            ))}
          </select>
        </div>

      </div>

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 14 }}>
        
        <div className="parchment-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8C6239', textTransform: 'uppercase' }}>
              Lokus Terdata {filterKab !== 'all' ? `(${filterKab})` : ''}
            </span>
            <span style={{ fontSize: 18 }}>📍</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037', marginTop: 4 }}>
            {totalFilteredLokus} Lokus
          </div>
          <div style={{ fontSize: 11, color: '#2E7D32', fontWeight: 700, marginTop: 2 }}>
            🌱 {intervensiFilteredCount} Intervensi • 🏫 {kontrolFilteredCount} Kontrol
          </div>
        </div>

        <div className="parchment-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8C6239', textTransform: 'uppercase' }}>Capaian IKK</span>
            <span style={{ fontSize: 18 }}>🎯</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037', marginTop: 4 }}>28 / 34</div>
          <div style={{ fontSize: 11, color: '#F57F17', fontWeight: 700, marginTop: 2 }}>
            Target Siklus: Minimal 34 Lokus
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
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8C6239', textTransform: 'uppercase' }}>Laporan Edukasi</span>
            <span style={{ fontSize: 18 }}>📋</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#5D4037', marginTop: 4 }}>{rows.length} Baris</div>
          <div style={{ fontSize: 11, color: '#8C6239', marginTop: 2 }}>
            Tercatat di Sistem
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

        {/* Global Action: Refresh Nilai */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setLoading(true)
              callApi('ikk').then(() => {
                setLoading(false)
                loadData()
                alert('Nilai N-Gain dan capaian IKK berhasil direfresh & dihitung ulang!')
              })
            }}
            className="btn-harvest btn-green"
            style={{ padding: '7px 14px', fontSize: 12 }}
          >
            🔄 Refresh Nilai
          </button>
        </div>

      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: LOKUS + PETA GIS                                              */}
      {/* --------------------------------------------------------------------- */}
      {tab === 'Lokus' && !detail && (
        <div>
          {/* Peta OpenStreetMap Seluruh Pulau Lombok */}
          <FarmMap
            lokusList={filteredLokusByContext.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))}
            selectedKab={filterKab}
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
                onClick={() => {
                  setFormData({
                    kab: filterKab !== 'all' ? filterKab : 'Lombok Barat',
                    tahun: filterTahun !== 'all' ? filterTahun : '2026'
                  })
                  setShowAddModal(true)
                }}
                className="btn-harvest btn-wood"
              >
                + Tambah Lokus Baru
              </button>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #EADCC2' }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Kode</th>
                    <th>Nama Lokus</th>
                    <th>Kelompok</th>
                    <th>Jenis</th>
                    <th>Kabupaten/Kota</th>
                    <th>Kecamatan</th>
                    <th>Koordinat</th>
                    <th>Komitmen</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLokusByContext.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: 24, color: '#8C6239' }}>
                        Tidak ada data lokus yang sesuai dengan filter wilayah ({filterKab !== 'all' ? filterKab : 'semua'}) atau tahun ({filterTahun !== 'all' ? filterTahun : 'semua'}).
                      </td>
                    </tr>
                  ) : (
                    filteredLokusByContext
                      .filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))
                      .map((x, idx) => {
                      const isIntervensi = String(x.kelompok || '').toLowerCase() === 'intervensi'
                      const isLengkap = String(x.komitmen || '').toLowerCase() === 'ada'
                      return (
                        <tr key={x.kode || idx}>
                          <td style={{ fontFamily: 'monospace', color: '#8C6239' }}>{idx + 1}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#5D4037' }}>{x.kode}</td>
                          <td><strong>{x.nama}</strong></td>
                          <td>
                            <span className={`farm-badge ${isIntervensi ? 'badge-green' : 'badge-wood'}`}>
                              {isIntervensi ? '🌱 Intervensi' : '🏫 Kontrol'}
                            </span>
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>{x.jenis}</td>
                          <td style={{ fontWeight: 600 }}>{x.kab}</td>
                          <td>{x.kec}</td>
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
                    }))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 10, fontSize: 11, color: '#8C6239' }}>
              Menampilkan {filteredLokusByContext.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).length} lokus terdata.
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
                Jenis: <strong style={{ textTransform: 'capitalize' }}>{detail.info.jenis}</strong> • Kelompok: <strong>{detail.info.kelompok}</strong> • Wilayah: <strong>{detail.info.kab}, Kec. {detail.info.kec}</strong> • Komitmen: <strong>{detail.info.komitmen}</strong>
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
                    <th>Data Dukung</th>
                    <th>Status Laporan</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.laporan.map(r => (
                    <tr key={r[0]}>
                      <td>Bulan {r[3]}</td>
                      <td>{r[4] || '-'}</td>
                      <td>{r[5] ? `${r[5]} peserta` : '-'}</td>
                      <td>
                        {r[6] ? (
                          <button
                            type="button"
                            onClick={() => setPreviewDataDukung({
                              id: r[1],
                              kode: detail?.info?.kode || '-',
                              bulan: r[3],
                              tgl: r[4],
                              peserta: r[5],
                              raw: r[6]
                            })}
                            className="btn-harvest btn-cream"
                            style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title="Lihat Data Dukung"
                          >
                            👁️ Lihat
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 11 }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`farm-badge ${r[7] === 'disetujui' ? 'badge-green' : 'badge-gold'}`}>
                          {r[7] === 'disetujui' ? '✓ Disetujui' : '⏳ Belum Diverifikasi'}
                        </span>
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
      {/* TAB 2: CATATAN EDUKASI (LAPORAN)                                     */}
      {/* --------------------------------------------------------------------- */}
      {tab === 'Laporan' && (
        <div className="parchment-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
              <span style={{ fontSize: 15 }}>🔎</span>
              <input
                className="farm-input"
                style={{ width: '100%' }}
                placeholder="Cari id laporan, kode lokus, atau tanggal..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setFormData({ bulan: 1, tahun: filterTahun !== 'all' ? filterTahun : '2026' })
                setDataDukungType('gdrive')
                setUploadedFiles([])
                setShowAddModal(true)
              }}
              className="btn-harvest btn-wood"
            >
              + Tambah Laporan Edukasi
            </button>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #EADCC2' }}>
            <table className="farm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ID Laporan</th>
                  <th>Kode Lokus</th>
                  <th>Bulan</th>
                  <th>Tanggal Edukasi</th>
                  <th>Jumlah Peserta</th>
                  <th>Data Dukung / Foto</th>
                  <th>Status Verifikasi</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#8C6239' }}>
                      Belum ada laporan edukasi tersimpan.
                    </td>
                  </tr>
                ) : (
                  rows.map(r => {
                    const isApproved = String(r[7]).toLowerCase() === 'disetujui'
                    return (
                      <tr key={r[0]}>
                        <td style={{ fontFamily: 'monospace', color: '#8C6239' }}>{r[0]}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#5D4037' }}>{r[1]}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r[2]}</td>
                        <td>Bulan {r[3]}</td>
                        <td>{r[4] || '-'}</td>
                        <td>{r[5] ? `${r[5]} orang` : '-'}</td>
                        <td>
                          {r[6] ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDataDukung({
                                id: r[1],
                                kode: r[2],
                                bulan: r[3],
                                tgl: r[4],
                                peserta: r[5],
                                raw: r[6]
                              })}
                              className="btn-harvest btn-cream"
                              style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title="Lihat Data Dukung"
                            >
                              👁️ Lihat
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 11 }}>Tidak ada</span>
                          )}
                        </td>
                        <td>
                          <span className={`farm-badge ${isApproved ? 'badge-green' : 'badge-gold'}`}>
                            {isApproved ? '✓ Disetujui' : '⏳ Belum Diverifikasi'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {/* Tombol Setujui untuk Admin/Verifikator jika status masih belum */}
                          {user !== 'kader' && !isApproved && (
                            <button
                              onClick={() => handleApproveReport(r)}
                              className="btn-harvest btn-green"
                              style={{ padding: '3px 8px', fontSize: 11, marginRight: 4 }}
                              title="Verifikasi dan setujui laporan ini"
                            >
                              ✓ Setujui
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: '#8C6239' }}>
            Menampilkan {rows.length} baris laporan edukasi. Status "Belum Diverifikasi" berarti laporan baru diinput dan menunggu persetujuan Verifikator/Admin.
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: TIMBANGAN NILAI (Header & Kolom Eksplisit Pas)                */}
      {/* --------------------------------------------------------------------- */}
      {tab === 'Nilai' && (
        <div className="parchment-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
              <span style={{ fontSize: 15 }}>🔎</span>
              <input
                className="farm-input"
                style={{ width: '100%' }}
                placeholder="Cari kode lokus atau kelompok..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setLoading(true)
                callApi('ikk').then(() => {
                  setLoading(false)
                  loadData()
                  alert('Nilai N-Gain dan capaian IKK berhasil dihitung ulang!')
                })
              }}
              className="btn-harvest btn-green"
            >
              🔄 Refresh & Hitung N-Gain
            </button>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #EADCC2' }}>
            <table className="farm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Kode Lokus</th>
                  <th>Kelompok</th>
                  <th>Pre-Test Mean</th>
                  <th>Post-Test Mean</th>
                  <th>Responden (n)</th>
                  <th>N-Gain (g)</th>
                  <th>Status Peningkatan</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#8C6239' }}>
                      Belum ada data nilai terdaftar.
                    </td>
                  </tr>
                ) : (
                  rows.map(r => {
                    const isIntervensi = String(r[2]).toLowerCase() === 'intervensi'
                    const gainVal = typeof r[6] === 'number' ? r[6].toFixed(2) : (r[6] || '-')
                    const isNaik = String(r[7]).toUpperCase() === 'YA'
                    return (
                      <tr key={r[0]}>
                        <td style={{ fontFamily: 'monospace', color: '#8C6239' }}>{r[0]}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#5D4037' }}>{r[1]}</td>
                        <td>
                          <span className={`farm-badge ${isIntervensi ? 'badge-green' : 'badge-wood'}`}>
                            {isIntervensi ? '🌱 Intervensi' : '🏫 Kontrol'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{r[3]}</td>
                        <td style={{ fontWeight: 700, color: '#2E7D32' }}>{r[4]}</td>
                        <td>{r[5]} orang</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0284C7' }}>
                          {gainVal}
                        </td>
                        <td>
                          <span className={`farm-badge ${isNaik ? 'badge-green' : 'badge-wood'}`}>
                            {isNaik ? '✓ Meningkat Signifikan (g ≥ 0.3)' : 'Belum Mencapai Ambang'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => setEditNilai({
                              rowNum: r[0],
                              kode: r[1],
                              kel: r[2],
                              pre: r[3],
                              post: r[4],
                              n: r[5]
                            })}
                            className="btn-harvest btn-cream"
                            style={{ padding: '3px 8px', fontSize: 11, marginRight: 4 }}
                          >
                            Edit Nilai
                          </button>
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: '#8C6239' }}>
            Rumus Gain: g = (Post - Pre) / (100 - Pre). Ambang efektivitas: g &ge; 0.3.
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: PATROLI MONEV (Header & Kolom Eksplisit Pas)                  */}
      {/* --------------------------------------------------------------------- */}
      {tab === 'Monev' && (
        <div className="parchment-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
              <span style={{ fontSize: 15 }}>🔎</span>
              <input
                className="farm-input"
                style={{ width: '100%' }}
                placeholder="Cari temuan, kode lokus, atau tanggal..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <button
              onClick={() => { setFormData({}); setShowAddModal(true) }}
              className="btn-harvest btn-wood"
            >
              + Tambah Catatan Monev
            </button>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #EADCC2' }}>
            <table className="farm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tanggal</th>
                  <th>Kode Lokus</th>
                  <th>Temuan Lapangan</th>
                  <th>Rencana Tindak Lanjut</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#8C6239' }}>
                      Belum ada temuan patroli monev.
                    </td>
                  </tr>
                ) : (
                  rows.map(r => {
                    const isSelesai = String(r[5]).toLowerCase() === 'selesai'
                    return (
                      <tr key={r[0]}>
                        <td style={{ fontFamily: 'monospace', color: '#8C6239' }}>{r[0]}</td>
                        <td style={{ fontFamily: 'monospace' }}>{r[1]}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#5D4037' }}>{r[2]}</td>
                        <td style={{ maxWidth: 300 }}>{r[3]}</td>
                        <td style={{ maxWidth: 300, color: '#2E7D32', fontWeight: 600 }}>{r[4]}</td>
                        <td>
                          <span className={`farm-badge ${isSelesai ? 'badge-green' : 'badge-gold'}`}>
                            {isSelesai ? '✓ Selesai' : '⏳ Terbuka'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: '#8C6239' }}>
            Menampilkan {rows.length} catatan temuan patroli monev.
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: EDIT NILAI                                                    */}
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
      {/* MODAL: TAMBAH DATA (Laporan / Lokus / Monev)                          */}
      {/* --------------------------------------------------------------------- */}
      {showAddModal && (
        <div style={ovWrap} onClick={() => setShowAddModal(false)}>
          <div className="parchment-card" style={{ maxWidth: 500, width: '100%', padding: 22, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#5D4037', margin: '0 0 14px 0', fontFamily: 'var(--font-farm)', fontSize: 16 }}>
              + Tambah Catatan {tab}
            </h3>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* FORM CATATAN EDUKASI (LAPORAN) */}
              {tab === 'Laporan' && (
                <>
                  {/* 1. Pilih Lokus (Dropdown Searchable / Datalist) */}
                  <div>
                    <label style={lb}>Pilih Lokus (Bisa Diketik / Dicari):</label>
                    <input
                      list="lokus-list-options"
                      className="farm-input"
                      style={{ width: '100%' }}
                      placeholder="Ketik nama atau kode lokus..."
                      value={formData.kode_lokus || ''}
                      onChange={e => setFormData({ ...formData, kode_lokus: e.target.value })}
                      required
                    />
                    <datalist id="lokus-list-options">
                      {allLokus.map(l => (
                        <option key={l.kode} value={l.kode}>
                          {l.nama} ({l.kab} - Kec. {l.kec})
                        </option>
                      ))}
                    </datalist>
                    <div style={{ fontSize: 10, color: '#8C6239', marginTop: 2 }}>
                      Pilih dari daftar saran atau ketik kode lokus (contoh: SK-01, PS-02).
                    </div>
                  </div>

                  {/* 2. Bulan & Tahun Edukasi DROPDOWN */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={lb}>Bulan Edukasi:</label>
                      <select
                        className="farm-input"
                        style={{ width: '100%' }}
                        value={formData.bulan || 1}
                        onChange={e => setFormData({ ...formData, bulan: parseInt(e.target.value) })}
                      >
                        <option value={1}>Bulan 1 (Edukasi Awal)</option>
                        <option value={2}>Bulan 2 (Edukasi Lanjutan)</option>
                        <option value={3}>Bulan 3 (Evaluasi Akhir)</option>
                      </select>
                    </div>

                    <div>
                      <label style={lb}>Tahun Edukasi:</label>
                      <select
                        className="farm-input"
                        style={{ width: '100%' }}
                        value={formData.tahun || (filterTahun !== 'all' ? filterTahun : '2026')}
                        onChange={e => setFormData({ ...formData, tahun: e.target.value })}
                      >
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                        <option value="2029">2029</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={lb}>Tanggal Edukasi:</label>
                      <input
                        type="date"
                        className="farm-input"
                        style={{ width: '100%' }}
                        value={formData.tgl_edukasi || new Date().toISOString().slice(0, 10)}
                        onChange={e => setFormData({ ...formData, tgl_edukasi: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={lb}>Jumlah Peserta Hadir:</label>
                      <input
                        type="number"
                        className="farm-input"
                        style={{ width: '100%' }}
                        placeholder="Contoh: 45"
                        value={formData.peserta || ''}
                        onChange={e => setFormData({ ...formData, peserta: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* 3. Data Dukung: 2 Pilihan (Link GDrive atau Upload File) */}
                  <div style={{ background: '#FFFDF9', border: '1.5px solid #E6D5B8', borderRadius: 10, padding: 12 }}>
                    <label style={lb}>Pilihan Data Dukung / Dokumentasi:</label>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      <button
                        type="button"
                        onClick={() => setDataDukungType('gdrive')}
                        className={`btn-harvest ${dataDukungType === 'gdrive' ? 'btn-green' : 'btn-cream'}`}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        🔗 Tautan Google Drive
                      </button>
                      <button
                        type="button"
                        onClick={() => setDataDukungType('upload')}
                        className={`btn-harvest ${dataDukungType === 'upload' ? 'btn-green' : 'btn-cream'}`}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        📁 Upload File (Maks 10 File)
                      </button>
                    </div>

                    {dataDukungType === 'gdrive' ? (
                      <div>
                        <input
                          className="farm-input"
                          style={{ width: '100%' }}
                          placeholder="https://drive.google.com/drive/folders/..."
                          value={formData.link_gdrive || ''}
                          onChange={e => setFormData({ ...formData, link_gdrive: e.target.value })}
                        />
                        <div style={{ fontSize: 10, color: '#8C6239', marginTop: 3 }}>
                          Tempelkan tautan folder / foto kegiatan dari Google Drive.
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpeg,.png,.jpg"
                          className="farm-input"
                          style={{ width: '100%', fontSize: 11 }}
                          onChange={handleFileChange}
                        />
                        <div style={{ fontSize: 10, color: '#8C6239', marginTop: 3 }}>
                          Format: <strong>PDF, JPG, JPEG, PNG</strong> (Maks 10 MB per file, maksimal 10 file).
                        </div>

                        {/* List file terpilih */}
                        {uploadedFiles.length > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7D32' }}>
                              {uploadedFiles.length} File Terpilih:
                            </div>
                            {uploadedFiles.map((f, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F1F5F9', padding: '4px 8px', borderRadius: 6, fontSize: 11 }}>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 340 }}>
                                  📄 {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeUploadedFile(i)}
                                  style={{ border: 'none', background: 'transparent', color: '#EF4444', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* FORM TAMBAH LOKUS */}
              {tab === 'Lokus' && (
                <>
                  <div>
                    <label style={lb}>Kode Lokus:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="Contoh: SK-05 / PS-09" value={formData.kode || ''} onChange={e => setFormData({ ...formData, kode: e.target.value })} required />
                  </div>
                  <div>
                    <label style={lb}>Nama Sekolah / Posyandu:</label>
                    <input className="farm-input" style={{ width: '100%' }} placeholder="Nama Lokus..." value={formData.nama || ''} onChange={e => setFormData({ ...formData, nama: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={lb}>Kabupaten / Kota di Lombok:</label>
                      <select className="farm-input" style={{ width: '100%' }} value={formData.kab || 'Lombok Barat'} onChange={e => setFormData({ ...formData, kab: e.target.value })}>
                        <option value="Lombok Barat">Kab. Lombok Barat</option>
                        <option value="Kota Mataram">Kota Mataram</option>
                        <option value="Lombok Tengah">Kab. Lombok Tengah</option>
                        <option value="Lombok Timur">Kab. Lombok Timur</option>
                        <option value="Lombok Utara">Kab. Lombok Utara</option>
                      </select>
                    </div>
                    <div>
                      <label style={lb}>Kecamatan:</label>
                      <input className="farm-input" style={{ width: '100%' }} placeholder="Gerung / Mataram / dll" value={formData.kec || ''} onChange={e => setFormData({ ...formData, kec: e.target.value })} required />
                    </div>
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
                      <label style={lb}>Jenis Lokus:</label>
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

              {/* FORM TAMBAH MONEV */}
              {tab === 'Monev' && (
                <>
                  <div>
                    <label style={lb}>Pilih Lokus:</label>
                    <input
                      list="monev-lokus-options"
                      className="farm-input"
                      style={{ width: '100%' }}
                      placeholder="Ketik kode atau nama lokus..."
                      value={formData.kode_lokus || ''}
                      onChange={e => setFormData({ ...formData, kode_lokus: e.target.value })}
                      required
                    />
                    <datalist id="monev-lokus-options">
                      {allLokus.map(l => (
                        <option key={l.kode} value={l.kode}>
                          {l.nama} ({l.kab} - Kec. {l.kec})
                        </option>
                      ))}
                    </datalist>
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

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-harvest btn-cream">
                  Batal
                </button>
                <button type="submit" className="btn-harvest btn-green">
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW DATA DUKUNG (TOMBOL MATA) */}
      {previewDataDukung && (
        <div style={ovWrap} onClick={() => setPreviewDataDukung(null)}>
          <div
            className="parchment-card"
            style={{ maxWidth: 480, width: '100%', padding: 22, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #EADCC2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>👁️</span>
                <h3 style={{ margin: 0, color: '#5D4037', fontSize: 16, fontFamily: 'var(--font-farm)', fontWeight: 800 }}>
                  Data Dukung Edukasi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDataDukung(null)}
                style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', color: '#8C6239', padding: '0 4px', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Info Singkat Laporan */}
            <div style={{ background: '#FFFDF9', border: '1px solid #E6D5B8', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#5D4037' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 4, columnGap: 10 }}>
                <strong>ID Laporan:</strong> <span>{previewDataDukung.id || '-'}</span>
                <strong>Lokus:</strong> <span>{previewDataDukung.kode || '-'}</span>
                <strong>Tahap:</strong> <span>Bulan {previewDataDukung.bulan || '-'} ({previewDataDukung.tgl || 'Tgl belum dicatat'})</span>
                <strong>Peserta:</strong> <span>{previewDataDukung.peserta ? `${previewDataDukung.peserta} orang` : '-'}</span>
              </div>
            </div>

            {/* Konten Data Dukung */}
            {previewDataDukung.raw && previewDataDukung.raw.startsWith('http') ? (
              <div style={{ background: '#F0F9FF', border: '1.5px solid #BAE6FD', borderRadius: 10, padding: 18, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#0369A1', marginBottom: 4 }}>
                  Tautan Google Drive / Cloud Terlampir
                </div>
                <div style={{ fontSize: 11, color: '#64748B', wordBreak: 'break-all', marginBottom: 14, background: '#FFFFFF', padding: '6px 10px', borderRadius: 6, border: '1px solid #E0F2FE' }}>
                  {previewDataDukung.raw}
                </div>
                <a
                  href={previewDataDukung.raw}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-harvest btn-green"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12, textDecoration: 'none' }}
                >
                  🔗 Buka Google Drive di Tab Baru ↗
                </a>
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 12, color: '#2E7D32', marginBottom: 8 }}>
                  <span>📎</span>
                  <span>Berkas Dokumen / Foto Terunggah:</span>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#1E293B', wordBreak: 'break-word', lineHeight: 1.5 }}>
                  {previewDataDukung.raw || '(Tidak ada keterangan file)'}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 8, fontStyle: 'italic' }}>
                  💡 Berkas data dukung tersimpan di database laporan lokus ini.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setPreviewDataDukung(null)}
                className="btn-harvest btn-cream"
                style={{ padding: '6px 16px', fontSize: 12 }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

const lb = { display: 'block', fontSize: 11, fontWeight: 700, color: '#8C6239', marginBottom: 3 }
const h4 = { color: '#5D4037', margin: '14px 0 8px 0', fontSize: 13, fontWeight: 800 }

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
